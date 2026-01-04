/**
 * Zod schemas for structured AI outputs
 * Used with Vercel AI SDK's generateObject for type-safe LLM responses
 */

import { z } from "zod/v3";

/**
 * Schema for regex candidate output from the LLM
 */
export const RegexCandidateSchema = z.object({
  reasoning: z.string().describe("The reasoning behind the regex pattern"),
  pattern: z.string().describe("The regex pattern (without delimiters)"),
  flags: z.string().describe("Regex flags like 'g', 'i', 'm'"),
});

/**
 * Inferred type from the schema
 */
export type RegexCandidateOutput = z.infer<typeof RegexCandidateSchema>;
