"use server";
import { z } from "zod";
import { GeneratorFormResponse, Match } from "@/models";
import {
  generateRegexWithAIUseCase,
  getRegexUseCase,
} from "@/use-cases/use-cases";

export const runtime = 'edge';

export async function getRegexMatches(
  pattern: string,
  text: string,
  flag: string,
  language?: string
): Promise<{ status: string; timeSpent: string; matches: Match[] }> {
  try {
    if (text.length === 0 || pattern.length === 0) {
      return { status: "invalid", timeSpent: `0`, matches: [] };
    }
    const { status, timeSpent, matches } = await getRegexUseCase(
      pattern,
      text,
      flag
    );
    return { status, timeSpent: timeSpent.toFixed(2), matches };
  } catch (error) {
    // console.error("Error in getRegexMatches:", error);
    return { status: "invalid", timeSpent: `0`, matches: [] };
  }
}

const formDataSchema = z.object({
  description: z.string().refine((val) => val.trim() !== "", {
    message: "Description cannot be empty or spaces only",
  }),
  shouldMatch: z
    .string()
    .refine((val) => val.trim() !== "", {
      message: "Should Match examples cannot be empty spaces",
    })
    .transform((val) => val.split(",")),
  shouldNotMatch: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",") : [])),
  info: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() !== "", {
      message: "Info cannot be empty spaces",
    }),
});

export async function submitForm(
  formData: FormData
): Promise<GeneratorFormResponse> {
  try {
    // Convert FormData to plain object for validation
    const data = {
      description: formData.get("description") as string,
      shouldMatch: formData.get("shouldMatch") as string,
      shouldNotMatch: formData.get("shouldNotMatch") as string,
      info: formData.get("info") as string,
    };

    // Validate the data
    const validatedData = formDataSchema.parse(data);

    // Send to use case
    const result = await generateRegexWithAIUseCase({
      description: validatedData.description,
      shouldMatch: validatedData.shouldMatch,
      shouldNotMatch: validatedData.shouldNotMatch,
      info: validatedData.info,
    });

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.message}`),
      };
    } else {
      return {
        success: false,
        errors: ["Something went wrong"],
      };
    }
  }
}
