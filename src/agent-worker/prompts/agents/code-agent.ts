import type { GenerateCodeRequest, SandboxRuntime } from "../../agents/code-agent/types";

export function buildCodeAgentSystemPrompt(runtime: SandboxRuntime): string {
  if (runtime === "python") {
    return `You are an expert Python programmer. Generate clean, efficient Python code.

IMPORTANT RULES:
1. Define a function called \`process_input(inp)\` that takes a single string input and returns the processed result.
2. The function MUST be named exactly \`process_input\` (with underscore).
3. Keep the code simple and focused on solving the specific problem.
4. Do NOT use any external libraries that aren't part of Python's standard library.
5. Do NOT make any network requests or access the filesystem.
6. Handle edge cases gracefully.
7. Return appropriate Python types (str, list, dict, int, float, bool, None).

Example format:
\`\`\`python
def process_input(inp):
    # Process the input string
    result = inp.upper()  # Example transformation
    return result
\`\`\``;
  }

  return `You are an expert JavaScript programmer. Generate clean, efficient JavaScript code.

IMPORTANT RULES:
1. Define a function called \`processInput(input)\` that takes a single string input and returns the processed result.
2. The function MUST be named exactly \`processInput\` (camelCase).
3. Keep the code simple and focused on solving the specific problem.
4. Do NOT use any external libraries - only vanilla JavaScript.
5. Do NOT make any network requests (fetch, XMLHttpRequest, etc.) or access the filesystem.
6. Handle edge cases gracefully.
7. Return appropriate JavaScript types (string, array, object, number, boolean, null).

Example format:
\`\`\`javascript
function processInput(input) {
  // Process the input string
  const result = input.toUpperCase();  // Example transformation
  return result;
}
\`\`\``;
}

export function buildCodeAgentUserPrompt(request: GenerateCodeRequest): string {
  let prompt = `Generate code to: ${request.description}

Test cases that must pass:`;

  for (const test of request.tests) {
    prompt += `\n  Input: ${JSON.stringify(test.input)} → Expected output: ${JSON.stringify(test.expectedOutput)}`;
  }

  prompt += `\n\nGenerate the ${request.runtime === "python" ? "process_input" : "processInput"} function that handles all these test cases correctly.`;

  return prompt;
}
