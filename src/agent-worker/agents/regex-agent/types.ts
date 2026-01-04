/**
 * Type definitions for the Regex Agent
 * Option A Simple: Programmatic Loop with AI SDK
 */

/**
 * Supported regex runtimes for sandbox execution
 */
export type SandboxRuntime = "javascript" | "typescript" | "python";

/**
 * Test mode for the regex agent
 */
export type TestMode = "match" | "capture";

/**
 * A single capture test case with expected group extraction
 */
export interface CaptureTest {
  /** The input string to match against */
  input: string;
  /** Expected captured groups (index 1+, not the full match) */
  expectedGroups: (string | null)[];
  /** Optional: Expected named groups */
  expectedNamedGroups?: Record<string, string>;
}

/**
 * Base interface for all regex requests
 */
interface RegexRequestBase {
  /** Natural language description of what the regex should match */
  description: string;
}

/**
 * Request for match mode - test if strings match/don't match the regex
 */
export interface MatchRegexRequest extends RegexRequestBase {
  /** Array of strings that MUST match the regex */
  shouldMatch: string[];
  /** Array of strings that must NOT match the regex */
  shouldNotMatch: string[];
}

/**
 * Request for capture mode - test if regex extracts expected groups
 */
export interface CaptureRegexRequest extends RegexRequestBase {
  /** Array of capture tests for group extraction */
  captureTests: CaptureTest[];
}

/**
 * Union type for regex requests
 * Use type guards to determine which type of request it is
 */
export type RegexRequest = MatchRegexRequest | CaptureRegexRequest;

/**
 * Type guard to check if request is in match mode
 */
export function isMatchMode(request: RegexRequest): request is MatchRegexRequest {
  return "shouldMatch" in request;
}

/**
 * Type guard to check if request is in capture mode
 */
export function isCaptureMode(request: RegexRequest): request is CaptureRegexRequest {
  return "captureTests" in request;
}

/**
 * Result of a single match test case
 */
export interface MatchTestCaseResult {
  /** The input string that was tested */
  input: string;
  /** Whether we expected a match */
  expected: boolean;
  /** Whether the regex actually matched */
  actual: boolean;
  /** Whether this test case passed */
  passed: boolean;
}

/**
 * Result of a single capture test case
 */
export interface CaptureTestCaseResult {
  /** The input string that was tested */
  input: string;
  /** Expected captured groups */
  expected: (string | null)[];
  /** Actual captured groups (null if no match) */
  actual: (string | null)[] | null;
  /** Whether this test case passed */
  passed: boolean;
  /** Expected named groups (if any) */
  expectedNamedGroups?: Record<string, string>;
  /** Actual named groups (if any) */
  actualNamedGroups?: Record<string, string> | null;
}

/**
 * Result of a single test case (union type for match or capture)
 */
export type TestCaseResult = MatchTestCaseResult | CaptureTestCaseResult;

/**
 * Result of testing a regex candidate
 */
export interface TestResult {
  /** Whether all tests passed */
  passed: boolean;
  /** Total number of test cases */
  total: number;
  /** Number of passed test cases */
  passedCount: number;
  /** Number of failed test cases */
  failedCount: number;
  /** All test case results */
  results: TestCaseResult[];
  /** Test mode (match or capture) */
  testMode?: TestMode;
  /** Compilation error if regex failed to compile */
  compileError?: string;

  stdout?: string;
}

/**
 * Result of a single iteration in the generation loop
 */
export interface IterationResult {
  /** The regex candidate that was tested */
  candidate: RegexCandidate;
  /** Results of testing the candidate */
  testResults: TestResult;
  /** LLM's analysis of why the candidate failed */
  reflection: string;
}

/**
 * A regex candidate with pattern and flags
 */
export interface RegexCandidate {
  /** The regex pattern (without delimiters) */
  pattern: string;
  /** Regex flags like 'g', 'i', 'm' */
  flags: string;
  /** The reasoning behind this pattern choice */
  reasoning?: string;
}

/**
 * Final result of the regex generation process
 */
export interface RegexGenerationResult {
  /** The regex pattern */
  pattern: string;
  /** Regex flags */
  flags: string;
  /** Whether the regex satisfies all requirements */
  success: boolean;
  /** Whether the operation was aborted */
  aborted?: boolean;
  /** Optional error message (e.g. aborted) */
  error?: string;
  /** Number of iterations taken */
  iterations: number;
  /** Sandbox ID for potential reuse */
  sandboxId: string;
  /** Runtime used for testing */
  runtime: SandboxRuntime;
  /** Complete iteration history for debugging */
  history?: IterationResult[];
}
