/**
 * GENERATE Step: Create free code candidate using Vercel AI Gateway
 * 
 * This step uses structured output (generateObject) to create a
 * code candidate based on the user's requirements.
 */

import { generateObject } from "ai";
import type { GatewayProvider } from "@ai-sdk/gateway";

import { FreeCodeCandidateSchema } from "./schemas";
import { DEFAULT_MODEL } from "./constants";
import type {
  GenerateCodeRequest,
  FreeCodeCandidate,
} from "./types";

import {
  buildCodeAgentSystemPrompt,
  buildCodeAgentUserPrompt,
} from "../../prompts/agents/code-agent";

/**
 * Generate free code using LLM structured output
 * 
 * @param request - The code generation request
 * @param options - Options including the gateway provider
 * @returns The generated code candidate with reasoning
 */
export async function generateFreeCode(
  request: GenerateCodeRequest,
  options: { gateway: GatewayProvider }
): Promise<FreeCodeCandidate> {
  console.log("[CodeAgent] GENERATE: Creating code candidate");
  
  const systemPrompt = buildCodeAgentSystemPrompt(request.runtime);
  const userPrompt = buildCodeAgentUserPrompt(request);

  const { object } = await generateObject({
    model: options.gateway(DEFAULT_MODEL),
    schema: FreeCodeCandidateSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });

  console.log("[CodeAgent] GENERATE: Code candidate created");
  console.log(`  Reasoning: ${object.reasoning.substring(0, 100)}...`);

  return {
    reasoning: object.reasoning,
    code: object.code,
  };
}
