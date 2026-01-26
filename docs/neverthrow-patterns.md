# Neverthrow Error Handling Patterns

This document outlines the proper patterns for using [neverthrow](https://github.com/supermacro/neverthrow) in this codebase, along with migration recommendations.

## Why Neverthrow?

Our codebase currently has:
- **42+ try-catch blocks** with inconsistent error recovery
- **13 throw statements** where callers don't know what to expect
- **Result-like patterns** already in use (e.g., `{ success: boolean, error?: string }`)

Neverthrow provides:
- **Type-safe error handling** - errors are part of the function signature
- **Compile-time enforcement** - TypeScript ensures you handle errors
- **Composability** - chain operations with `.andThen()`, `.map()`, `.orElse()`

---

## Anti-Pattern: "If-Err-Return-Err" Hell

This is the most common mistake when adopting neverthrow:

```typescript
// BAD - defeats the purpose of neverthrow
export const signUpUser = async (req, res): Promise<ResultAsync<User, AppError>> => {
  const reqBody = validateReqBody(req?.body);
  if (reqBody.isErr()) {
    return err(reqBody.error);  // Manual unwrap + re-wrap
  }
  const { email, password } = reqBody.value;

  const user = await findUserByEmail(email);
  if (user.isErr()) {
    return err(user.error);  // Repeat for every step...
  }

  const addUserToIdp = await addUserToIdp({ email, password });
  if (addUserToIdp.isErr()) {
    return err(addUserToIdp.error);  // This is just try-catch with extra steps!
  }

  // ... more of the same
  return ok({ user });
};
```

**Problems:**
- More boilerplate than try-catch
- No composability benefits
- Loses type inference after each check
- Essentially imperative error handling in disguise

---

## Correct Pattern: `andThen` Chains

```typescript
// GOOD - declarative, composable, type-safe
export const signUpUser = (req, res): ResultAsync<User, AppError> => {
  return validateReqBody(req?.body)
    .asyncAndThen(({ email, password }) =>
      findUserByEmail(email)
        .andThen((existingUser) =>
          existingUser
            ? err({ type: 'DUPLICATE_EMAIL', email })
            : ok({ email, password })
        )
    )
    .andThen(({ email, password }) =>
      addUserToIdp({ email, password })
    )
    .andThen(({ email }) =>
      createUser({ email })
    )
    .andThen(({ email }) =>
      sendVerificationEmail(email)
    )
    .map((user) => ({ user }));
};
```

**Benefits:**
- Errors short-circuit automatically (no manual checks)
- Data flows through the chain
- ~50% less code
- Type inference works throughout

---

## Key Methods

### `andThen` - Sequential Operations (flatMap)

Use when the next step depends on the previous result and can fail:

```typescript
createSandbox('typescript')
  .andThen((sandbox) => executeCode(sandbox, code))  // Can fail
  .andThen((result) => parseJson(result));           // Can fail
```

### `map` - Transform Success Value

Use when transforming data that cannot fail:

```typescript
getUserById(id)
  .map((user) => user.email);  // Just extracting, can't fail
```

### `mapErr` - Transform Error Value

Use to convert error types between layers:

```typescript
databaseQuery()
  .mapErr((dbError) => ({
    type: 'DATABASE_ERROR',
    message: dbError.message,
    code: 500
  }));
```

### `orElse` - Recover from Errors

Use to provide fallback behavior:

```typescript
getCachedValue(key)
  .orElse(() => fetchFromDatabase(key))  // Fallback on cache miss
  .orElse(() => ok(defaultValue));       // Final fallback
```

### `match` - Handle Both Cases (Terminal)

Use at **boundaries only** (controllers, handlers, UI):

```typescript
// In controller - convert Result to HTTP response
const result = await signUpUser(req);

return result.match(
  (user) => res.status(201).json(user),
  (error) => {
    switch (error.type) {
      case 'VALIDATION_ERROR': return res.status(400).json(error);
      case 'DUPLICATE_EMAIL': return res.status(409).json(error);
      default: return res.status(500).json(error);
    }
  }
);
```

---

## Converting Existing Code

### From Try-Catch

```typescript
// Before
async function executeInSandbox(sandbox: Sandbox, code: string): Promise<string> {
  try {
    const result = await sandbox.execute(code);
    return result.stdout;
  } catch (error) {
    throw new Error(`Execution failed: ${error.message}`);
  }
}

// After
function executeInSandbox(sandbox: Sandbox, code: string): ResultAsync<string, SandboxError> {
  return ResultAsync.fromPromise(
    sandbox.execute(code),
    (e): SandboxError => ({ type: 'EXECUTION_ERROR', cause: e })
  ).map((result) => result.stdout);
}
```

### From Throw Statements

```typescript
// Before
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required env var ${name} not set`);
  }
  return value;
}

// After
function requireEnv(name: string): Result<string, EnvError> {
  const value = process.env[name];
  if (!value) {
    return err({ type: 'MISSING_ENV', name });
  }
  return ok(value);
}
```

### From Success/Error Objects

```typescript
// Before (already in our codebase)
return { success: false, error: `Regex generation failed: ${message}` };
return { success: true, pattern: result.pattern };

// After
return err({ type: 'GENERATION_ERROR', message });
return ok({ pattern: result.pattern });
```

### From JSON.parse

```typescript
// Before
try {
  const data = JSON.parse(jsonString);
} catch (e) {
  // handle error
}

// After
const parseJson = Result.fromThrowable(
  JSON.parse,
  (e): ParseError => ({ type: 'PARSE_ERROR', cause: e })
);

const result = parseJson(jsonString);
```

---

## Typed Error Discriminated Unions

Define error types as discriminated unions for exhaustive handling:

```typescript
// errors.ts
export type SandboxError =
  | { type: 'CONFIG_ERROR'; message: string }
  | { type: 'NOT_FOUND'; sandboxId: string }
  | { type: 'EXECUTION_ERROR'; exitCode: number; stderr: string }
  | { type: 'TIMEOUT_ERROR'; timeoutMs: number }
  | { type: 'ABORT_ERROR' };

export type RegexAgentError =
  | { type: 'VALIDATION_ERROR'; field: string; message: string }
  | { type: 'GENERATION_ERROR'; attempts: number; lastError: string }
  | { type: 'SANDBOX_ERROR'; cause: SandboxError };

// Usage - TypeScript enforces exhaustive handling
result.match(
  (value) => handleSuccess(value),
  (error) => {
    switch (error.type) {
      case 'VALIDATION_ERROR': return handleValidation(error);
      case 'GENERATION_ERROR': return handleGeneration(error);
      case 'SANDBOX_ERROR': return handleSandbox(error.cause);
      // TypeScript error if you miss a case!
    }
  }
);
```

---

## Where to Use `isErr()` / `isOk()`

Only use explicit checks at **system boundaries**:

```typescript
// Controllers/Handlers - YES
const result = await userService.signUp(data);
if (result.isErr()) {
  return res.status(400).json(result.error);
}
return res.status(201).json(result.value);

// Service/Business Logic - NO (use andThen chains)
// Repository/Data Layer - NO (use andThen chains)
```

---

## Migration Priority

### Phase 1: Core Infrastructure (High Impact)
1. `src/agent-worker/sandbox.ts` - All sandbox operations
2. `src/agent-worker/lib/regex-executor.ts` - Regex execution
3. `src/lib/cloudflare-env.ts` - Environment configuration

### Phase 2: Agent/Tool Layer
4. `src/agent-worker/agents/regex-agent/index.ts` - Agent core logic
5. `src/agent-worker/tools.ts` - Tool definitions

### Phase 3: Use Cases (Dramatic Improvement)
6. `src/use-cases/use-cases.ts` - Has 5 nested try-catch levels!

### Phase 4: API/HTTP Layer
7. `src/agent-worker/endpoints/regex-test.ts` - HTTP endpoint
8. `src/app/api/regex/test/route.ts` - Next.js API route

### Phase 5: Client Layer
9. `src/hooks/useRegexEditor.ts` - React hook with fetch
10. `src/components/RegexEditor.tsx` - Component fetch calls

---

## Example Transformation: Nested Try-Catch

This is the most dramatic improvement neverthrow provides:

```typescript
// Before: 5 levels of nested try-catch (use-cases.ts)
async function generateAndTest(input: GeneratorInput): Promise<GeneratorResult> {
  try {
    const sandbox = await createSandbox('typescript');
    try {
      const result = await executeInSandbox(sandbox, code);
      try {
        const parsed = JSON.parse(result);
        try {
          const validated = validateResult(parsed);
          return { success: true, data: validated };
        } catch (e) {
          return { success: false, error: 'Validation failed' };
        }
      } catch (e) {
        return { success: false, error: 'Parse failed' };
      }
    } catch (e) {
      return { success: false, error: 'Execution failed' };
    } finally {
      await deleteSandbox(sandbox);
    }
  } catch (e) {
    return { success: false, error: 'Sandbox creation failed' };
  }
}

// After: Flat andThen chain
function generateAndTest(input: GeneratorInput): ResultAsync<GeneratorResult, GeneratorError> {
  return createSandbox('typescript')
    .andThen((sandbox) =>
      executeInSandbox(sandbox, code)
        .andThen((result) => parseJson(result))
        .andThen((parsed) => validateResult(parsed))
        .andFinally(() => deleteSandbox(sandbox))  // Always cleanup
    )
    .map((validated) => ({ data: validated }));
}
```

---

## React Integration

For React hooks, use `.match()` to update state:

```typescript
// hooks/useRegexEditor.ts
const testRegex = async (pattern: string, input: string) => {
  setLoading(true);
  
  const result = await fetchRegexTest({ pattern, input });
  
  result.match(
    (data) => {
      setResults(data);
      setError(null);
    },
    (error) => {
      setResults(null);
      setError(error.message);
    }
  );
  
  setLoading(false);
};
```

---

## Additional Resources

- [neverthrow GitHub](https://github.com/supermacro/neverthrow)
- [neverthrow API docs](https://github.com/supermacro/neverthrow#api-documentation)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/) - The concept behind Result types
