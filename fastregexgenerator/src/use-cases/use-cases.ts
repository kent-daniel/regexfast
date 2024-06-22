"use server";
import { FormDataDTO, Match, RegexResultDTO } from "@/models";

export async function getRegexUseCase(
  pattern: string,
  text: string,
  flag: string
): Promise<{ status: string; timeSpent: number; matches: Match[] }> {
  try {
    const matches = [];
    const regex = new RegExp(pattern, flag || "");

    const startTime = performance.now();
    const match = regex.exec(text);

    // Handle non-global flag case
    if (!flag.includes("g") && match) {
      const endTime = performance.now();
      return {
        status: "success",
        timeSpent: endTime - startTime,
        matches: [{ index: match.index, text: match[0] }],
      };
    }

    // Handle global flag case
    let currentMatch = match;
    while (currentMatch) {
      if (currentMatch[1] === undefined && currentMatch[0] === "") break; // prevent infinite loop
      matches.push({ index: currentMatch.index, text: currentMatch[0] });
      currentMatch = regex.exec(text);
    }

    const endTime = performance.now();

    return {
      status: "success",
      timeSpent: endTime - startTime,
      matches,
    };
  } catch (error) {
    console.error("Error executing regex:", error);
    return {
      status: "error",
      timeSpent: 0,
      matches: [],
    };
  }
}

export async function generateRegexWithAIUseCase(
  formDataDTO: FormDataDTO
): Promise<RegexResultDTO> {
  await new Promise((res) => setTimeout(res, 1000));
  return {
    pattern: "\\d+",
    flags: ["g", "i", "s"],
    textForTest: "123 , 123 , 123",
    success: true,
  };
}
