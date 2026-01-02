# Durable Objects Storage API Reference

Complete reference for SQLite and Key-Value storage APIs in Durable Objects.

## Table of Contents

1. [SQL API](#sql-api)
2. [Synchronous KV API](#synchronous-kv-api)
3. [Asynchronous KV API](#asynchronous-kv-api)
4. [Transactions](#transactions)
5. [Alarms](#alarms)
6. [Point-in-Time Recovery](#point-in-time-recovery)

---

## SQL API

Access via `ctx.storage.sql` (SQLite-backed Durable Objects only).

### `exec(query, ...bindings)`

Execute SQL queries with optional parameter bindings.

```typescript
// Create table
this.sql.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    data TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);

// Insert with bindings
this.sql.exec("INSERT INTO items (id, data) VALUES (?, ?)", "id-1", "value");

// Select and iterate
const cursor = this.sql.exec("SELECT * FROM items WHERE id = ?", "id-1");
for (const row of cursor) {
  console.log(row.id, row.data);
}
```

### Cursor Methods

```typescript
const cursor = this.sql.exec("SELECT * FROM items");

// Get all results as array
const all = cursor.toArray();

// Get exactly one row (throws if 0 or >1 rows)
const single = cursor.one();

// Iterate manually
let result = cursor.next();
while (!result.done) {
  console.log(result.value);
  result = cursor.next();
}

// Raw array format (no column names)
const rawCursor = cursor.raw();
for (const row of rawCursor) {
  console.log(row); // [value1, value2, ...]
}

// Cursor properties
console.log(cursor.columnNames); // ["id", "data", "created_at"]
console.log(cursor.rowsRead);    // Number of rows read
console.log(cursor.rowsWritten); // Number of rows written
```

### `databaseSize`

```typescript
const sizeBytes = ctx.storage.sql.databaseSize;
```

### Supported SQLite Extensions

- **FTS5**: Full-text search
- **JSON functions**: `json()`, `json_extract()`, etc.
- **Math functions**: `sqrt()`, `log()`, etc.

---

## Synchronous KV API

Access via `ctx.storage.kv` (SQLite-backed Durable Objects only).

### `get(key)`

```typescript
const value = this.ctx.storage.kv.get("myKey");
// Returns the stored value or undefined
```

### `put(key, value)`

```typescript
this.ctx.storage.kv.put("myKey", { any: "structured data" });
// Value can be any structured-clone-compatible type
```

### `delete(key)`

```typescript
const existed = this.ctx.storage.kv.delete("myKey");
// Returns true if key existed, false otherwise
```

### `list(options?)`

```typescript
// List all keys
for (const [key, value] of this.ctx.storage.kv.list()) {
  console.log(key, value);
}

// With options
const items = this.ctx.storage.kv.list({
  prefix: "user:",
  start: "user:100",
  end: "user:200",
  limit: 50,
  reverse: true
});
```

**Options:**
- `prefix`: Filter keys by prefix
- `start`: Start key (inclusive)
- `startAfter`: Start after key (exclusive)
- `end`: End key (exclusive)
- `limit`: Maximum results
- `reverse`: Descending order

---

## Asynchronous KV API

Works with both SQLite and KV-backed Durable Objects.

### `get(key, options?)`

```typescript
const value = await this.ctx.storage.get("myKey");

// Multiple keys
const map = await this.ctx.storage.get(["key1", "key2", "key3"]);
// Returns Map<string, any>
```

**Options:**
- `allowConcurrency`: Allow concurrent I/O events
- `noCache`: Don't cache the value

### `put(key, value, options?)`

```typescript
await this.ctx.storage.put("myKey", value);

// Multiple keys
await this.ctx.storage.put({
  key1: value1,
  key2: value2
});
```

**Options:**
- `allowUnconfirmed`: Don't wait for disk confirmation
- `noCache`: Don't cache the value

### `delete(key, options?)`

```typescript
const existed = await this.ctx.storage.delete("myKey");

// Multiple keys
const count = await this.ctx.storage.delete(["key1", "key2"]);
```

### `list(options?)`

```typescript
const map = await this.ctx.storage.list({
  prefix: "session:",
  limit: 100
});

for (const [key, value] of map) {
  console.log(key, value);
}
```

### `deleteAll(options?)`

```typescript
await this.ctx.storage.deleteAll();
// Removes all data from the Durable Object
```

### `sync()`

```typescript
await this.ctx.storage.sync();
// Wait for all pending writes to be confirmed
```

---

## Transactions

### Synchronous Transactions (SQL)

```typescript
this.ctx.storage.transactionSync(() => {
  const balance = this.sql.exec(
    "SELECT balance FROM accounts WHERE id = ?", fromId
  ).one().balance;
  
  if (balance < amount) {
    throw new Error("Insufficient funds");
  }
  
  this.sql.exec(
    "UPDATE accounts SET balance = balance - ? WHERE id = ?",
    amount, fromId
  );
  this.sql.exec(
    "UPDATE accounts SET balance = balance + ? WHERE id = ?",
    amount, toId
  );
});
// Automatically rolled back on exception
```

### Asynchronous Transactions (KV)

```typescript
await this.ctx.storage.transaction(async (txn) => {
  const balance = await txn.get("balance") ?? 0;
  
  if (balance < amount) {
    txn.rollback();
    return;
  }
  
  await txn.put("balance", balance - amount);
});
```

### Automatic Write Coalescing

Multiple writes without `await` are automatically batched:

```typescript
// These are atomic - all or nothing
this.ctx.storage.put("key1", value1);
this.ctx.storage.put("key2", value2);
this.ctx.storage.put("key3", value3);
// No await needed for atomicity
```

---

## Alarms

### `setAlarm(scheduledTime, options?)`

```typescript
// Schedule alarm
await this.ctx.storage.setAlarm(Date.now() + 60000); // 1 minute

// With Date object
await this.ctx.storage.setAlarm(new Date("2025-01-01T00:00:00Z"));
```

### `getAlarm(options?)`

```typescript
const alarmTime = await this.ctx.storage.getAlarm();
// Returns milliseconds since epoch, or null if no alarm set
```

### `deleteAlarm(options?)`

```typescript
await this.ctx.storage.deleteAlarm();
```

### `alarm()` Handler

```typescript
async alarm(alarmInfo?: { retryCount: number; isRetry: boolean }): Promise<void> {
  if (alarmInfo?.isRetry) {
    console.log(`Retry attempt ${alarmInfo.retryCount}`);
  }
  
  // Process scheduled work
  await this.processScheduledTask();
  
  // Optionally reschedule
  await this.ctx.storage.setAlarm(Date.now() + 3600000);
}
```

**Alarm Behavior:**
- At-least-once execution guarantee
- Retried with exponential backoff (starting at 2s, up to 6 retries)
- Only one alarm per Durable Object at a time

---

## Point-in-Time Recovery

SQLite-backed Durable Objects only. Restore to any point in the last 30 days.

### `getCurrentBookmark()`

```typescript
const bookmark = await this.ctx.storage.getCurrentBookmark();
// Returns alphanumeric string representing current point in time
```

### `getBookmarkForTime(timestamp)`

```typescript
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
const bookmark = await this.ctx.storage.getBookmarkForTime(twoDaysAgo);
```

### `onNextSessionRestoreBookmark(bookmark)`

```typescript
// Restore to bookmark on next restart
const undoBookmark = await this.ctx.storage.onNextSessionRestoreBookmark(bookmark);

// Restart the Durable Object to apply
this.ctx.abort();

// Save undoBookmark to revert the recovery if needed
```

---

## Limits

### SQLite-backed Durable Objects

| Resource | Limit |
|----------|-------|
| Database size | 1 GB |
| Max key size (KV) | 2,048 bytes |
| Max value size (KV) | 128 KB |
| Max SQL query size | 1 MB |
| Max bindings per query | 100 |
| Max concurrent connections | 1 |

### Key-Value-backed Durable Objects

| Resource | Limit |
|----------|-------|
| Max keys | Unlimited |
| Max key size | 2,048 bytes |
| Max value size | 128 KB |
| Max keys per get/put | 128 |
