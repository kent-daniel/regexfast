# Durable Objects WebSocket API Reference

Complete reference for WebSocket handling in Durable Objects, including hibernation.

## Table of Contents

1. [WebSocket Hibernation API](#websocket-hibernation-api)
2. [Standard WebSocket API](#standard-websocket-api)
3. [State Management](#state-management)
4. [Common Patterns](#common-patterns)

---

## WebSocket Hibernation API

The Hibernation API allows Durable Objects to maintain WebSocket connections while minimizing costs. When idle, the DO hibernates but connections persist.

### Setup

```typescript
import { DurableObject } from "cloudflare:workers";

export class WebSocketServer extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    // Validate upgrade request
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept with hibernation support
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}
```

### Handler Methods

Define these methods on your Durable Object class:

#### `webSocketMessage(ws, message)`

Called when a message is received.

```typescript
async webSocketMessage(
  ws: WebSocket,
  message: string | ArrayBuffer
): Promise<void> {
  if (typeof message === "string") {
    const data = JSON.parse(message);
    // Handle text message
  } else {
    // Handle binary message (ArrayBuffer)
  }
}
```

#### `webSocketClose(ws, code, reason, wasClean)`

Called when connection closes.

```typescript
async webSocketClose(
  ws: WebSocket,
  code: number,
  reason: string,
  wasClean: boolean
): Promise<void> {
  console.log(`Connection closed: ${code} ${reason}`);
  // Clean up resources
}
```

#### `webSocketError(ws, error)`

Called on non-disconnection errors.

```typescript
async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
  console.error("WebSocket error:", error);
  ws.close(1011, "Internal error");
}
```

### DurableObjectState Methods

#### `acceptWebSocket(ws, tags?)`

Accept a WebSocket for hibernation.

```typescript
// Basic accept
this.ctx.acceptWebSocket(server);

// With tags for filtering
this.ctx.acceptWebSocket(server, ["room:123", "user:456"]);
```

#### `getWebSockets(tag?)`

Get all connected WebSockets.

```typescript
// All connections
const allSockets = this.ctx.getWebSockets();

// Filtered by tag
const roomSockets = this.ctx.getWebSockets("room:123");

// Broadcast to all
for (const ws of this.ctx.getWebSockets()) {
  ws.send(JSON.stringify({ type: "broadcast", data }));
}
```

#### `getTags(ws)`

Get tags attached to a WebSocket.

```typescript
const tags = this.ctx.getTags(ws);
// ["room:123", "user:456"]
```

#### `setWebSocketAutoResponse(request?, response?)`

Auto-respond to specific messages (e.g., ping/pong).

```typescript
this.ctx.setWebSocketAutoResponse(
  new WebSocketRequestResponsePair("ping", "pong")
);
```

### Attachment Methods

Persist data with a WebSocket across hibernation.

#### `serializeAttachment(value)`

```typescript
ws.serializeAttachment({
  username: "alice",
  joinedAt: Date.now(),
  roomId: "room-123"
});
// Max 2KB per attachment
```

#### `deserializeAttachment()`

```typescript
const attachment = ws.deserializeAttachment();
console.log(attachment.username); // "alice"
```

---

## Standard WebSocket API

For non-hibernating connections (higher cost, simpler model).

```typescript
export class WebSocketServer extends DurableObject<Env> {
  connections = new Set<WebSocket>();

  async fetch(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Standard accept (no hibernation)
    server.accept();
    this.connections.add(server);

    // Event listeners
    server.addEventListener("message", (event) => {
      this.handleMessage(server, event.data);
    });

    server.addEventListener("close", (event) => {
      this.connections.delete(server);
    });

    server.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      this.connections.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  handleMessage(ws: WebSocket, data: string | ArrayBuffer) {
    // Process message
  }

  broadcast(message: string) {
    for (const ws of this.connections) {
      ws.send(message);
    }
  }
}
```

---

## State Management

### Restoring State After Hibernation

The constructor runs when a DO wakes from hibernation. Restore state there:

```typescript
export class ChatRoom extends DurableObject<Env> {
  rooms: Map<string, Set<WebSocket>> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    
    // Restore room memberships from WebSocket attachments
    for (const ws of this.ctx.getWebSockets()) {
      const { roomId } = ws.deserializeAttachment() ?? {};
      if (roomId) {
        if (!this.rooms.has(roomId)) {
          this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)!.add(ws);
      }
    }
  }
}
```

### Using Tags for Organization

```typescript
// On connection
this.ctx.acceptWebSocket(server, [`room:${roomId}`, `user:${userId}`]);

// Broadcast to room
for (const ws of this.ctx.getWebSockets(`room:${roomId}`)) {
  ws.send(JSON.stringify(message));
}

// Send to specific user
for (const ws of this.ctx.getWebSockets(`user:${userId}`)) {
  ws.send(JSON.stringify(notification));
}
```

---

## Common Patterns

### Chat Room

```typescript
export class ChatRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const username = url.searchParams.get("username") ?? "anonymous";

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket required", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ username, joinedAt: Date.now() });

    // Notify others
    this.broadcast({ type: "join", username });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    const { username } = ws.deserializeAttachment() ?? {};
    const data = JSON.parse(message);

    this.broadcast({
      type: "message",
      from: username,
      content: data.content,
      timestamp: Date.now(),
    });
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const { username } = ws.deserializeAttachment() ?? {};
    this.broadcast({ type: "leave", username });
  }

  broadcast(message: object) {
    const json = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(json);
      } catch (e) {
        // Connection may be closing
      }
    }
  }
}
```

### Multiplayer Game State

```typescript
export class GameRoom extends DurableObject<Env> {
  gameState: GameState;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.gameState = this.loadGameState();
  }

  loadGameState(): GameState {
    // Load from storage or initialize
    const saved = this.ctx.storage.kv.get("gameState");
    return saved ?? { players: {}, round: 0 };
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    const { playerId } = ws.deserializeAttachment() ?? {};
    const action = JSON.parse(message);

    // Process game action
    const result = this.processAction(playerId, action);

    // Save state
    this.ctx.storage.kv.put("gameState", this.gameState);

    // Broadcast state update
    this.broadcast({
      type: "state_update",
      state: this.gameState,
      lastAction: { playerId, action, result },
    });
  }

  processAction(playerId: string, action: GameAction): ActionResult {
    // Game logic here
    return { success: true };
  }
}
```

### Presence System

```typescript
export class PresenceRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId")!;

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [`user:${userId}`]);
    server.serializeAttachment({ userId, status: "online" });

    // Send current presence list
    const presence = this.getPresenceList();
    server.send(JSON.stringify({ type: "presence_list", users: presence }));

    // Notify others of join
    this.broadcast({ type: "user_joined", userId });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    const data = JSON.parse(message);
    const attachment = ws.deserializeAttachment();

    if (data.type === "status_update") {
      attachment.status = data.status;
      ws.serializeAttachment(attachment);
      
      this.broadcast({
        type: "presence_update",
        userId: attachment.userId,
        status: data.status,
      });
    }
  }

  getPresenceList(): Array<{ userId: string; status: string }> {
    return this.ctx.getWebSockets().map(ws => {
      const { userId, status } = ws.deserializeAttachment() ?? {};
      return { userId, status };
    });
  }
}
```

---

## Best Practices

1. **Minimize constructor work** - Constructor runs on every wake-up
2. **Use tags for filtering** - More efficient than iterating all connections
3. **Handle send errors** - Connections may close during broadcast
4. **Limit attachment size** - Max 2KB per WebSocket
5. **Use storage for large state** - Don't rely only on attachments
6. **Validate upgrade requests** - Check headers before accepting
7. **Implement heartbeats** - For detecting stale connections

```typescript
// Heartbeat pattern
async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
  const data = JSON.parse(message);
  
  if (data.type === "ping") {
    ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
    return;
  }
  
  // Handle other messages
}
```
