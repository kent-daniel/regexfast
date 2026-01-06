/**
 * Core regex execution engine - runtime agnostic
 * Used by both the agent and the HTTP endpoint
 */

import type { Sandbox } from "@daytonaio/sdk";
import { executeInSandbox } from "../sandbox";
import {
  buildJsMatchTestScript,
  buildPythonMatchTestScript,
  buildJsCaptureTestScript,
  buildPythonCaptureTestScript,
} from "./script-builders";
import {
  isCaptureInput,
  type RegexPattern,
  type MatchTestInput,
  type TestInput,
  type TestMode,
  type TestResult,
  type ExecuteOptions,
} from "./regex-types";

// Re-export all types for convenience
export * from "./regex-types";

// ─────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────

type ErrorType = "SANDBOX" | "PARSE" | "TIMEOUT";

/**
 * Create a standardized error result
 */
function createErrorResult(
  errorType: ErrorType,
  message: string,
  mode: TestMode,
  stdout?: string
): TestResult {
  return {
    passed: false,
    total: 0,
    passedCount: 0,
    failedCount: 0,
    results: [],
    testMode: mode,
    stdout,
    compileError: `${errorType} ERROR: ${message}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Core execution
// ─────────────────────────────────────────────────────────────

/**
 * Execute regex tests in a sandbox
 * 
 * This is the core execution function used by both the agent and the endpoint.
 * It builds the appropriate test script, executes it in the sandbox, and parses the results.
 * 
 * @param sandbox - The Daytona sandbox instance
 * @param regex - The regex pattern to test
 * @param testInput - The test cases (match or capture mode)
 * @param options - Execution options (runtime, timeout, etc.)
 * @returns Test results with pass/fail for each test case
 */
export async function executeRegexTest(
  sandbox: Sandbox,
  regex: RegexPattern,
  testInput: TestInput,
  options: ExecuteOptions
): Promise<TestResult> {
  const { runtime, timeout = 30, abortSignal, onSandboxRecreated } = options;
  const captureMode = isCaptureInput(testInput);
  const testMode: TestMode = captureMode ? "capture" : "match";

  // Build the appropriate test script
  let testScript: string;
  
  if (captureMode) {
    testScript = runtime === "python"
      ? buildPythonCaptureTestScript(regex, testInput.captureTests)
      : buildJsCaptureTestScript(regex, testInput.captureTests);
  } else {
    const matchInput = testInput as MatchTestInput;
    testScript = runtime === "python"
      ? buildPythonMatchTestScript(regex, matchInput)
      : buildJsMatchTestScript(regex, matchInput);
  }

  // Execute in sandbox
  const response = await executeInSandbox(sandbox, testScript, {
    timeout,
    language: runtime === "python" ? "python" : "javascript",
    onSandboxRecreated,
    abortSignal,
  });

  // Handle sandbox errors
  if (response.exitCode !== 0) {
    return createErrorResult(
      "SANDBOX",
      response.result,
      testMode,
      response.artifacts?.stdout
    );
  }

  // Parse result
  try {
    const result: TestResult = JSON.parse(response.result);
    return result;
  } catch {
    return createErrorResult("PARSE", response.result, testMode);
  }
}

/**
 * Validate regex pattern syntax without sandbox execution
 * 
 * This is a quick check that doesn't require a sandbox.
 * Only works for JavaScript regex syntax.
 * 
 * @param pattern - The regex pattern
 * @param flags - The regex flags
 * @returns Error message if invalid, null if valid
 */
export function validateRegexSyntax(pattern: string, flags: string): string | null {
  try {
    new RegExp(pattern, flags);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
