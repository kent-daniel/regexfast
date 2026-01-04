/**
 * REFLECT Step: Analyze failures using Vercel AI Gateway
 * 
 * This step uses the LLM to analyze why a regex candidate failed
 * and provide insights for the next iteration.
 */

import { generateText } from "ai";
import type { GatewayProvider } from "@ai-sdk/gateway";

import { DEFAULT_MODEL } from "./constants";
import type {
  RegexRequest,
  RegexCandidate,
  TestResult,
} from "./types";

import {
  buildRegexAgentReflectSystemPrompt,
  buildRegexAgentReflectUserPrompt,
} from "../../prompts/agents/regex-agent";

/**
 * Reflect on a failed regex attempt to provide insights for the next iteration
 * 
 * @param candidate - The regex candidate that failed
 * @param testResults - The test results showing what failed
 * @param request - The original regex request
 * @param gateway - Vercel AI Gateway provider
 * @returns A brief analysis of what went wrong and suggested fixes
 */
export async function reflect(
  candidate: RegexCandidate,
  testResults: TestResult,
  request: RegexRequest,
  gateway: GatewayProvider,
  abortSignal?: AbortSignal
): Promise<string> {
  const captureMode = testResults.testMode === "capture";
  
  const prompt = buildRegexAgentReflectUserPrompt(candidate, testResults, request);
  const systemPrompt = buildRegexAgentReflectSystemPrompt(captureMode);

  const { text } = await generateText({
    model: gateway(DEFAULT_MODEL),
    system: systemPrompt,
    prompt,
    abortSignal,
  });

  return text;
}
