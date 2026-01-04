/**
 * EXECUTE Step: Test regex candidate in Daytona sandbox
 * 
 * This step executes the generated regex pattern against test cases
 * in an isolated sandbox environment to verify correctness.
 */

import type { Sandbox } from "@daytonaio/sdk";

import { executeInSandbox } from "../../sandbox";
import { 
  buildJsTestScript, 
  buildPythonTestScript, 
  buildJsCaptureTestScript, 
  buildPythonCaptureTestScript,
} from "./test-scripts";
import { SANDBOX_TIMEOUT_SECONDS } from "./constants";
import {
  isCaptureMode,
  type RegexRequest,
  type RegexCandidate,
  type TestResult,
  type SandboxRuntime,
  type CaptureTestCaseResult,
  type TestMode,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Error result factory
// ─────────────────────────────────────────────────────────────

/** Error types for consistent error reporting */
type ErrorType = "SANDBOX" | "PARSE" | "TIMEOUT";

/**
 * Create a standardized error result for test failures
 * @param errorType - The type of error that occurred
 * @param message - The error message
 * @param mode - The test mode (match or capture)
 * @param stdout - Optional stdout from sandbox
 * @returns A TestResult indicating failure
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

/**
 * Execute regex tests in a Daytona sandbox
 * 
 * @param sandbox - The Daytona sandbox instance
 * @param candidate - The regex candidate to test
 * @param request - The original regex request with test cases
 * @param runtime - Target runtime (javascript/python)
 * @param onSandboxRecreated - Callback if sandbox needs to be recreated
 * @returns Test results with pass/fail for each test case
 */
export async function execute(
  sandbox: Sandbox,
  candidate: RegexCandidate,
  request: RegexRequest,
  runtime: SandboxRuntime,
  onSandboxRecreated?: (newSandbox: Sandbox) => void,
  abortSignal?: AbortSignal
): Promise<TestResult> {
  const captureMode = isCaptureMode(request);
  const modeStr = captureMode ? "CAPTURE" : "MATCH";
  
  console.log(`[RegexAgent] EXECUTE: Testing /${candidate.pattern}/${candidate.flags} (${modeStr} mode)`);
  console.log(`[RegexAgent] EXECUTE: Runtime: ${runtime}, Sandbox: ${sandbox.id}`);
  
  if (captureMode) {
    console.log(`[RegexAgent] EXECUTE: Capture tests: ${request.captureTests.length}`);
  } else {
    console.log(`[RegexAgent] EXECUTE: Test cases - shouldMatch: ${request.shouldMatch.length}, shouldNotMatch: ${request.shouldNotMatch.length}`);
  }

  // Build the appropriate test script for the runtime and mode
  let testScript: string;
  if (captureMode) {
    testScript = runtime === "python"
      ? buildPythonCaptureTestScript(candidate, request.captureTests)
      : buildJsCaptureTestScript(candidate, request.captureTests);
  } else {
    testScript = runtime === "python"
      ? buildPythonTestScript(candidate, request)
      : buildJsTestScript(candidate, request);
  }

  console.log(`[RegexAgent] EXECUTE: Running test script in sandbox...`);
  const startTime = Date.now();

  // Execute in Daytona sandbox with configured timeout
  const response = await executeInSandbox(sandbox, testScript, {
    timeout: SANDBOX_TIMEOUT_SECONDS,
    language: runtime,
    onSandboxRecreated,
    abortSignal,
  });

  const duration = Date.now() - startTime;
  console.log(`[RegexAgent] EXECUTE: Sandbox execution completed in ${duration}ms`);
  console.log(`[RegexAgent] EXECUTE: Exit code: ${response.exitCode}`);

  // Handle sandbox errors
  if (response.exitCode !== 0) {
    console.log(`[RegexAgent] EXECUTE: ❌ Sandbox error: ${response.result} ${response.artifacts?.stdout ? `\nSandbox stdout: ${response.artifacts.stdout}` : ""}`);
    return createErrorResult(
      "SANDBOX",
      response.result,
      captureMode ? "capture" : "match",
      response.artifacts?.stdout
    );
  }

  // Parse result from sandbox
  try {
    const result: TestResult = JSON.parse(response.result);
    
    // Log detailed results
    if (captureMode) {
      logCaptureTestResults(result, candidate);
    } else {
      logTestResults(result, candidate);
    }
    
    return result;
  } catch {
    console.log(`[RegexAgent] EXECUTE: ❌ Failed to parse result: ${response.result}`);
    return createErrorResult(
      "PARSE",
      response.result,
      captureMode ? "capture" : "match"
    );
  }
}

/**
 * Log detailed test results for debugging (match mode)
 */
function logTestResults(result: TestResult, candidate: RegexCandidate): void {
  console.log(`[RegexAgent] EXECUTE: Results - ${result.passedCount}/${result.total} passed`);
  
  if (result.compileError) {
    console.log(`[RegexAgent] EXECUTE: ⚠️ Compile error: ${result.compileError}`);
  }
  
  // Log each test case result
  for (const r of result.results) {
    const icon = r.passed ? "✅" : "❌";
    // Type guard for match results
    if ('expected' in r && typeof r.expected === 'boolean') {
      const expectStr = r.expected ? "should match" : "should NOT match";
      const actualStr = r.actual ? "matched" : "did not match";
      console.log(`[RegexAgent] EXECUTE: ${icon} "${r.input}" - ${expectStr}, ${actualStr}`);
    }
  }
  
  console.log(`[RegexAgent] EXECUTE: Overall: ${result.passed ? "✅ ALL PASSED" : "❌ SOME FAILED"}`);
}

/**
 * Log detailed capture test results for debugging (capture mode)
 */
function logCaptureTestResults(result: TestResult, candidate: RegexCandidate): void {
  console.log(`[RegexAgent] EXECUTE: Capture Results - ${result.passedCount}/${result.total} passed`);
  
  if (result.compileError) {
    console.log(`[RegexAgent] EXECUTE: ⚠️ Compile error: ${result.compileError}`);
  }
  
  // Log each capture test case result
  for (const r of result.results) {
    const icon = r.passed ? "✅" : "❌";
    // Type guard for capture results
    if ('expected' in r && Array.isArray(r.expected)) {
      const captureResult = r as CaptureTestCaseResult;
      const expectedStr = JSON.stringify(captureResult.expected);
      const actualStr = JSON.stringify(captureResult.actual);
      console.log(`[RegexAgent] EXECUTE: ${icon} "${r.input}" - expected: ${expectedStr}, got: ${actualStr}`);
      
      if (captureResult.expectedNamedGroups) {
        console.log(`[RegexAgent] EXECUTE:   Named groups - expected: ${JSON.stringify(captureResult.expectedNamedGroups)}, got: ${JSON.stringify(captureResult.actualNamedGroups)}`);
      }
    }
  }
  
  console.log(`[RegexAgent] EXECUTE: Overall: ${result.passed ? "✅ ALL PASSED" : "❌ SOME FAILED"}`);
}
