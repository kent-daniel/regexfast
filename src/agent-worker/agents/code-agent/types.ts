/**
 * Type definitions for the Code Agent (Phase 2)
 * Generates free-form code when regex patterns cannot solve the problem
 */

/**
 * Supported runtimes for sandbox execution
 */
export type SandboxRuntime = "javascript" | "python";

/**
 * A single test case for validating generated code
 */
export interface FreeCodeTest {
  /** The input string to pass to processInput() */
  input: string;
  /** Expected output value from processInput() */
  expectedOutput: unknown;
}

/**
 * Request to generate free-form code
 */
export interface GenerateCodeRequest {
  /** Natural language description of what the code should do */
  description: string;
  /** Target runtime for code execution */
  runtime: SandboxRuntime;
  /** Test cases to validate the generated code */
  tests: FreeCodeTest[];
}

/**
 * LLM-generated code candidate
 */
export interface FreeCodeCandidate {
  /** Explanation of the code approach */
  reasoning: string;
  /** The complete code with processInput function */
  code: string;
}

/**
 * Result of a single test case
 */
export interface FreeCodeTestCaseResult {
  /** The input string that was tested */
  input: string;
  /** Expected output value */
  expected: unknown;
  /** Actual output from the code */
  actual: unknown;
  /** Whether this test case passed */
  passed: boolean;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Result of executing the generated code against test cases
 */
export interface FreeCodeResult {
  /** Whether all tests passed */
  success: boolean;
  /** The generated code */
  code: string;
  /** Explanation of the code approach */
  reasoning: string;
  /** Whether all tests passed */
  passed: boolean;
  /** Total number of tests */
  total: number;
  /** Number of tests that passed */
  passedCount: number;
  /** Number of tests that failed */
  failedCount: number;
  /** Detailed results for each test case */
  results: FreeCodeTestCaseResult[];
  /** Error message if code generation or execution failed */
  error?: string;
}
