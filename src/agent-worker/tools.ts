/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { getCurrentAgent } from "agents";
import { z } from "zod/v3";
import type { GatewayProvider } from "@ai-sdk/gateway";

import type { ToolCallOptions } from "ai";
import type { Chat } from "./server";
import { generateRegex, type RegexRequest } from "./agents/regex-agent/index";
import { generateFreeCode, buildFreeCodeScript, type FreeCodeTest } from "./agents/code-agent/index";
import { executeInSandbox, getOrCreateSandbox } from "./sandbox";
import type { SubagentStatusEvent } from "./shared";

/**
 * Schema for capture test cases
 */
const CaptureTestSchema = z.object({
  input: z.string().describe("The input string to test against the regex"),
  expectedGroups: z
    .array(z.string().nullable())
    .describe("Expected captured groups in order (index 1+, not the full match). Use null for optional groups that didn't match."),
  expectedNamedGroups: z
    .record(z.string())
    .optional()
    .describe("Optional: Expected named groups as key-value pairs"),
});

/**
 * Create match regex tool - for testing if strings match/don't match a pattern
 */
function createGenerateMatchRegexTool(
  gateway: GatewayProvider,
  emitSubagentStatus?: (event: SubagentStatusEvent) => void
) {
  return tool({
    description: `Generate a regex pattern for VALIDATING/MATCHING strings. Use this when you need to test if strings match or don't match a pattern.

Examples of when to use this tool:
- "Create a regex for email validation"
- "Match all URLs that start with https"  
- "Check if a string is a valid phone number"

Provide example strings that should match and should NOT match. The tool will iteratively refine the pattern until all tests pass.`,
    inputSchema: z.object({
      description: z
        .string()
        .describe("Natural language description of what the regex should match"),
      shouldMatch: z
        .array(z.string())
        .min(1)
        .describe("Array of example strings that MUST match the regex"),
      shouldNotMatch: z
        .array(z.string())
        .min(1)
        .describe("Array of example strings that must NOT match the regex"),
      runtime: z
        .enum(["javascript", "python"])
        .optional()
        .default("javascript")
        .describe("Target regex runtime: 'javascript' for web/Node.js, 'python' for Python re module"),
    }),
    execute: async (
      { description, shouldMatch, shouldNotMatch, runtime },
      context?: ToolCallOptions
    ) => {
      const { agent } = getCurrentAgent<Chat>();
      const abortSignal =
        (context as (ToolCallOptions & { abortSignal?: AbortSignal }) | undefined)?.abortSignal ??
        agent?.currentAbortSignal;

      const toolCallId = context?.toolCallId;

      try {
        if (abortSignal?.aborted) {
          return { success: false, aborted: true, error: "Operation aborted" };
        }

        const existingSandboxId = agent?.sandboxId;

        const request: RegexRequest = {
          description,
          shouldMatch,
          shouldNotMatch,
        };

        const result = await generateRegex(request, {
          maxIterations: 5,
          runtime,
          existingSandboxId,
          includeHistory: false,
          gateway,
          abortSignal,
          emitStatus:
            toolCallId && emitSubagentStatus
              ? ({ phase, iteration, maxIterations: maxIts, message }) =>
                  emitSubagentStatus({
                    toolCallId,
                    agent: "regex-agent",
                    phase,
                    iteration,
                    maxIterations: maxIts,
                    message,
                    at: new Date().toISOString(),
                  })
              : undefined,
        });

        if (agent && result.sandboxId) {
          agent.sandboxId = result.sandboxId;
        }

        return {
          success: result.success,
          ...(result.aborted ? { aborted: true } : {}),
          pattern: result.pattern,
          flags: result.flags,
          iterations: result.iterations,
          runtime: result.runtime,
          example:
            runtime === "python"
              ? `import re\npattern = r"${result.pattern}"\nif re.search(pattern, text):\n    print("Match!")`
              : `const regex = new RegExp("${result.pattern.replace(/\\/g, "\\\\")}", "${result.flags}");\nif (regex.test(text)) console.log("Match!");`
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { success: false, aborted: true, error: "Operation aborted" };
        }
        console.error("Error generating match regex:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Regex generation failed: ${errorMessage}` };
      }
    }
  });
}

/**
 * Create capture regex tool - for extracting parts from strings
 */
function createGenerateCaptureRegexTool(
  gateway: GatewayProvider,
  emitSubagentStatus?: (event: SubagentStatusEvent) => void
) {
  return tool({
    description: `Generate a regex pattern for EXTRACTING/CAPTURING parts from strings. Use this when you need to extract specific groups from text.

Examples of when to use this tool:
- "Extract the area code from phone numbers like (555) 123-4567"
- "Capture the username and domain from email addresses"
- "Parse the year, month, and day from dates like 2024-01-15"
- "Get the protocol and domain from URLs"

Provide test cases with input strings and the expected captured groups. The tool will iteratively refine the pattern until all extractions are correct.`,
    inputSchema: z.object({
      description: z
        .string()
        .describe("Natural language description of what groups to capture/extract"),
      captureTests: z
        .array(CaptureTestSchema)
        .min(1)
        .describe("Test cases: each has an input string and the expected captured groups"),
      runtime: z
        .enum(["javascript", "python"])
        .optional()
        .default("javascript")
        .describe("Target regex runtime: 'javascript' for web/Node.js, 'python' for Python re module"),
    }),
    execute: async (
      { description, captureTests, runtime },
      context?: ToolCallOptions
    ) => {
      const { agent } = getCurrentAgent<Chat>();
      const abortSignal =
        (context as (ToolCallOptions & { abortSignal?: AbortSignal }) | undefined)?.abortSignal ??
        agent?.currentAbortSignal;

      const toolCallId = context?.toolCallId;

      try {
        if (abortSignal?.aborted) {
          return { success: false, aborted: true, error: "Operation aborted" };
        }

        const existingSandboxId = agent?.sandboxId;

        const request: RegexRequest = {
          description,
          captureTests,
        };

        const result = await generateRegex(request, {
          maxIterations: 5,
          runtime,
          existingSandboxId,
          includeHistory: false,
          gateway,
          abortSignal,
          emitStatus:
            toolCallId && emitSubagentStatus
              ? ({ phase, iteration, maxIterations: maxIts, message }) =>
                  emitSubagentStatus({
                    toolCallId,
                    agent: "regex-agent",
                    phase,
                    iteration,
                    maxIterations: maxIts,
                    message,
                    at: new Date().toISOString(),
                  })
              : undefined,
        });

        if (agent && result.sandboxId) {
          agent.sandboxId = result.sandboxId;
        }

        return {
          success: result.success,
          ...(result.aborted ? { aborted: true } : {}),
          pattern: result.pattern,
          flags: result.flags,
          iterations: result.iterations,
          runtime: result.runtime,
          example:
            runtime === "python"
              ? `import re\npattern = r"${result.pattern}"\nmatch = re.search(pattern, text)\nif match:\n    groups = match.groups()  # Captured values`
              : `const regex = new RegExp("${result.pattern.replace(/\\/g, "\\\\")}", "${result.flags}");\nconst match = regex.exec(text);\nif (match) console.log(match.slice(1));  // Captured values`
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { success: false, aborted: true, error: "Operation aborted" };
        }
        console.error("Error generating capture regex:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Regex generation failed: ${errorMessage}` };
      }
    }
  });
}

/**
 * Schema for free code test cases
 */
const FreeCodeTestSchema = z.object({
  input: z.string().describe("Input string to pass to the processInput() function"),
  expectedOutput: z.unknown().describe("Expected output value from processInput()"),
});

/**
 * Create generateCode tool - for generating custom code when regex cannot solve the problem
 * Uses AI SDK 6's needsApproval for human-in-the-loop control
 */
function createGenerateCodeTool(gateway: GatewayProvider) {
  return tool({
    description: `Generate custom code when regex patterns cannot solve the problem.
    
Use this tool ONLY after the regex tools (generateMatchRegex, generateCaptureRegex) have failed or are clearly insufficient. This tool:
- Generates JavaScript or Python code with a processInput() function
- Runs in a sandboxed environment with NO network access
- Requires user approval before execution

Examples of when to use this tool:
- Complex string transformations that regex cannot handle
- Conditional logic based on input content
- Multi-step processing or calculations
- Data parsing that requires programmatic logic
- Format conversions (e.g., CSV to JSON)

The generated code will define a function:
- JavaScript: function processInput(input) { ... }
- Python: def process_input(inp): ...`,

    inputSchema: z.object({
      description: z.string().describe("What the code should do - be specific about input/output format"),
      runtime: z.enum(["javascript", "python"]).default("javascript").describe("Runtime: 'javascript' or 'python'"),
      tests: z.array(FreeCodeTestSchema).min(1).describe("Test cases to validate the generated code - each has input string and expected output"),
    }),

  });
}

type AgentSandboxState = {
  sandboxId?: string;
  currentAbortSignal?: AbortSignal;
};

export function createExecutions(gateway: GatewayProvider, agent?: AgentSandboxState) {
  return {
    generateCode: async (
      args: { description: string; runtime: "javascript" | "python"; tests: Array<{ input: string; expectedOutput: unknown }> },
      context: ToolCallOptions
    ) => {
      const { description, runtime, tests } = args;
      const abortSignal =
        (context as (ToolCallOptions & { abortSignal?: AbortSignal }) | undefined)?.abortSignal ??
        agent?.currentAbortSignal;

      console.log("[CodeAgent] Approved generateCode execution");
      console.log(`  Description: ${description.substring(0, 80)}...`);
      console.log(`  Runtime: ${runtime}`);
      console.log(`  Tests: ${tests.length} test cases`);

      try {
        if (abortSignal?.aborted) {
          return {
            success: false,
            aborted: true,
            error: "Operation aborted by user",
            code: "",
            reasoning: "",
            passed: false,
            total: tests.length,
            passedCount: 0,
            failedCount: tests.length,
            results: []
          };
        }

        const candidate = await generateFreeCode(
          { description, runtime, tests: tests as FreeCodeTest[] },
          { gateway }
        );

        const script = buildFreeCodeScript(candidate.code, tests as FreeCodeTest[], runtime);

        const existingSandboxId = agent?.sandboxId;
        const sandbox = await getOrCreateSandbox(
          runtime === "python" ? "python" : "javascript",
          existingSandboxId
        );

        if (agent) {
          agent.sandboxId = sandbox.id;
        }

        const { result: stdout, exitCode } = await executeInSandbox(sandbox, script, {
          timeout: 10,
          language: runtime === "python" ? "python" : "javascript",
          onSandboxRecreated: (newSandbox) => {
            if (agent) {
              agent.sandboxId = newSandbox.id;
            }
          },
          abortSignal,
        });

        console.log(`[CodeAgent] EXECUTE: exit=${exitCode}, stdout length=${stdout?.length || 0}`);

        if (exitCode !== 0) {
          return {
            success: false,
            code: candidate.code,
            reasoning: candidate.reasoning,
            error: `Code execution failed with exit code ${exitCode}. Output: ${stdout?.substring(0, 500)}`,
            passed: false,
            total: tests.length,
            passedCount: 0,
            failedCount: tests.length,
            results: []
          };
        }

        try {
          const testResult = JSON.parse(stdout);

          return {
            success: testResult.passed,
            code: candidate.code,
            reasoning: candidate.reasoning,
            passed: testResult.passed,
            total: testResult.total,
            passedCount: testResult.passedCount,
            failedCount: testResult.failedCount,
            results: testResult.results
          };
        } catch (parseError) {
          console.error("[CodeAgent] Failed to parse test results:", parseError);
          return {
            success: false,
            code: candidate.code,
            reasoning: candidate.reasoning,
            error: `Failed to parse test results. Raw output: ${stdout?.substring(0, 500)}`,
            passed: false,
            total: tests.length,
            passedCount: 0,
            failedCount: tests.length,
            results: []
          };
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return {
            success: false,
            aborted: true,
            error: "Operation aborted by user",
            code: "",
            reasoning: "",
            passed: false,
            total: tests.length,
            passedCount: 0,
            failedCount: tests.length,
            results: []
          };
        }
        console.error("[CodeAgent] Error generating code:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: `Code generation failed: ${errorMessage}`,
          code: "",
          reasoning: "",
          passed: false,
          total: tests.length,
          passedCount: 0,
          failedCount: tests.length,
          results: []
        };
      }
    }
  };
}

/**
 * Create all tools with the provided gateway
 * These will be provided to the AI model to describe available capabilities
 */
export function createTools(
  gateway: GatewayProvider,
  options?: {
    emitSubagentStatus?: (event: SubagentStatusEvent) => void;
  }
) {
  const emitSubagentStatus = options?.emitSubagentStatus;
  return {
    generateMatchRegex: createGenerateMatchRegexTool(gateway, emitSubagentStatus),
    generateCaptureRegex: createGenerateCaptureRegexTool(gateway, emitSubagentStatus),
    generateCode: createGenerateCodeTool(gateway),
  } satisfies ToolSet;
}

/**
 * Legacy export for compatibility (uses empty gateway - will fail at runtime)
 * @deprecated Use createTools(gateway) instead
 */
export const tools = {} as ToolSet;
