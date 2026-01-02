# Cloudflare Workers & Durable Objects Best Practices

Production patterns, error handling, and optimization strategies.

## Table of Contents

1. [Architecture Patterns](#architecture-patterns)
2. [Error Handling](#error-handling)
3. [Performance Optimization](#performance-optimization)
4. [Testing & Development](#testing--development)
5. [Security](#security)
6. [Monitoring & Debugging](#monitoring--debugging)

---

## Architecture Patterns

### Singleton Pattern

One Durable Object for global state or coordination.

```typescript
// Worker
const config = env.CONFIG_DO.getByName("global");
const settings = await config.getSettings();
```

### Per-Entity Pattern

One Durable Object per user, document, room, etc.

```typescript
// Per-user rate limiter
const rateLimiter = env.RATE_LIMITER.getByName(`user:${userId}`);
const allowed = await rateLimiter.checkLimit();

// Per-document editor
const doc = env.DOCUMENT.getByName(`doc:${documentId}`);
await doc.applyEdit(edit);
```

### Sharding Pattern

Distribute load across multiple Durable Objects.

```typescript
function getShardId(key: string, numShards: number): string {
  const hash = hashString(key);
  return `shard:${hash % numShards}`;
}

const shard = env.COUNTER.getByName(getShardId(userId, 16));
await shard.increment(userId);
```

### Aggregation Pattern

Child DOs report to parent DO for aggregation.

```typescript
// Child (per-user counter)
async recordEvent(type: string): Promise<void> {
  this.localCount++;
  
  // Periodically report to aggregator
  if (this.localCount % 100 === 0) {
    const aggregator = this.env.AGGREGATOR.getByName("global");
    await aggregator.addCounts({ [type]: 100 });
  }
}
```

### Worker Routing Pattern

Worker validates and routes to appropriate DO.

```typescript
// Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Authentication
    const user = await authenticate(request);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Route to appropriate DO
    if (url.pathname.startsWith("/room/")) {
      const roomId = url.pathname.split("/")[2];
      const room = env.CHAT_ROOM.getByName(roomId);
      return room.fetch(request);
    }
    
    if (url.pathname.startsWith("/user/")) {
      const userDO = env.USER.getByName(user.id);
      return userDO.fetch(request);
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
```

---

## Error Handling

### RPC Error Handling

```typescript
// Durable Object
async riskyOperation(): Promise<Result> {
  try {
    const data = await this.fetchExternalAPI();
    return { success: true, data };
  } catch (error) {
    // Log for debugging
    console.error("Operation failed:", error);
    
    // Return structured error (don't throw - loses stack trace)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Worker
const result = await stub.riskyOperation();
if (!result.success) {
  return new Response(JSON.stringify({ error: result.error }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

### Retry Pattern

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-transient errors
      if (error instanceof TypeError) throw error;
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
}

// Usage
const result = await withRetry(() => stub.unreliableMethod());
```

### Graceful Degradation

```typescript
async getData(): Promise<Data> {
  // Try primary storage
  try {
    const cached = await this.ctx.storage.get("data");
    if (cached) return cached;
  } catch (e) {
    console.error("Storage read failed:", e);
  }
  
  // Fallback to external source
  try {
    const fresh = await this.fetchFromAPI();
    await this.ctx.storage.put("data", fresh);
    return fresh;
  } catch (e) {
    console.error("API fetch failed:", e);
  }
  
  // Return stale data or default
  return this.getDefaultData();
}
```

### Input Validation

```typescript
import { z } from "zod";

const MessageSchema = z.object({
  type: z.enum(["message", "action", "ping"]),
  content: z.string().max(10000).optional(),
  timestamp: z.number().optional(),
});

async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
  let data;
  try {
    data = MessageSchema.parse(JSON.parse(message));
  } catch (e) {
    ws.send(JSON.stringify({ error: "Invalid message format" }));
    return;
  }
  
  // Process validated data
}
```

---

## Performance Optimization

### Minimize Constructor Work

```typescript
export class OptimizedDO extends DurableObject<Env> {
  private initialized = false;
  private cache: Map<string, any> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Minimal work here - only restore WebSocket state if needed
    this.restoreWebSocketState();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    // Heavy initialization on first method call
    const data = await this.ctx.storage.get("config");
    this.cache.set("config", data);
    this.initialized = true;
  }

  async handleRequest(): Promise<Response> {
    await this.ensureInitialized();
    // Process request
  }
}
```

### Batch Operations

```typescript
// Bad - multiple round trips
for (const key of keys) {
  await this.ctx.storage.put(key, values[key]);
}

// Good - single atomic write
await this.ctx.storage.put(
  Object.fromEntries(keys.map(k => [k, values[k]]))
);

// Best - synchronous SQL
this.ctx.storage.transactionSync(() => {
  for (const [key, value] of Object.entries(data)) {
    this.sql.exec("INSERT OR REPLACE INTO data (key, value) VALUES (?, ?)", 
      key, JSON.stringify(value));
  }
});
```

### Caching Strategies

```typescript
export class CachedDO extends DurableObject<Env> {
  private memCache = new Map<string, { value: any; expiry: number }>();

  async get(key: string): Promise<any> {
    // Check memory cache
    const cached = this.memCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    // Load from storage
    const value = await this.ctx.storage.get(key);
    if (value !== undefined) {
      this.memCache.set(key, { 
        value, 
        expiry: Date.now() + 60000 // 1 minute
      });
    }
    
    return value;
  }

  async set(key: string, value: any): Promise<void> {
    await this.ctx.storage.put(key, value);
    this.memCache.set(key, { 
      value, 
      expiry: Date.now() + 60000 
    });
  }
}
```

### Efficient Queries

```typescript
// Bad - load all, filter in JS
const all = await this.ctx.storage.list();
const filtered = [...all.entries()].filter(([k]) => k.startsWith("user:"));

// Good - use prefix
const users = await this.ctx.storage.list({ prefix: "user:" });

// Better - use SQL
const users = this.sql.exec(
  "SELECT * FROM users WHERE status = ? LIMIT 100", 
  "active"
).toArray();

// Best - use SQL with indexes
this.sql.exec("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)");
```

---

## Testing & Development

### Local Development

```bash
# Start local dev server
npx wrangler dev

# With specific options
npx wrangler dev --local --persist-to=./data

# Test specific routes
curl http://localhost:8787/api/counter
```

### Unit Testing with Miniflare

```typescript
import { Miniflare } from "miniflare";

describe("Counter DO", () => {
  let mf: Miniflare;
  
  beforeAll(async () => {
    mf = new Miniflare({
      modules: true,
      scriptPath: "./dist/index.js",
      durableObjects: {
        COUNTER: "Counter"
      }
    });
  });
  
  afterAll(() => mf.dispose());

  test("increments counter", async () => {
    const res = await mf.dispatchFetch("http://localhost/increment");
    const data = await res.json();
    expect(data.count).toBe(1);
  });
});
```

### Integration Testing

```typescript
// test/integration.test.ts
import { unstable_dev } from "wrangler";

describe("Worker Integration", () => {
  let worker: any;
  
  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {
      experimental: { disableExperimentalWarning: true }
    });
  });
  
  afterAll(() => worker.stop());

  test("WebSocket connection", async () => {
    const resp = await worker.fetch("/ws", {
      headers: { Upgrade: "websocket" }
    });
    expect(resp.status).toBe(101);
  });
});
```

---

## Security

### Authentication in Worker

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Validate auth before routing to DO
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const token = authHeader.slice(7);
    const user = await validateToken(token, env);
    if (!user) {
      return new Response("Invalid token", { status: 401 });
    }
    
    // Create authenticated request for DO
    const doRequest = new Request(request, {
      headers: new Headers(request.headers)
    });
    doRequest.headers.set("X-User-Id", user.id);
    
    return env.MY_DO.getByName("singleton").fetch(doRequest);
  }
};
```

### Rate Limiting

```typescript
export class RateLimiter extends DurableObject<Env> {
  async checkLimit(
    key: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing timestamps
    const timestamps: number[] = this.ctx.storage.kv.get(key) ?? [];
    const validTimestamps = timestamps.filter(t => t > windowStart);
    
    if (validTimestamps.length >= limit) {
      const oldestValid = Math.min(...validTimestamps);
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestValid + windowMs
      };
    }
    
    // Record this request
    validTimestamps.push(now);
    this.ctx.storage.kv.put(key, validTimestamps);
    
    return {
      allowed: true,
      remaining: limit - validTimestamps.length,
      resetAt: now + windowMs
    };
  }
}
```

### Input Sanitization

```typescript
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
  const data = JSON.parse(message);
  
  // Sanitize user content before broadcasting
  const sanitized = {
    ...data,
    content: sanitizeHtml(data.content ?? ""),
  };
  
  this.broadcast(sanitized);
}
```

---

## Monitoring & Debugging

### Logging

```typescript
export class LoggedDO extends DurableObject<Env> {
  private log(level: string, message: string, data?: object) {
    console.log(JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      objectId: this.ctx.id.toString(),
      ...data
    }));
  }

  async riskyOperation(): Promise<void> {
    this.log("info", "Starting operation");
    
    try {
      const result = await this.doWork();
      this.log("info", "Operation completed", { result });
    } catch (error) {
      this.log("error", "Operation failed", { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
```

### Tail Logs

```bash
# Stream logs from production
npx wrangler tail

# Filter by status
npx wrangler tail --status error

# Filter by search term  
npx wrangler tail --search "WebSocket"

# JSON output for processing
npx wrangler tail --format json
```

### Metrics Collection

```typescript
export class MetricsDO extends DurableObject<Env> {
  private metrics = {
    requests: 0,
    errors: 0,
    latencySum: 0,
  };

  async trackRequest<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.metrics.requests++;
    
    try {
      return await fn();
    } catch (error) {
      this.metrics.errors++;
      throw error;
    } finally {
      this.metrics.latencySum += Date.now() - start;
    }
  }

  async getMetrics(): Promise<typeof this.metrics & { avgLatency: number }> {
    return {
      ...this.metrics,
      avgLatency: this.metrics.requests > 0 
        ? this.metrics.latencySum / this.metrics.requests 
        : 0
    };
  }
}
```

### Health Checks

```typescript
// Worker health endpoint
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === "/health") {
      try {
        // Check DO availability
        const stub = env.HEALTH_CHECK.getByName("health");
        await stub.ping();
        
        return new Response(JSON.stringify({ 
          status: "healthy",
          timestamp: new Date().toISOString()
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          status: "unhealthy",
          error: String(error)
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    // ... rest of routing
  }
};
```
