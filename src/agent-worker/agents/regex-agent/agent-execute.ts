/**
 * EXECUTE Step: Test regex candidate in Daytona sandbox
 * 
 * This step executes the generated regex pattern against test cases
 * in an isolated sandbox environment to verify correctness.
 * 
 * This module wraps the core regex-executor with agent-specific logging.
 */

import type { Sandbox } from "@daytonaio/sdk";

import {
  executeRegexTest,
  type TestInput,
  type TestResult,
  type CaptureTestCaseResult,
} from "../../lib/regex-executor";
import { SANDBOX_TIMEOUT_SECONDS } from "./constants";
import {
  isCaptureMode,
  type RegexRequest,
  type RegexCandidate,
  type SandboxRuntime,
} from "./types";

// Re-export TestResult for backwards compatibility
export type { TestResult } from "../../lib/regex-executor";

/**
 * Execute regex tests in a Daytona sandbox
 * 
 * This is the agent-specific wrapper that adds logging around the core executor.
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
  
  // Agent-specific logging
  console.log(`[RegexAgent] EXECUTE: Testing /${candidate.pattern}/${candidate.flags} (${modeStr} mode)`);
  console.log(`[RegexAgent] EXECUTE: Runtime: ${runtime}, Sandbox: ${sandbox.id}`);
  
  if (captureMode) {
    console.log(`[RegexAgent] EXECUTE: Capture tests: ${request.captureTests.length}`);
  } else {
    console.log(`[RegexAgent] EXECUTE: Test cases - shouldMatch: ${request.shouldMatch.length}, shouldNotMatch: ${request.shouldNotMatch.length}`);
  }

  console.log(`[RegexAgent] EXECUTE: Running test script in sandbox...`);
  const startTime = Date.now();

  // Convert agent request to core test input format
  const testInput: TestInput = captureMode
    ? { captureTests: request.captureTests }
    : { shouldMatch: request.shouldMatch, shouldNotMatch: request.shouldNotMatch };

  // Delegate to core executor
  const result = await executeRegexTest(
    sandbox,
    { pattern: candidate.pattern, flags: candidate.flags },
    testInput,
    {
      runtime: runtime === "typescript" ? "javascript" : runtime,
      timeout: SANDBOX_TIMEOUT_SECONDS,
      abortSignal,
      onSandboxRecreated,
    }
  );

  const duration = Date.now() - startTime;
  console.log(`[RegexAgent] EXECUTE: Sandbox execution completed in ${duration}ms`);
  
  // Agent-specific result logging
  if (captureMode) {
    logCaptureTestResults(result, candidate);
  } else {
    logTestResults(result, candidate);
  }
  
  return result;
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
