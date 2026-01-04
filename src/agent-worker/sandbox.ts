/**
 * Sandbox utilities for Daytona sandboxed environments
 */
import { Daytona, type Sandbox } from "@daytonaio/sdk";
import type { ExecutionArtifacts } from "@daytonaio/sdk/src/types/ExecuteResponse";

/**
 * Create a new sandbox
 */
export async function createSandbox(language: "typescript" | "javascript" | "python"): Promise<Sandbox> {
  const apiKey = process.env.SANDBOX_API_KEY;
  if (!apiKey) {
    throw new Error("Sandbox API key is not configured. Please set SANDBOX_API_KEY environment variable.");
  }

  const daytona = new Daytona({ apiKey });
  
  const sandbox = await daytona.create({
    language,
    // Disallow ALL outbound network access from this sandbox.
    networkBlockAll: true,
    ephemeral: true, // Ephemeral sandbox (not persisted)
    autoStopInterval: 2, // Auto-stop after 2 minute of inactivity (server-side fallback)
  });

  console.log(`Sandbox created with ID: ${sandbox.id}, language: ${language}`);
  return sandbox;
}

/**
 * Delete a sandbox by its instance or ID
 */
export async function deleteSandbox(sandboxOrId: Sandbox | string): Promise<void> {
  const apiKey = process.env.SANDBOX_API_KEY;
  if (!apiKey) {
    throw new Error("Sandbox API key is not configured. Please set SANDBOX_API_KEY environment variable.");
  }

  const daytona = new Daytona({ apiKey });
  
  try {
    if (typeof sandboxOrId === "string") {
      // If given an ID, we need to get the sandbox first
      const sandbox = await daytona.get(sandboxOrId);
      await daytona.delete(sandbox);
      console.log(`Sandbox ${sandboxOrId} deleted successfully`);
    } else {
      const sandboxId = sandboxOrId.id;
      await daytona.delete(sandboxOrId);
      console.log(`Sandbox ${sandboxId} deleted successfully`);
    }
  } catch (error) {
    console.error("Error deleting sandbox:", error);
    throw error;
  }
}

/**
 * Get an existing sandbox by ID
 */
export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  const apiKey = process.env.SANDBOX_API_KEY;
  if (!apiKey) {
    throw new Error("Sandbox API key is not configured. Please set SANDBOX_API_KEY environment variable.");
  }

  const daytona = new Daytona({ apiKey });
  return daytona.get(sandboxId);
}

/**
 * Check if an error indicates the sandbox is unavailable
 */
function isSandboxUnavailableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("unavailable") ||
      message.includes("not found") ||
      message.includes("expired") ||
      message.includes("does not exist") ||
      message.includes("sandbox") && message.includes("error")
    );
  }
  return false;
}

/**
 * Execute code in a sandbox with automatic retry on sandbox unavailability
 */
export async function executeInSandbox(
  sandbox: Sandbox,
  code: string,
  options?: {
    timeout?: number;
    language?: "typescript" | "javascript" | "python";
    onSandboxRecreated?: (newSandbox: Sandbox) => void;
    abortSignal?: AbortSignal;
  }
): Promise<{ exitCode: number; result: string; artifacts?: ExecutionArtifacts; newSandbox?: Sandbox }> {
  const timeout = options?.timeout ?? 30;
  const abortSignal = options?.abortSignal;

  function createAbortError(): Error {
    const error = new Error("Operation aborted");
    error.name = "AbortError";
    return error;
  }

  function withAbort<T>(promise: Promise<T>): Promise<T> {
    if (!abortSignal) return promise;
    if (abortSignal.aborted) return Promise.reject(createAbortError());

    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        abortSignal.removeEventListener("abort", onAbort);
        reject(createAbortError());
      };

      abortSignal.addEventListener("abort", onAbort, { once: true });

      promise.then(
        (value) => {
          abortSignal.removeEventListener("abort", onAbort);
          resolve(value);
        },
        (error) => {
          abortSignal.removeEventListener("abort", onAbort);
          reject(error);
        }
      );
    });
  }
  
  try {
    const response = await withAbort(sandbox.process.codeRun(code, undefined, timeout));
    console.log(`Code execution completed with exit code: ${response.exitCode} with artifacts ${response.artifacts ? response.artifacts.stdout : "none"}`);
    return response;
  } catch (error) {
    // If sandbox is unavailable and we have a language to recreate it, try again
    if (isSandboxUnavailableError(error) && options?.language) {
      console.log(`Sandbox unavailable, creating new ${options.language} sandbox and retrying...`);
      
      const newSandbox = await createSandbox(options.language);
      
      // Notify caller about the new sandbox so they can update their reference
      if (options.onSandboxRecreated) {
        options.onSandboxRecreated(newSandbox);
      }
      
      const response = await withAbort(newSandbox.process.codeRun(code, undefined, timeout));
      console.log(`Code execution completed with exit code: ${response.exitCode} with artifacts ${response.artifacts ? response.artifacts.stdout : "none"}`);
      return { ...response, newSandbox };
    }
    
    // Re-throw if we can't recover
    throw error;
  }
}

/**
 * Get or create a sandbox - reuses existing if sandboxId provided and valid
 */
export async function getOrCreateSandbox(
  language: "typescript" | "javascript" | "python",
  existingSandboxId?: string | null
): Promise<Sandbox> {
  // Try to reuse existing sandbox
  if (existingSandboxId) {
    try {
      const sandbox = await getSandbox(existingSandboxId);

      // Safety: ensure the sandbox has outbound networking blocked.
      // If this sandbox was created before we started enforcing networkBlockAll,
      // fall back to creating a fresh sandbox.
      if (!sandbox.networkBlockAll) {
        console.log(
          `Existing sandbox ${existingSandboxId} does not have networkBlockAll enabled; creating a new sandbox`
        );
        return createSandbox(language);
      }

      console.log(`Reusing existing sandbox ${existingSandboxId}`);
      return sandbox;
    } catch (error) {
      console.log(`Existing sandbox ${existingSandboxId} not found or expired, creating new one`);
    }
  }

  // Create new sandbox
  return createSandbox(language);
}

