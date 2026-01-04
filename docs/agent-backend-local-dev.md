# Agent Backend Local Development Guide

This guide covers setting up and running the AI agent backend locally.

## Prerequisites

1. **Node.js 18+**
2. **npm** or **pnpm**
3. **Cloudflare account** (for Wrangler authentication)

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and fill in your API keys:

```
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
SANDBOX_API_KEY=your_daytona_sandbox_key
```

**Where to get API keys:**
- **AI_GATEWAY_API_KEY**: [Vercel AI Gateway](https://vercel.com/docs/ai/ai-gateway)
- **SANDBOX_API_KEY**: [Daytona](https://daytona.io/) - for sandboxed code execution

### 3. Authenticate with Cloudflare

```bash
npx wrangler login
```

## Running Locally

### Option 1: Run Both Services Together

```bash
npm run dev:all
```

This starts:
- Next.js app on `http://localhost:3000`
- Worker backend on `http://localhost:8787`

The Next.js app automatically proxies `/agents/*` requests to the Worker.

### Option 2: Run Services Separately

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Worker:**
```bash
npm run dev:worker
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser (localhost:3000)                  │
│    /new-agent-app → Chat UI (agents/react useAgentChat)      │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  Next.js App (localhost:3000)                 │
│                                                               │
│  next.config.mjs rewrites:                                   │
│    /agents/* → http://localhost:8787/agents/*                │
│    /check-open-ai-key → http://localhost:8787/...            │
└─────────────────────────────┬────────────────────────────────┘
                              │ (HTTP/WebSocket proxy)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (localhost:8787)               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Durable Object: Chat                                    │ │
│  │   - AIChatAgent from agents library                     │ │
│  │   - Handles WebSocket connections                       │ │
│  │   - Manages session state                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                                │
│  ┌───────────────────────────┼───────────────────────────┐   │
│  │                    Tools                               │   │
│  │  generateMatchRegex │ generateCaptureRegex │ generateCode │
│  └───────────────────────────┼───────────────────────────┘   │
│                              │                                │
│  ┌───────────────────────────┼───────────────────────────┐   │
│  │               Sub-Agents (GENERATE → EXECUTE → REFLECT) │   │
│  │   • regex-agent: Pattern generation with sandbox tests  │   │
│  │   • code-agent: Free-form code with approval            │   │
│  └───────────────────────────┬───────────────────────────┘   │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   Daytona Sandbox (External)                  │
│  • Isolated code execution                                    │
│  • No network access                                          │
│  • Per-session sandbox reuse                                  │
└──────────────────────────────────────────────────────────────┘
```

## Available Tools

The agent has access to three tools:

1. **generateMatchRegex** - For validation patterns (match/no-match testing)
2. **generateCaptureRegex** - For extraction patterns (capture groups)
3. **generateCode** - For custom code when regex can't solve the problem (requires user approval)

## Subagent Status Events

The UI receives real-time status updates for subagent operations:

```typescript
type SubagentStatusEvent = {
  toolCallId: string;
  agent: string;
  phase: "generating" | "executing" | "evaluating";
  iteration?: number;
  maxIterations?: number;
  message?: string;
  at: string;
};
```

These are displayed in the `ToolInvocationCard` component.

## Troubleshooting

### "AI_GATEWAY_API_KEY is not set"

Make sure you've created `.dev.vars` with your API key:
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your actual key
```

### WebSocket Connection Issues

If the chat doesn't connect:
1. Ensure the Worker is running (`npm run dev:worker`)
2. Check browser DevTools Network tab for failed WebSocket connections
3. Verify the Next.js rewrites are working by checking `/check-open-ai-key`

### Sandbox Errors

If code execution fails:
1. Verify `SANDBOX_API_KEY` is set in `.dev.vars`
2. Check if you have a valid Daytona account and API key
3. Sandbox is optional - regex tools will still work without it

## Deployment

### Deploy Worker to Cloudflare

```bash
npm run deploy:worker
```

Before deploying, set secrets:

```bash
# Set secrets (do this once or when keys change)
wrangler secret put AI_GATEWAY_API_KEY
wrangler secret put SANDBOX_API_KEY
```

### Production Routing

In production, configure **Cloudflare Worker Routes** on your Pages domain to route `/agents/*` to the Worker service. This ensures WebSocket connections work correctly without needing a proxy.
