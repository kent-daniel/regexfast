/**
 * Regex Agent - Option A Simple Implementation
 * Programmatic loop with AI SDK for regex generation
 *
 * Architecture:
 * - GENERATE: Vercel AI Gateway (generateObject with structured output)
 * - EXECUTE: Daytona Sandbox (isolated regex testing)
 * - REFLECT: Vercel AI Gateway (generateText for failure analysis)
 * 
 * @module regex-agent
 */

import type { GatewayProvider } from "@ai-sdk/gateway";
import type { Sandbox } from "@daytonaio/sdk";

import { getOrCreateSandbox } from "../../sandbox";
import { generate } from "./agent-generate";
import { execute } from "./agent-execute";
import { reflect } from "./agent-reflect";
import { compactHistory } from "./utils";
import { DEFAULT_MAX_ITERATIONS } from "./constants";
import type {
  RegexRequest,
  RegexCandidate,
  IterationResult,
  RegexGenerationResult,
  SandboxRuntime,
} from "./types";
import { isMatchMode, isCaptureMode } from "./types";

// ─────────────────────────────────────────────────────────────
// Options interface for cleaner function signature
// ─────────────────────────────────────────────────────────────

/**
 * Options for the generateRegex function
 */
export interface GenerateRegexOptions {
  /** Maximum number of iterations before giving up (default: 5) */
  maxIterations?: number;
  /** Target runtime: "javascript" or "python" (default: "javascript") */
  runtime?: SandboxRuntime;
  /** Reuse an existing sandbox for efficiency */
  existingSandboxId?: string | null;
  /** Include iteration history in the result (default: false) */
  includeHistory?: boolean;
  /** Vercel AI Gateway provider (required) */
  gateway: GatewayProvider;
  /** Abort signal to stop generation early */
  abortSignal?: AbortSignal;
  /** Optional status emitter for UI/main-loop observability */
  emitStatus?: (event: {
    phase: "generating" | "executing" | "evaluating";
    iteration: number;
    maxIterations: number;
    message?: string;
  }) => void;
}

// ─────────────────────────────────────────────────────────────
// Main generation loop
// ─────────────────────────────────────────────────────────────

/**
 * Generate a regex pattern that satisfies the given requirements
 * 
 * Uses a GENERATE → EXECUTE → REFLECT loop to iteratively improve
 * the regex until all test cases pass or max iterations is reached.
 * 
 * @param request - The regex requirements (description + test cases)
 * @param options - Generation options (gateway is required)
 * @returns The generated regex with success status
 */
export async function generateRegex(
  request: RegexRequest,
  options: GenerateRegexOptions
): Promise<RegexGenerationResult> {
  // Destructure options with defaults
  const {
    maxIterations = DEFAULT_MAX_ITERATIONS,
    runtime = "javascript",
    existingSandboxId,
    includeHistory = false,
    gateway,
    abortSignal,
    emitStatus,
  } = options;

  const isAborted = () => Boolean(abortSignal?.aborted);
  const createAbortedResult = (
    params: {
      sandboxId: string;
      iterations: number;
      candidate?: RegexCandidate | null;
      history?: IterationResult[];
    }
  ): RegexGenerationResult => {
    return {
      ...(params.candidate ?? { pattern: ".*", flags: "" }),
      success: false,
      aborted: true,
      error: "Operation aborted by user",
      iterations: params.iterations,
      sandboxId: params.sandboxId,
      runtime,
      ...(includeHistory && params.history ? { history: params.history } : {}),
    };
  };

  // Validate mode-specific fields using structural checks
  if (isMatchMode(request)) {
    if (!request.shouldMatch?.length && !request.shouldNotMatch?.length) {
      throw new Error(
        "Match mode requires at least one shouldMatch or shouldNotMatch example"
      );
    }
  } else if (isCaptureMode(request)) {
    if (!request.captureTests?.length) {
      throw new Error(
        "Capture mode requires at least one captureTest"
      );
    }
  } else {
    throw new Error(
      "Request must be either match mode (with shouldMatch/shouldNotMatch) or capture mode (with captureTests)"
    );
  }

  // Get or create Daytona sandbox (reuse for efficiency)
  const mode = isMatchMode(request) ? "match" : "capture";

  if (isAborted()) {
    // We don't have a sandbox yet; create one only if already provided.
    // Best-effort: return a minimal aborted result.
    const sandboxId = existingSandboxId ?? "";
    return createAbortedResult({ sandboxId, iterations: 0, candidate: null, history: [] });
  }
  
  // Use ref pattern for sandbox to avoid closure mutation anti-pattern
  const sandboxRef: { current: Sandbox } = {
    current: await getOrCreateSandbox(runtime, existingSandboxId),
  };
  console.log(`[RegexAgent] Using sandbox: ${sandboxRef.current.id} (${runtime}), mode: ${mode}`);

  // Callback to update sandbox reference if it gets recreated
  const onSandboxRecreated = (newSandbox: Sandbox) => {
    console.log(`[RegexAgent] Sandbox recreated: ${sandboxRef.current.id} -> ${newSandbox.id}`);
    sandboxRef.current = newSandbox;
  };

  const history: IterationResult[] = [];
  let currentCandidate: RegexCandidate | null = null;

  try {
    for (let i = 0; i < maxIterations; i++) {
      if (isAborted()) {
        return createAbortedResult({
          sandboxId: sandboxRef.current.id,
          iterations: i,
          candidate: currentCandidate,
          history,
        });
      }

      console.log(`[RegexAgent] Iteration ${i + 1}/${maxIterations}`);

      // ─────────────────────────────────────────────
      // STEP 1: GENERATE (Vercel AI Gateway)
      // ─────────────────────────────────────────────
      emitStatus?.({ phase: "generating", iteration: i + 1, maxIterations });
      const compactedHistory = compactHistory(history);
      const candidate = await generate(request, compactedHistory, runtime, gateway, abortSignal);
      currentCandidate = candidate;
      console.log(`[RegexAgent] Generated: /${candidate.pattern}/${candidate.flags}`);

      if (isAborted()) {
        return createAbortedResult({
          sandboxId: sandboxRef.current.id,
          iterations: i + 1,
          candidate: currentCandidate,
          history,
        });
      }

      // ─────────────────────────────────────────────
      // STEP 2: EXECUTE (Daytona Sandbox)
      // ─────────────────────────────────────────────
      emitStatus?.({ phase: "executing", iteration: i + 1, maxIterations });
      const testResults = await execute(
        sandboxRef.current,
        candidate,
        request,
        runtime,
        onSandboxRecreated,
        abortSignal
      );
      console.log(`[RegexAgent] Test passed: ${testResults.passed}`);

      if (isAborted()) {
        return createAbortedResult({
          sandboxId: sandboxRef.current.id,
          iterations: i + 1,
          candidate: currentCandidate,
          history,
        });
      }

      // Early exit on success
      if (testResults.passed) {
        return {
          ...candidate,
          success: true,
          iterations: i + 1,
          sandboxId: sandboxRef.current.id,
          runtime,
          testResults,
          ...(includeHistory && { history: [...history, { candidate, testResults, reflection: "" }] }),
        };
      }

      // ─────────────────────────────────────────────
      // STEP 3: REFLECT (Vercel AI Gateway)
      // ─────────────────────────────────────────────
      emitStatus?.({ phase: "evaluating", iteration: i + 1, maxIterations });
      const reflection = await reflect(candidate, testResults, request, gateway, abortSignal);
      console.log(`[RegexAgent] Reflection: ${reflection}`);

      // Store iteration history in memory (not AI SDK messages)
      history.push({ candidate, testResults, reflection });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return createAbortedResult({
        sandboxId: sandboxRef.current.id,
        iterations: history.length,
        candidate: currentCandidate,
        history,
      });
    }
    throw error;
  }

  // Get the last test results from history for the failed case
  const lastTestResults = history[history.length - 1]?.testResults;

  console.log(`[RegexAgent] Max iterations reached, returning best effort`);
  return {
    ...(currentCandidate ?? { pattern: ".*", flags: "" }),
    success: false,
    iterations: maxIterations,
    sandboxId: sandboxRef.current.id,
    runtime,
    testResults: lastTestResults,
    ...(includeHistory && { history }),
  };
}

// Export types for external use
export type {
  RegexRequest,
  MatchRegexRequest,
  CaptureRegexRequest,
  RegexCandidate,
  TestResult,
  IterationResult,
  RegexGenerationResult,
  SandboxRuntime,
  CaptureTest,
  CaptureTestCaseResult,
  MatchTestCaseResult,
  TestCaseResult,
  TestMode,
} from "./types";

// Export type guards
export { isCaptureMode, isMatchMode } from "./types";
