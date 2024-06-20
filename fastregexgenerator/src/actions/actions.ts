"use server";

import { Match, RegexResultDTO } from "@/models";
import {
  generateRegexWithAIUseCase,
  getRegexUseCase,
} from "@/use-cases/use-cases";

export async function getRegexMatches(
  pattern: string,
  text: string,
  flag: string,
  language?: string
): Promise<Match[]> {
  try {
    if (text.length === 0 || pattern.length === 0) {
      return [];
    }
    const matches = await getRegexUseCase(pattern, text, flag);
    return matches;
  } catch (error) {
    console.error("Error in getRegexMatches:", error);
    return [];
  }
}

export async function submitForm(formData: FormData): Promise<RegexResultDTO> {
  // format form data
  // description cannot be empty (spaces only)
  // shouldMatch should be comma seperated and cannot be empty
  // shouldNotMatch if not empty should be comma seperated
  // info if not empty cannot be empty spaces like description
  // send to usecase
  const result = await generateRegexWithAIUseCase({
    description: formData.get("description") as string,
    shouldMatch: formData.get("shouldMatch")?.toString().split(",") || [],
    shouldNotMatch: formData.get("shouldNotMatch")?.toString().split(",") || [],
    info: formData.get("info") as string,
  });

  // format form data back
  return result;
}
