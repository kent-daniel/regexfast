/**
 * GENERATE Step: Create regex candidate using Vercel AI Gateway
 * 
 * This step uses structured output (generateObject) to create a
 * regex candidate based on the requirements and previous iteration history.
 */

import { generateObject } from "ai";
import type { GatewayProvider } from "@ai-sdk/gateway";

import { RegexCandidateSchema } from "./schemas";
import { DEFAULT_MODEL } from "./constants";
import {
  isCaptureMode,
  type SandboxRuntime,
  type IterationResult,
  type RegexCandidate,
  type RegexRequest,
} from "./types";

import {
  buildRegexAgentGeneratePrompt,
  buildRegexAgentGenerateSystemPrompt,
} from "../../prompts/agents/regex-agent";

/**
 * Generate a regex candidate using the AI gateway
 * 
 * @param request - The regex requirements
 * @param history - Previous iteration history for learning
 * @param runtime - Target runtime (javascript/python)
 * @param gateway - Vercel AI Gateway provider
 * @returns A regex candidate with pattern, flags, and reasoning
 */
export async function generate(
  request: RegexRequest,
  history: IterationResult[],
  runtime: SandboxRuntime,
  gateway: GatewayProvider,
  abortSignal?: AbortSignal
): Promise<RegexCandidate> {
  const captureMode = isCaptureMode(request);
  const prompt = buildRegexAgentGeneratePrompt(request, history, runtime);
  const systemPrompt = buildRegexAgentGenerateSystemPrompt(runtime, captureMode);

  console.log(`[RegexAgent] GENERATE prompt:\n${prompt}`);

  const { object } = await generateObject({
    model: gateway(DEFAULT_MODEL),
    schema: RegexCandidateSchema,
    system: systemPrompt,
    prompt,
    abortSignal,
  });

  return {
    pattern: object.pattern,
    flags: object.flags,
    reasoning: object.reasoning,
  };
}
