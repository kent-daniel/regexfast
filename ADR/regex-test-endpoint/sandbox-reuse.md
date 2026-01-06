# ADR: Sandbox reuse and pooling strategy (Daytona)

- Date: 2026-01-06
- Status: Proposed
- Owners: (you)

## Context

We have a regex testing workflow that executes untrusted user-provided patterns/test strings inside Daytona sandboxes.

There are two primary execution surfaces:

1. **Agent loop** (Durable Object session in [src/agent-worker/server.ts](../../src/agent-worker/server.ts))
   - Stores a `sandboxId` on the Chat DO for session-level reuse.
2. **Regex test HTTP endpoint** in [src/agent-worker/endpoints/regex-test.ts](../../src/agent-worker/endpoints/regex-test.ts)
   - Designed for **client-managed sandbox reuse**: caller receives a `sandboxId` and may pass it back.

### Observed problem

Even when `sandboxId` was provided, the backend still created a new sandbox almost every call.

Root cause:
- `getOrCreateSandbox` enforces safety by checking `if (!sandbox.networkBlockAll)`.
- If Daytona returns `networkBlockAll` as `undefined` on `get()` (or omits it), `!undefined === true`, so the code recreates even when the sandbox is perfectly fine.

This broke the intended behavior in both the HTTP endpoint and the agent loop.

## Goals

- **Make client-provided `sandboxId` reuse actually work**.
- Keep a strong safety posture (no outbound networking).
- Reduce per-request overhead where possible (avoid repeated SDK client construction; optionally reuse sandboxes within an isolate).
- Provide a path to broader reuse *if desired*, while documenting risks.

## Non-goals

- Perfectly persistent or globally shared sandbox pooling across isolates/regions.
- Introducing new API requirements (cookies, auth headers, session identifiers) for `/api/regex/test`.
- Building a full sandbox lifecycle service.

## Decision

### A) Fix reuse correctness (Proposed)

Update sandbox safety validation to treat only explicit `false` as unsafe:

- Old behavior: recreate when `!sandbox.networkBlockAll`
- New behavior: recreate only when `sandbox.networkBlockAll === false`

Rationale:
- Avoids false-negative safety decisions due to missing hydration.
- Still blocks reuse if a sandbox is known to be unsafe.

Implementation: [src/agent-worker/sandbox.ts](../../src/agent-worker/sandbox.ts)

### B) Add isolate-local cache + lease API (Optional)

Add an isolate-local best-effort cache and a `acquireSandboxLease()` API:

- Caches `Sandbox` objects by id for a short TTL.
- Allows the HTTP endpoint to acquire/release safely within the same isolate.
- Prevents concurrent use of the same sandbox **within a single isolate** via an `inUse` bit.

This reduces overhead and improves reuse behavior without changing public HTTP API semantics.

Implementation:
- [src/agent-worker/sandbox.ts](../../src/agent-worker/sandbox.ts) (`acquireSandboxLease`, TTL+max size)
- [src/agent-worker/endpoints/regex-test.ts](../../src/agent-worker/endpoints/regex-test.ts) uses acquire → execute → release

### C) Shared per-isolate sandbox pooling by runtime (Optional; feature-flagged)

Enable reuse of *any idle sandbox of the same runtime* within an isolate only when:

- `SANDBOX_SHARED_POOL=1|true`

Rationale:
- Can reduce sandbox creation churn for bursty traffic.
- Isolate-local only, so it’s a modest win (not global pooling).

Important risk:
- Depending on Daytona sandbox semantics, this can lead to **cross-request state leakage** (filesystem, temp files, interpreter state, etc.).
- This is why it is feature-flagged and **disabled by default**.

If this is enabled for production, we should first confirm Daytona provides a truly clean execution environment per `codeRun` or introduce an explicit sandbox reset step.

## Options considered (staff-level)

### Option 1 — Keep only client-managed sandbox reuse (status quo design)

- Reuse only when caller presents a `sandboxId`.
- Pros: best privacy story; simple mental model.
- Cons: callers must store/forward id; higher creation churn for single-shot callers.

### Option 2 — Isolate-local shared pool (this ADR’s “Proposed”)

- Best-effort reuse inside one worker isolate.
- Pros: low implementation complexity; zero additional infra.
- Cons:
  - Not reliable (isolates churn).
  - Cross-request state leakage risk if sandboxes are not clean.
  - Limited win at scale (no cross-isolate reuse).

### Option 3 — Durable Object-backed sandbox pool (recommended if we truly want “reuse any”)

- Create a DO that manages a pool per runtime:
  - Tracks idle/busy sandboxes.
  - Provides a lease token per request.
  - Optionally deletes/rotates sandboxes.
- Pros:
  - Real pooling across requests and across worker isolates.
  - Centralized concurrency control.
- Cons:
  - More infra/complexity.
  - Still must solve privacy/state leakage (reset/rotation) and cost controls.

### Option 3b — Store a bounded per-session pool in the existing Chat DO (recommended for agent sessions)

If the main pain is “agent session keeps recreating sandboxes”, the cleanest fix is to make the **Durable Object the source of truth**:

- Store a per-runtime list of sandbox ids in the DO state.
- Enforce `maxSandboxesPerRuntime = X` (configurable).
- On each tool run:
  1) Pick the most recently used sandbox for that runtime.
  2) Check if it’s still active.
     - Fast check: attempt a trivial `codeRun` like `print(1)`/`console.log(1)` with a very small timeout.
     - Alternative: Daytona `get(id)` and treat “not found/expired” as dead.
  3) If alive: reuse.
  4) If dead: create a new sandbox, replace the dead entry in the DO list.
  5) If we exceed X: evict the LRU entry (optionally call `deleteSandbox(id)` best-effort).

State sketch in DO:

```ts
type Runtime = "javascript" | "python";

type SandboxRef = {
  id: string;
  runtime: Runtime;
  lastUsedAt: string; // ISO
  createdAt: string;  // ISO
};

type SessionSandboxState = {
  maxSandboxesPerRuntime: number;
  sandboxes: Record<Runtime, SandboxRef[]>; // ordered most-recent first
};
```

Notes:
- This avoids cross-user leakage because DO == session.
- Concurrency: DO is single-threaded per instance, so you can safely implement “inUse” semantics and avoid 2 concurrent tool calls claiming the same sandbox.

Where this fits:
- Agent tools already have access to the Chat DO instance (see `sandboxId?: string` fields in [src/agent-worker/server.ts](../../src/agent-worker/server.ts)).
- We’d evolve `sandboxId` → `sandboxPoolState` (or keep `sandboxId` as the “current” pointer and add a list for rotation/limits).

### Option 3c — DO-backed pool for the public regex-test endpoint (needs a session key)

For `/api/regex/test`, there is no Durable Object instance today. If you want “reuse any sandboxes given the runtime” for that endpoint, you need a stable key to route to a DO:

- **Explicit session key** in the request (recommended): `sessionId` or `poolKey`.
- Or derive from auth user id (if/when auth exists).

Without a stable key, a DO pool becomes effectively a shared global pool, which is where privacy/state leakage gets risky.

### Option 4 — Per-user/session sandbox routing (privacy-preserving)

- Require a stable session key:
  - e.g. authenticated user id, or explicit client session id.
- Route requests to a per-session sandbox.
- Pros: avoids cross-user leakage.
- Cons: requires auth/session semantics; changes API expectations.

### Option 5 — External sandbox broker service (Node / container)

- Move sandbox lifecycle management to a dedicated service.
- Pros: richer lifecycle control; can implement robust eviction/metrics.
- Cons: extra service + ops burden.

## Rollout plan

1. Land correctness fix and cache/lease API (done).
2. Keep `SANDBOX_SHARED_POOL` disabled by default.
3. If we want shared pooling:
   - Confirm Daytona execution is stateless per run OR implement reset.
   - Add observability: sandbox create rate, reuse rate, errors.
   - Enable `SANDBOX_SHARED_POOL` in dev/staging first.

## Success metrics

- Reduced sandbox creation count per repeated `sandboxId` usage.
- Lower average latency for `/api/regex/test` (especially for repeated calls).
- No increase in sandbox execution error rates.

## Notes / follow-ups

- If we decide to enable shared pooling broadly, we should explicitly assess privacy/state leakage and consider adding an explicit cleanup/reset script per lease.
- Consider enforcing an upper bound on total cached sandboxes across languages if traffic patterns change.
