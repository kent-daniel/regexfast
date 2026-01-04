/**
 * Code Agent - Phase 2 Implementation
 * Generates free-form code when regex patterns cannot solve the problem
 *
 * Architecture:
 * - Uses Vercel AI Gateway (generateObject) for structured code generation
 * - Executes in Daytona Sandbox (isolated, no network access)
 * - Requires user approval via AI SDK 6's needsApproval mechanism
 * 
 * @module code-agent
 */

// Re-export types
export type {
  SandboxRuntime,
  FreeCodeTest,
  GenerateCodeRequest,
  FreeCodeCandidate,
  FreeCodeResult,
  FreeCodeTestCaseResult,
} from "./types";

// Re-export functions
export { generateFreeCode } from "./agent-generate";
export { buildFreeCodeScript } from "./test-scripts";
