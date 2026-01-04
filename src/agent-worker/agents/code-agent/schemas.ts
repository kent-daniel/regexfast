/**
 * Zod schemas for structured AI outputs
 * Used with Vercel AI SDK's generateObject for type-safe LLM responses
 */

import { z } from "zod/v3";

/**
 * Schema for free code candidate output from the LLM
 */
export const FreeCodeCandidateSchema = z.object({
  reasoning: z.string().describe("Explanation of the code approach and design decisions"),
  code: z.string().describe("The complete code with a processInput(input) function that takes a string and returns the processed result"),
});

/**
 * Inferred type from the schema
 */
export type FreeCodeCandidateOutput = z.infer<typeof FreeCodeCandidateSchema>;
