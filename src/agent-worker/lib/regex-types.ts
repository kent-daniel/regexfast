/**
 * Type definitions for the regex executor
 * Separated to avoid circular dependencies between modules
 */

import type { Sandbox } from "@daytonaio/sdk";

// ─────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────

/**
 * A regex pattern with optional flags
 */
export interface RegexPattern {
  pattern: string;
  flags: string;
}

/**
 * Input for match mode testing (validation)
 */
export interface MatchTestInput {
  shouldMatch: string[];
  shouldNotMatch: string[];
}

/**
 * A single capture test case
 */
export interface CaptureTestCase {
  input: string;
  expectedGroups: (string | null)[];
  expectedNamedGroups?: Record<string, string>;
}

/**
 * Input for capture mode testing (extraction)
 */
export interface CaptureTestInput {
  captureTests: CaptureTestCase[];
}

/**
 * Union type for test inputs
 */
export type TestInput = MatchTestInput | CaptureTestInput;

/**
 * Type guard for match mode
 */
export function isMatchInput(input: TestInput): input is MatchTestInput {
  return "shouldMatch" in input || "shouldNotMatch" in input;
}

/**
 * Type guard for capture mode
 */
export function isCaptureInput(input: TestInput): input is CaptureTestInput {
  return "captureTests" in input;
}

/**
 * Supported runtimes for regex execution
 */
export type Runtime = "javascript" | "python";

/**
 * Test mode
 */
export type TestMode = "match" | "capture";

// ─────────────────────────────────────────────────────────────
// Result Types
// ─────────────────────────────────────────────────────────────

/**
 * Result of a single match test case
 */
export interface MatchTestCaseResult {
  input: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
}

/**
 * Result of a single capture test case
 */
export interface CaptureTestCaseResult {
  input: string;
  expected: (string | null)[];
  actual: (string | null)[] | null;
  passed: boolean;
  expectedNamedGroups?: Record<string, string>;
  actualNamedGroups?: Record<string, string> | null;
}

/**
 * Union type for test case results
 */
export type TestCaseResult = MatchTestCaseResult | CaptureTestCaseResult;

/**
 * Complete test result
 */
export interface TestResult {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: TestCaseResult[];
  testMode: TestMode;
  compileError?: string;
  stdout?: string;
}

/**
 * Options for regex execution
 */
export interface ExecuteOptions {
  runtime: Runtime;
  timeout?: number;
  abortSignal?: AbortSignal;
  /** Callback when sandbox is recreated due to unavailability */
  onSandboxRecreated?: (newSandbox: Sandbox) => void;
}
