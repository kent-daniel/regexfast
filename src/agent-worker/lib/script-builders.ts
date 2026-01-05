/**
 * Test script builders for different runtimes
 * Generates code that executes in the sandbox to test regex patterns
 * 
 * This module is runtime-agnostic and can be used by both the agent and the endpoint.
 */

import type { RegexPattern, MatchTestInput, CaptureTestCase } from "./regex-types";

// ─────────────────────────────────────────────────────────────
// JavaScript/TypeScript Match Mode
// ─────────────────────────────────────────────────────────────

/**
 * Build a JavaScript test script for regex match validation
 */
export function buildJsMatchTestScript(
  regex: RegexPattern,
  input: MatchTestInput
): string {
  return `
const pattern = ${JSON.stringify(regex.pattern)};
const flags = ${JSON.stringify(regex.flags)};
const shouldMatch = ${JSON.stringify(input.shouldMatch)};
const shouldNotMatch = ${JSON.stringify(input.shouldNotMatch)};

const results = [];
let compileError = null;

try {
  const regex = new RegExp(pattern, flags);
  
  for (const input of shouldMatch) {
    const actual = regex.test(input);
    results.push({ input, expected: true, actual, passed: actual === true });
  }
  
  for (const input of shouldNotMatch) {
    const actual = regex.test(input);
    results.push({ input, expected: false, actual, passed: actual === false });
  }
} catch (e) {
  compileError = e.message;
}

const passedCount = results.filter(r => r.passed).length;
const output = {
  passed: compileError === null && passedCount === results.length,
  total: results.length,
  passedCount,
  failedCount: results.length - passedCount,
  results,
  testMode: "match",
  ...(compileError && { compileError })
};

console.log(JSON.stringify(output));
`;
}

// ─────────────────────────────────────────────────────────────
// Python Match Mode
// ─────────────────────────────────────────────────────────────

/**
 * Build a Python test script for regex match validation
 */
export function buildPythonMatchTestScript(
  regex: RegexPattern,
  input: MatchTestInput
): string {
  return `
import re
import json

pattern = ${JSON.stringify(regex.pattern)}
should_match = ${JSON.stringify(input.shouldMatch)}
should_not_match = ${JSON.stringify(input.shouldNotMatch)}

results = []
compile_error = None

try:
    regex = re.compile(pattern)
    
    for inp in should_match:
        actual = regex.search(inp) is not None
        results.append({"input": inp, "expected": True, "actual": actual, "passed": actual == True})
    
    for inp in should_not_match:
        actual = regex.search(inp) is not None
        results.append({"input": inp, "expected": False, "actual": actual, "passed": actual == False})

except Exception as e:
    compile_error = str(e)

passed_count = sum(1 for r in results if r["passed"])
output = {
    "passed": compile_error is None and passed_count == len(results),
    "total": len(results),
    "passedCount": passed_count,
    "failedCount": len(results) - passed_count,
    "results": results,
    "testMode": "match"
}
if compile_error:
    output["compileError"] = compile_error

print(json.dumps(output))
`;
}

// ─────────────────────────────────────────────────────────────
// JavaScript/TypeScript Capture Mode
// ─────────────────────────────────────────────────────────────

/**
 * Build a JavaScript test script for regex capture group extraction
 */
export function buildJsCaptureTestScript(
  regex: RegexPattern,
  captureTests: CaptureTestCase[]
): string {
  return `
const pattern = ${JSON.stringify(regex.pattern)};
const flags = ${JSON.stringify(regex.flags)};
const captureTests = ${JSON.stringify(captureTests)};

const results = [];
let compileError = null;

try {
  const regex = new RegExp(pattern, flags);
  
  for (const test of captureTests) {
    const match = regex.exec(test.input);
    
    // Get captured groups (index 1+, not the full match at index 0)
    const actual = match ? Array.from(match).slice(1) : null;
    
    // Get named groups if any
    const actualNamedGroups = match?.groups ? { ...match.groups } : null;
    
    // Compare arrays by value
    const groupsMatch = JSON.stringify(actual) === JSON.stringify(test.expectedGroups);
    
    // Check named groups if expected
    let namedGroupsMatch = true;
    if (test.expectedNamedGroups) {
      namedGroupsMatch = JSON.stringify(actualNamedGroups) === JSON.stringify(test.expectedNamedGroups);
    }
    
    const passed = groupsMatch && namedGroupsMatch;
    
    const result = {
      input: test.input,
      expected: test.expectedGroups,
      actual,
      passed
    };
    
    if (test.expectedNamedGroups) {
      result.expectedNamedGroups = test.expectedNamedGroups;
      result.actualNamedGroups = actualNamedGroups;
    }
    
    results.push(result);
  }
} catch (e) {
  compileError = e.message;
}

const passedCount = results.filter(r => r.passed).length;
const output = {
  passed: compileError === null && passedCount === results.length,
  total: results.length,
  passedCount,
  failedCount: results.length - passedCount,
  results,
  testMode: "capture",
  ...(compileError && { compileError })
};

console.log(JSON.stringify(output));
`;
}

// ─────────────────────────────────────────────────────────────
// Python Capture Mode
// ─────────────────────────────────────────────────────────────

/**
 * Build a Python test script for regex capture group extraction
 */
export function buildPythonCaptureTestScript(
  regex: RegexPattern,
  captureTests: CaptureTestCase[]
): string {
  return `
import re
import json

pattern = ${JSON.stringify(regex.pattern)}
capture_tests = ${JSON.stringify(captureTests)}

results = []
compile_error = None

try:
    regex = re.compile(pattern)
    
    for test in capture_tests:
        match = regex.search(test["input"])
        
        # Get captured groups (index 1+, not the full match)
        if match:
            actual = list(match.groups())
        else:
            actual = None
        
        # Get named groups if any
        actual_named_groups = dict(match.groupdict()) if match else None
        
        # Compare arrays by value
        groups_match = json.dumps(actual) == json.dumps(test["expectedGroups"])
        
        # Check named groups if expected
        named_groups_match = True
        if "expectedNamedGroups" in test and test["expectedNamedGroups"]:
            named_groups_match = json.dumps(actual_named_groups) == json.dumps(test["expectedNamedGroups"])
        
        passed = groups_match and named_groups_match
        
        result = {
            "input": test["input"],
            "expected": test["expectedGroups"],
            "actual": actual,
            "passed": passed
        }
        
        if "expectedNamedGroups" in test and test["expectedNamedGroups"]:
            result["expectedNamedGroups"] = test["expectedNamedGroups"]
            result["actualNamedGroups"] = actual_named_groups
        
        results.append(result)

except Exception as e:
    compile_error = str(e)

passed_count = sum(1 for r in results if r["passed"])
output = {
    "passed": compile_error is None and passed_count == len(results),
    "total": len(results),
    "passedCount": passed_count,
    "failedCount": len(results) - passed_count,
    "results": results,
    "testMode": "capture"
}
if compile_error:
    output["compileError"] = compile_error

print(json.dumps(output))
`;
}
