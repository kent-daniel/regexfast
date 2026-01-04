/**
 * Test script builders for free code execution
 * Generates code that executes in the Daytona sandbox to test generated code
 */

import type { FreeCodeTest } from "./types";

/**
 * Build a JavaScript test script for validating generated code
 * 
 * @param llmCode - The LLM-generated code containing processInput function
 * @param tests - Array of test cases to run
 * @returns JavaScript code string to execute in sandbox
 */
export function buildJsFreeCodeScript(
  llmCode: string,
  tests: FreeCodeTest[]
): string {
  return `
// ==== LLM GENERATED CODE START ====
${llmCode}
// ==== LLM GENERATED CODE END ====

// Test harness
const tests = ${JSON.stringify(tests)};
const results = [];

for (const test of tests) {
  try {
    const actual = processInput(test.input);
    const expected = test.expectedOutput;
    
    // Deep equality check
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    
    results.push({
      input: test.input,
      expected,
      actual,
      passed
    });
  } catch (error) {
    results.push({
      input: test.input,
      expected: test.expectedOutput,
      actual: null,
      passed: false,
      error: error.message
    });
  }
}

const passedCount = results.filter(r => r.passed).length;
const output = {
  passed: passedCount === results.length,
  total: results.length,
  passedCount,
  failedCount: results.length - passedCount,
  results
};

console.log(JSON.stringify(output));
`;
}

/**
 * Build a Python test script for validating generated code
 * 
 * @param llmCode - The LLM-generated code containing process_input function
 * @param tests - Array of test cases to run
 * @returns Python code string to execute in sandbox
 */
export function buildPythonFreeCodeScript(
  llmCode: string,
  tests: FreeCodeTest[]
): string {
  return `
import json

# ==== LLM GENERATED CODE START ====
${llmCode}
# ==== LLM GENERATED CODE END ====

# Test harness
tests = ${JSON.stringify(tests)}
results = []

for test in tests:
    try:
        actual = process_input(test["input"])
        expected = test["expectedOutput"]
        
        # Deep equality check via JSON serialization
        passed = json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)
        
        results.append({
            "input": test["input"],
            "expected": expected,
            "actual": actual,
            "passed": passed
        })
    except Exception as e:
        results.append({
            "input": test["input"],
            "expected": test["expectedOutput"],
            "actual": None,
            "passed": False,
            "error": str(e)
        })

passed_count = sum(1 for r in results if r["passed"])
output = {
    "passed": passed_count == len(results),
    "total": len(results),
    "passedCount": passed_count,
    "failedCount": len(results) - passed_count,
    "results": results
}

print(json.dumps(output))
`;
}

/**
 * Build a test script for the specified runtime
 * 
 * @param llmCode - The LLM-generated code
 * @param tests - Array of test cases to run
 * @param runtime - Target runtime ("javascript" or "python")
 * @returns Code string to execute in sandbox
 */
export function buildFreeCodeScript(
  llmCode: string,
  tests: FreeCodeTest[],
  runtime: "javascript" | "python"
): string {
  if (runtime === "python") {
    return buildPythonFreeCodeScript(llmCode, tests);
  }
  return buildJsFreeCodeScript(llmCode, tests);
}
