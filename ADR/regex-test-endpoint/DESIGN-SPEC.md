# Regex Test Endpoint - Design Specification

## Overview

This document outlines the design for a new endpoint that allows testing regex patterns against inputs in a sandboxed environment. The implementation extracts reusable regex execution logic from the agent-specific `execute` function.

## Status: ✅ IMPLEMENTED

The implementation follows **Option A: Extract Core Logic + Thin Wrappers** with **Client-Managed Sandbox Reuse**.

---

## Implementation Summary

### Files Created

| File | Purpose |
|------|---------|
| [src/agent-worker/lib/regex-types.ts](../../src/agent-worker/lib/regex-types.ts) | Shared type definitions (avoids circular deps) |
| [src/agent-worker/lib/script-builders.ts](../../src/agent-worker/lib/script-builders.ts) | JS/Python test script generators |
| [src/agent-worker/lib/regex-executor.ts](../../src/agent-worker/lib/regex-executor.ts) | Core execution engine |
| [src/agent-worker/endpoints/regex-test.ts](../../src/agent-worker/endpoints/regex-test.ts) | HTTP endpoint handler |

### Files Modified

| File | Change |
|------|--------|
| [src/agent-worker/agents/regex-agent/agent-execute.ts](../../src/agent-worker/agents/regex-agent/agent-execute.ts) | Refactored to use core executor |
| [src/agent-worker/server.ts](../../src/agent-worker/server.ts) | Added endpoint routing |

---

## Architecture

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    src/agent-worker/lib/                        │
├─────────────────────────────────────────────────────────────────┤
│  regex-types.ts     (Shared type definitions)                   │
│  script-builders.ts (JS/Python test script generators)          │
│  regex-executor.ts  (Core execution logic)                      │
│  └── executeRegexTest()                                         │
│  └── validateRegexSyntax()                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│ Agent Execute Step      │     │ HTTP Endpoint                   │
│ (agent-execute.ts)      │     │ (endpoints/regex-test.ts)       │
│ - Agent-specific logs   │     │ - REST API interface            │
│ - Iteration tracking    │     │ - CORS support                  │
│ - Reflection context    │     │ - Client-managed sandbox reuse  │
└─────────────────────────┘     └─────────────────────────────────┘
```

---

## Sandbox Management: Client-Managed Reuse

The implementation uses **client-managed sandbox reuse**:

1. Client calls endpoint without `sandboxId` → new sandbox created
2. Response includes `sandboxId` 
3. Client passes `sandboxId` in subsequent requests → sandbox reused
4. If sandbox expired/unavailable → new sandbox created automatically

**Why this approach:**
- Simple implementation
- Client controls lifecycle
- Consistent with existing agent pattern
- No server-side pool management complexity

---

## API Reference

### Endpoint: `POST /api/regex/test`

#### Request Schema

```typescript
interface RegexTestRequest {
  // Required
  pattern: string;           // Regex pattern (without delimiters)
  mode: "match" | "capture"; // Test mode
  
  // Optional
  flags?: string;            // Regex flags (default: "")
  runtime?: "javascript" | "python"; // (default: "javascript")
  sandboxId?: string;        // Reuse existing sandbox
  timeout?: number;          // Max 30 seconds (default: 10)
  
  // Match mode fields
  shouldMatch?: string[];    // Strings that SHOULD match
  shouldNotMatch?: string[]; // Strings that should NOT match
  
  // Capture mode fields
  captureTests?: Array<{
    input: string;
    expectedGroups: (string | null)[];
    expectedNamedGroups?: Record<string, string>;
  }>;
}
```

#### Response Schema

```typescript
interface RegexTestResponse {
  // Test results
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: Array<{
    input: string;
    expected: boolean | (string | null)[];
    actual: boolean | (string | null)[] | null;
    passed: boolean;
  }>;
  testMode: "match" | "capture";
  compileError?: string;
  
  // Sandbox info (for reuse)
  sandboxId: string;
  runtime: "javascript" | "python";
}
```

#### Error Response Schema

```typescript
interface RegexTestErrorResponse {
  error: string;
  code: "VALIDATION_ERROR" | "SYNTAX_ERROR" | "EXECUTION_ERROR" | "TIMEOUT_ERROR";
  details?: string;
}
```

---

## Example Requests

### Match Mode (JavaScript)

```bash
curl -X POST https://your-worker.dev/api/regex/test \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "^[a-z]+@[a-z]+\\.[a-z]{2,}$",
    "flags": "i",
    "mode": "match",
    "runtime": "javascript",
    "shouldMatch": ["test@example.com", "user@domain.org"],
    "shouldNotMatch": ["invalid", "no-at-sign.com", "@missing.com"]
  }'
```

### Capture Mode (Python)

```bash
curl -X POST https://your-worker.dev/api/regex/test \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "(\\d{3})-(\\d{3})-(\\d{4})",
    "mode": "capture",
    "runtime": "python",
    "captureTests": [
      {
        "input": "Phone: 555-123-4567",
        "expectedGroups": ["555", "123", "4567"]
      }
    ]
  }'
```

### Reusing a Sandbox

```bash
# First request - creates sandbox
RESPONSE=$(curl -s -X POST https://your-worker.dev/api/regex/test \
  -H "Content-Type: application/json" \
  -d '{"pattern": "\\d+", "mode": "match", "shouldMatch": ["123"]}')

SANDBOX_ID=$(echo $RESPONSE | jq -r '.sandboxId')

# Second request - reuses sandbox (faster)
curl -X POST https://your-worker.dev/api/regex/test \
  -H "Content-Type: application/json" \
  -d "{
    \"pattern\": \"[a-z]+\",
    \"mode\": \"match\",
    \"sandboxId\": \"$SANDBOX_ID\",
    \"shouldMatch\": [\"hello\"]
  }"
```

---

## Design Decisions

### Why separate `regex-types.ts`?

To avoid circular dependencies:
- `script-builders.ts` needs types like `RegexPattern`, `CaptureTestCase`
- `regex-executor.ts` needs script builders AND types
- Solution: Types in separate file, both import from there

### Why not reuse from AIChatAgent state?

The endpoint operates independently of the chat agent. Benefits:
- Stateless requests (easier to scale, test, debug)
- No coupling to WebSocket sessions
- Can be used by external clients (CLI, tests, other services)

If needed in future, the agent could expose its `sandboxId` via a separate endpoint.

### Why client-managed reuse vs server pooling?

- **Simpler**: No pool management, no cleanup scheduling
- **Consistent**: Same pattern already used by the agent
- **Flexible**: Client decides when to reuse vs create new
- **Cost-effective**: Sandbox auto-stops after inactivity

---

## Future Enhancements

1. **Batch Testing**: Multiple patterns in one request
2. **Syntax-Only Mode**: Quick validation without sandbox
3. **Server-Side Pooling**: If cold starts become problematic
4. **Rate Limiting**: Protect against abuse
5. **Authentication**: For production deployment

---

*Document created: 2026-01-05*
*Status: Implemented*
