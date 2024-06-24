"use server";
import {
  FormDataDTO,
  Match,
  GeneratorFormResponse,
  MessageType,
  RegexResultDTO,
} from "@/models";
import Replicate from "replicate";

export async function getRegexUseCase(
  pattern: string,
  text: string,
  flag: string
): Promise<{
  status: string;
  errorMessage?: string;
  timeSpent: number;
  matches: Match[];
}> {
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
      errorMessage: `${error}`,
      matches: [],
    };
  }
}

export async function generateRegexWithAIUseCase(
  formDataDTO: FormDataDTO
): Promise<GeneratorFormResponse> {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    let prompt = createPrompt(formDataDTO);
    let lastResult = null;
    // 2 shot prompting
    for (let i = 0; i < 2; i++) {
      try {
        const { pattern, flags } = await replicateLLMRegexGenerator(
          replicate,
          prompt
        );
        const { matches, status, timeSpent } = await getRegexUseCase(
          pattern,
          formDataDTO.shouldMatch.join(","),
          flags
        );

        lastResult = {
          pattern,
          flags: flags.split(""),
          textForTest: formDataDTO.shouldMatch.join(", "),
        };

        if (
          status === "success" &&
          matches.length === formDataDTO.shouldMatch.length
        ) {
          return {
            success: true,
            result: {
              ...lastResult,
              success: true,
            },
          };
        }

        prompt += `\nTest result: ${JSON.stringify({
          pattern,
          flags,
          matches,
          status,
          timeSpent,
        })}\nPlease refine the regex pattern.`;
      } catch (innerError) {
        console.error("Error in iteration of regex generation:", innerError);
        prompt += innerError;
      }
    }

    return {
      success: false,
      result: {
        pattern: lastResult?.pattern || "",
        textForTest: lastResult?.textForTest || "",
        flags: lastResult?.flags || ["g"],
        success: false,
      },
      errors: [MessageType.AI_FAIL],
    };
  } catch (error) {
    console.error("Error generating regex with AI:", error);
    return {
      success: false,
      errors: [MessageType.SERVER_BUSY],
    };
  }
}

async function replicateLLMRegexGenerator(
  replicate: Replicate,
  prompt: string
): Promise<{ pattern: string; flags: string }> {
  try {
    const input = {
      prompt,
      max_new_tokens: 512,
      system_prompt: process.env.SYSTEM_PROMPT,
      prompt_template: "system\n\n{system_prompt}user\n\n{prompt}assistant\n\n",
    };

    const output = await replicate.run("meta/meta-llama-3-70b-instruct", {
      input,
    });
    const outputArray = output as string[];
    const parsedOutput = JSON.parse(outputArray.join(""));
    return {
      pattern: parsedOutput.pattern,
      flags: parsedOutput.flags || "g",
    };
  } catch (error) {
    console.error("Error generating regex from LLM:", error);
    throw new Error("Failed to generate regex pattern from LLM");
  }
}

function createPrompt(formDataDTO: FormDataDTO): string {
  return `
  Generate a regex pattern that matches the following requirements:
  - Description: ${formDataDTO.description}
  - Should Match: ${formDataDTO.shouldMatch.join(", ")}
  - Should NOT Match: ${formDataDTO.shouldNotMatch.join(", ")}
  - Additional Info: ${formDataDTO.info || "None"}

  The regex pattern should be generalized enough to match similar texts in the shouldMatch examples but should not match any of the shouldNotMatch examples. The response should be in JSON format with the fields: pattern, flags, success, and message.
  `;
}
