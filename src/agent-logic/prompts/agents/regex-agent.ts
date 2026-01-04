import {
  isCaptureMode,
  type CaptureRegexRequest,
  type CaptureTestCaseResult,
  type IterationResult,
  type MatchRegexRequest,
  type RegexCandidate,
  type RegexRequest,
  type SandboxRuntime,
  type TestResult,
} from "../../agents/regex-agent/types";

function buildMatchModePrompt(
  request: MatchRegexRequest,
  runtime: SandboxRuntime
): string {
  return `Create a regex for: ${request.description}

Target runtime: ${runtime}${runtime === "python" ? " (Python re module)" : " (JavaScript RegExp)"}

Should match:
${request.shouldMatch.map((s) => `  ✓ "${s}"`).join("\n") || "  (none)"}

Should NOT match:
${request.shouldNotMatch.map((s) => `  ✗ "${s}"`).join("\n") || "  (none)"}`;
}

function buildCaptureModePrompt(
  request: CaptureRegexRequest,
  runtime: SandboxRuntime
): string {
  const namedGroupNote =
    runtime === "python"
      ? "Use (?P<name>...) syntax for named capture groups."
      : "Use (?<name>...) syntax for named capture groups.";

  let prompt = `Create a regex with capture groups for: ${request.description}

Target runtime: ${runtime}${runtime === "python" ? " (Python re module)" : " (JavaScript RegExp)"}
${namedGroupNote}

Expected capture results:`;

  for (const test of request.captureTests) {
    prompt += `\n  Input: "${test.input}" → Groups: ${JSON.stringify(test.expectedGroups)}`;
    if (test.expectedNamedGroups) {
      prompt += `\n    Named groups: ${JSON.stringify(test.expectedNamedGroups)}`;
    }
  }

  return prompt;
}

export function buildRegexAgentGeneratePrompt(
  request: RegexRequest,
  history: IterationResult[],
  runtime: SandboxRuntime
): string {
  let prompt = isCaptureMode(request)
    ? buildCaptureModePrompt(request, runtime)
    : buildMatchModePrompt(request, runtime);

  if (history.length > 0) {
    prompt += `\n\n--- PREVIOUS ATTEMPTS (learn from these) ---\n`;
    for (const h of history) {
      const failedTests = h.testResults.results.filter((r) => !r.passed);

      prompt += `
Attempt: /${h.candidate.pattern}/${h.candidate.flags}
Reasoning: ${h.candidate.reasoning || "(none)"}
Result: ${h.testResults.passedCount}/${h.testResults.total} passed`;

      if (h.testResults.testMode === "capture") {
        const failedCaptures = failedTests as CaptureTestCaseResult[];
        prompt += `\nFailed on:`;
        for (const f of failedCaptures) {
          prompt += `\n  - Input: "${f.input}" expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(f.actual)}`;
        }
      } else {
        prompt += `\nFailed on: ${failedTests.map((r) => `"${r.input}"`).join(", ") || "(none)"}`;
      }

      prompt += `\nAnalysis: ${h.reflection}\n`;
    }
    prompt += `\nFix the issues. Do NOT repeat the same pattern.`;
  }

  return prompt;
}

export function buildRegexAgentGenerateSystemPrompt(
  runtime: SandboxRuntime,
  captureMode: boolean
): string {
  const runtimeNote =
    runtime === "python"
      ? "Note: Generate a pattern compatible with Python's re module. Use (?P<name>...) for named groups. For flags like case-insensitive, embed them inline in the pattern using (?i), (?m), (?s) syntax. Leave the flags field empty."
      : "Note: Generate a pattern compatible with JavaScript's RegExp constructor. Use (?<name>...) for named groups.";

  const captureNote = captureMode
    ? "\nIMPORTANT: Use capturing groups (parentheses) to extract the expected values. The captured groups should match the expected groups array exactly."
    : "";

  return `You are a regex expert. Generate a regex pattern that satisfies all requirements.
${runtimeNote}${captureNote}
Be precise and avoid overly greedy patterns.
Explain your reasoning - why you chose this pattern and how it handles the test cases.

IMPORTANT: Your response MUST include exactly these fields:
- "reasoning": Your explanation of the regex pattern
- "pattern": The regex pattern (without delimiters like / /)  
- "flags": The regex flags (e.g., "g", "i", "gi" for JavaScript, or "" for Python since flags should be inline)`;
}

function buildMatchReflectPrompt(
  candidate: RegexCandidate,
  testResults: TestResult,
  request: RegexRequest
): string {
  const passedTests = testResults.results.filter(
    (r) => r.passed
  ) as Array<{ input: string; expected: boolean }>;
  const failedTests = testResults.results.filter(
    (r) => !r.passed
  ) as Array<{ input: string; expected: boolean; actual: boolean }>;

  return `
Pattern: /${candidate.pattern}/${candidate.flags}
Goal: ${request.description}

Generator's Reasoning:
${candidate.reasoning || "(no reasoning provided)"}

Test Results: ${testResults.passedCount}/${testResults.total} passed
${testResults.compileError ? `\nCompile Error: ${testResults.compileError}` : ""}

✅ Passed (${passedTests.length}):
${passedTests.map((r) => `  "${r.input}" → ${r.expected ? "should match" : "should NOT match"}`).join("\n") || "  (none)"}

❌ Failed (${failedTests.length}):
${failedTests.map((r) => `  "${r.input}" → expected ${r.expected ? "match" : "no match"}, got ${r.actual ? "match" : "no match"}`).join("\n") || "  (none)"}

What's wrong with the reasoning or pattern, and what's the smallest fix?`;
}

function buildCaptureReflectPrompt(
  candidate: RegexCandidate,
  testResults: TestResult,
  request: RegexRequest
): string {
  const passedTests = testResults.results.filter(
    (r) => r.passed
  ) as CaptureTestCaseResult[];
  const failedTests = testResults.results.filter(
    (r) => !r.passed
  ) as CaptureTestCaseResult[];

  return `
Pattern: /${candidate.pattern}/${candidate.flags}
Goal: ${request.description}

Generator's Reasoning:
${candidate.reasoning || "(no reasoning provided)"}

Test Results: ${testResults.passedCount}/${testResults.total} passed
${testResults.compileError ? `\nCompile Error: ${testResults.compileError}` : ""}

✅ Passed (${passedTests.length}):
${passedTests.map((r) => `  "${r.input}" → captured ${JSON.stringify(r.actual)}`).join("\n") || "  (none)"}

❌ Failed (${failedTests.length}):
${failedTests.map((r) => `  "${r.input}" → expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`).join("\n") || "  (none)"}

What's wrong with the capture groups, and what's the smallest fix?`;
}

export function buildRegexAgentReflectUserPrompt(
  candidate: RegexCandidate,
  testResults: TestResult,
  request: RegexRequest
): string {
  const captureMode = testResults.testMode === "capture";

  return captureMode
    ? buildCaptureReflectPrompt(candidate, testResults, request)
    : buildMatchReflectPrompt(candidate, testResults, request);
}

export function buildRegexAgentReflectSystemPrompt(
  captureMode: boolean
): string {
  return captureMode
    ? "You are a regex debugger. Analyze the capture group test results and identify why the wrong groups were captured. Suggest the smallest fix to capture the expected groups. Be concise (2-3 sentences max)."
    : "You are a regex debugger. Analyze the test results and the generator's reasoning to identify what went wrong. Suggest the smallest fix. Be concise (2-3 sentences max).";
}
