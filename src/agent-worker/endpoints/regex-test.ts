/**
 * Regex Test Endpoint
 * 
 * REST API for testing regex patterns against inputs in a sandboxed environment.
 * Supports both match (validation) and capture (extraction) modes.
 * 
 * Features:
 * - Client-managed sandbox reuse via sandboxId
 * - JavaScript and Python runtime support
 * - Syntax validation before sandbox execution
 */

import { getOrCreateSandbox } from "../sandbox";
import {
  executeRegexTest,
  validateRegexSyntax,
  type TestInput,
  type TestResult,
  type Runtime,
  type TestMode,
  type CaptureTestCase,
} from "../lib/regex-executor";

// ─────────────────────────────────────────────────────────────
// Request/Response Types
// ─────────────────────────────────────────────────────────────

export interface RegexTestRequest {
  /** The regex pattern (without delimiters) */
  pattern: string;
  /** Regex flags (default: "") */
  flags?: string;
  /** Test mode: "match" for validation, "capture" for extraction */
  mode: TestMode;
  /** Target runtime (default: "javascript") */
  runtime?: Runtime;
  /** Optional: reuse existing sandbox by ID */
  sandboxId?: string;
  /** Execution timeout in seconds (default: 10, max: 30) */
  timeout?: number;

  // Match mode fields
  /** Strings that SHOULD match the regex */
  shouldMatch?: string[];
  /** Strings that should NOT match the regex */
  shouldNotMatch?: string[];

  // Capture mode fields
  /** Capture test cases for group extraction */
  captureTests?: CaptureTestCase[];
}

export interface RegexTestResponse extends TestResult {
  /** Sandbox ID for potential reuse */
  sandboxId: string;
  /** Runtime used for testing */
  runtime: Runtime;
}

export interface RegexTestErrorResponse {
  error: string;
  code: "VALIDATION_ERROR" | "SYNTAX_ERROR" | "EXECUTION_ERROR" | "TIMEOUT_ERROR";
  details?: string;
}

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  error?: string;
  testInput?: TestInput;
}

/**
 * Validate the request and extract test input
 */
function validateRequest(body: RegexTestRequest): ValidationResult {
  // Required fields
  if (!body.pattern || typeof body.pattern !== "string") {
    return { valid: false, error: "pattern is required and must be a string" };
  }

  if (!body.mode || !["match", "capture"].includes(body.mode)) {
    return { valid: false, error: "mode is required and must be 'match' or 'capture'" };
  }

  // Validate flags
  const flags = body.flags ?? "";
  if (typeof flags !== "string") {
    return { valid: false, error: "flags must be a string" };
  }

  // Validate runtime
  const runtime = body.runtime ?? "javascript";
  if (!["javascript", "python"].includes(runtime)) {
    return { valid: false, error: "runtime must be 'javascript' or 'python'" };
  }

  // Mode-specific validation
  if (body.mode === "match") {
    const shouldMatch = body.shouldMatch ?? [];
    const shouldNotMatch = body.shouldNotMatch ?? [];

    if (!Array.isArray(shouldMatch) || !Array.isArray(shouldNotMatch)) {
      return { valid: false, error: "shouldMatch and shouldNotMatch must be arrays" };
    }

    if (shouldMatch.length === 0 && shouldNotMatch.length === 0) {
      return { valid: false, error: "at least one test case is required (shouldMatch or shouldNotMatch)" };
    }

    return {
      valid: true,
      testInput: { shouldMatch, shouldNotMatch },
    };
  } else {
    // Capture mode
    const captureTests = body.captureTests;

    if (!Array.isArray(captureTests) || captureTests.length === 0) {
      return { valid: false, error: "captureTests is required and must be a non-empty array" };
    }

    // Validate each capture test
    for (let i = 0; i < captureTests.length; i++) {
      const test = captureTests[i];
      if (!test.input || typeof test.input !== "string") {
        return { valid: false, error: `captureTests[${i}].input is required and must be a string` };
      }
      if (!Array.isArray(test.expectedGroups)) {
        return { valid: false, error: `captureTests[${i}].expectedGroups is required and must be an array` };
      }
    }

    return {
      valid: true,
      testInput: { captureTests },
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Request Handler
// ─────────────────────────────────────────────────────────────

/**
 * Handle regex test request
 * 
 * This is the main handler for the /api/regex/test endpoint.
 */
export async function handleRegexTestRequest(
  request: Request,
  _env: Env
): Promise<Response> {
  // Only accept POST
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed", code: "VALIDATION_ERROR" } satisfies RegexTestErrorResponse,
      { status: 405 }
    );
  }

  // Parse body
  let body: RegexTestRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body", code: "VALIDATION_ERROR" } satisfies RegexTestErrorResponse,
      { status: 400 }
    );
  }

  // Validate request
  const validation = validateRequest(body);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error!, code: "VALIDATION_ERROR" } satisfies RegexTestErrorResponse,
      { status: 400 }
    );
  }

  const runtime: Runtime = body.runtime ?? "javascript";
  const flags = body.flags ?? "";
  const timeout = Math.min(body.timeout ?? 10, 30); // Cap at 30 seconds

  // Quick syntax validation for JavaScript (avoid sandbox for invalid regex)
  if (runtime === "javascript") {
    const syntaxError = validateRegexSyntax(body.pattern, flags);
    if (syntaxError) {
      return Response.json(
        {
          error: "Invalid regex syntax",
          code: "SYNTAX_ERROR",
          details: syntaxError,
        } satisfies RegexTestErrorResponse,
        { status: 400 }
      );
    }
  }

  // Get or create sandbox
  let sandbox;
  try {
    sandbox = await getOrCreateSandbox(
      runtime === "python" ? "python" : "javascript",
      body.sandboxId
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to create sandbox",
        code: "EXECUTION_ERROR",
        details: error instanceof Error ? error.message : String(error),
      } satisfies RegexTestErrorResponse,
      { status: 500 }
    );
  }

  // Track if sandbox was recreated
  let currentSandboxId = sandbox.id;

  // Execute regex test
  try {
    const result = await executeRegexTest(
      sandbox,
      { pattern: body.pattern, flags },
      validation.testInput!,
      {
        runtime,
        timeout,
        onSandboxRecreated: (newSandbox) => {
          currentSandboxId = newSandbox.id;
        },
      }
    );

    const response: RegexTestResponse = {
      ...result,
      sandboxId: currentSandboxId,
      runtime,
    };

    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Check for timeout
    if (message.toLowerCase().includes("timeout")) {
      return Response.json(
        {
          error: "Execution timeout",
          code: "TIMEOUT_ERROR",
          details: message,
        } satisfies RegexTestErrorResponse,
        { status: 408 }
      );
    }

    return Response.json(
      {
        error: "Execution failed",
        code: "EXECUTION_ERROR",
        details: message,
      } satisfies RegexTestErrorResponse,
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// CORS Handler
// ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Wrap handler with CORS support
 */
export async function handleRegexTestWithCORS(
  request: Request,
  env: Env
): Promise<Response> {
  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const response = await handleRegexTestRequest(request, env);

  // Add CORS headers to response
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
