import { useState, useCallback } from "react";
import type {
  RegexFlag,
  Runtime,
  TestMode,
  TestCaseResult,
  RegexEditorInitialData,
  RegexTestRequest,
  RegexTestResponse,
} from "@/components/regex-editor/types";

/**
 * Parse a flags string into an array of RegexFlag.
 * e.g., "gi" → ["g", "i"]
 */
function parseFlagsString(flagsStr: string): RegexFlag[] {
  const validFlags: RegexFlag[] = ["g", "i", "m"];
  return flagsStr
    .split("")
    .filter((f): f is RegexFlag => validFlags.includes(f as RegexFlag));
}

/**
 * Extract test inputs from initial data's testResults.details.
 * Returns a newline-separated string of all input values.
 */
function extractTestInputs(
  details?: RegexEditorInitialData["testResults"]
): string {
  if (!details?.details || details.details.length === 0) {
    return "";
  }
  return details.details.map((d) => d.input).join("\n");
}

/**
 * Validate and normalize runtime value.
 */
function parseRuntime(runtime?: string): Runtime {
  if (runtime === "javascript" || runtime === "typescript" || runtime === "python") {
    return runtime;
  }
  return "javascript";
}

export interface UseRegexEditorReturn {
  // State
  pattern: string;
  flags: RegexFlag[];
  mode: TestMode;
  runtime: Runtime;
  testInput: string;
  isLoading: boolean;
  error: string | undefined;
  results: TestCaseResult[] | undefined;

  // Setters
  setPattern: (pattern: string) => void;
  toggleFlag: (flag: RegexFlag) => void;
  setMode: (mode: TestMode) => void;
  setRuntime: (runtime: Runtime) => void;
  setTestInput: (input: string) => void;
  runTest: () => Promise<void>;
}

/**
 * Hook to manage state and test execution logic for the regex editor.
 *
 * @param initialData - Initial data to populate the editor state
 * @returns State values and setter functions for the regex editor
 */
export function useRegexEditor(
  initialData?: RegexEditorInitialData
): UseRegexEditorReturn {
  // Initialize state from props
  const [pattern, setPattern] = useState<string>(initialData?.pattern ?? "");
  const [flags, setFlags] = useState<RegexFlag[]>(
    parseFlagsString(initialData?.flags ?? "")
  );
  const [mode, setMode] = useState<TestMode>(
    initialData?.testResults?.mode ?? "match"
  );
  const [runtime, setRuntime] = useState<Runtime>(
    parseRuntime(initialData?.runtime)
  );
  const [testInput, setTestInput] = useState<string>(
    extractTestInputs(initialData?.testResults)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<TestCaseResult[] | undefined>(
    undefined
  );

  /**
   * Toggle a flag on or off.
   */
  const toggleFlag = useCallback((flag: RegexFlag) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  }, []);

  /**
   * Run the regex test by POSTing to /api/regex/test.
   */
  const runTest = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Split testInput into lines, filtering out empty lines
      const lines = testInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        setError("Please provide at least one test input");
        setIsLoading(false);
        return;
      }

      // Build the request based on mode
      const request: RegexTestRequest = {
        pattern,
        flags: flags.join(""),
        mode,
        runtime: runtime === "typescript" ? "javascript" : runtime,
      };

      if (mode === "match") {
        // Match mode: all lines go to shouldMatch
        request.shouldMatch = lines;
      } else {
        // Capture mode: lines become captureTests with empty expectedGroups
        request.captureTests = lines.map((input) => ({
          input,
          expectedGroups: [],
        }));
      }

      const response = await fetch("/api/regex/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      const data: RegexTestResponse = await response.json();

      // Check for compile error
      if (data.compileError) {
        setError(data.compileError);
        setResults(undefined);
        return;
      }

      // Transform API response to TestCaseResult[]
      const testResults: TestCaseResult[] = data.results.map((r) => ({
        input: r.input,
        passed: r.passed,
        matched: mode === "match" ? Boolean(r.actual) : undefined,
        groups: mode === "capture" && Array.isArray(r.actual)
          ? (r.actual as (string | null)[])
          : undefined,
      }));

      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [pattern, flags, mode, runtime, testInput]);

  return {
    // State
    pattern,
    flags,
    mode,
    runtime,
    testInput,
    isLoading,
    error,
    results,

    // Setters
    setPattern,
    toggleFlag,
    setMode,
    setRuntime,
    setTestInput,
    runTest,
  };
}
