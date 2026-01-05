import { routeAgentRequest, type Schedule, type Connection, type ConnectionContext } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { createGateway, type GatewayProvider } from "@ai-sdk/gateway";
import { processToolCalls, cleanupMessages } from "./utils";
import { createExecutions, createTools } from "./tools";
import { SUBAGENT_STATUS_DATA_PART_TYPE, TOKEN_LIMIT } from "./shared";
// import { env } from "cloudflare:workers";

// Use the global Cloudflare.Env from env.d.ts
// The wrangler types generator adds AI_GATEWAY_API_KEY, Chat DO binding, etc.

type TokenUsageTotals = {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
};

type ChatState = {
  tokenUsage: TokenUsageTotals;
  lastUsage?: Partial<TokenUsageTotals> & {
    at: string;
    model?: string;
  };
};

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeTokenUsage(usage: unknown): Partial<TokenUsageTotals> {
  if (!usage || typeof usage !== "object") return {};
  const u = usage as Record<string, unknown>;

  // AI SDK v6 commonly uses camelCase, but keep a small fallback for snake_case.
  const totalTokens = asFiniteNumber(u.totalTokens ?? u.total_tokens);
  const promptTokens = asFiniteNumber(u.promptTokens ?? u.prompt_tokens);
  const completionTokens = asFiniteNumber(u.completionTokens ?? u.completion_tokens);

  const normalized: Partial<TokenUsageTotals> = {};
  if (totalTokens !== undefined) normalized.totalTokens = totalTokens;
  if (promptTokens !== undefined) normalized.promptTokens = promptTokens;
  if (completionTokens !== undefined) normalized.completionTokens = completionTokens;
  return normalized;
}

// Session cleanup timeout constants
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour of inactivity
const DISCONNECT_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes after disconnect

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env, ChatState> {
  initialState: ChatState = {
    tokenUsage: {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0
    }
  };

  /**
   * Sandbox ID for reusing sandbox across code executions
   * Stored in the Durable Object instance for session-level persistence
   */
  sandboxId?: string;

  /**
   * Sandbox language for tracking which language the current sandbox is running
   */
  sandboxLanguage?: "typescript" | "javascript" | "python";

  /**
   * Gateway provider for AI calls - uses env.AI_GATEWAY_API_KEY
   */
  private _gateway?: GatewayProvider;

  /**
   * Abort signal for the currently running chat turn (best-effort).
   * Tools/subagents can consult this to stop long-running work.
   */
  currentAbortSignal?: AbortSignal;

  /**
   * Get or create the gateway provider
   */
  get gateway(): GatewayProvider {
    if (!this._gateway) {
      this._gateway = createGateway({
        apiKey: this.env.AI_GATEWAY_API_KEY
      });
    }
    return this._gateway;
  }

  /**
   * Current cleanup schedule ID (if any)
   */
  private cleanupScheduleId?: string;

  /**
   * Schedule cleanup alarm with the specified timeout
   */
  private async scheduleCleanup(timeoutMs: number) {
    // Cancel any existing cleanup schedule
    await this.cancelCleanup();
    
    // Schedule new cleanup using delay in seconds
    const delaySeconds = Math.floor(timeoutMs / 1000);
    const schedule = await this.schedule(delaySeconds, "executeCleanup", {});
    this.cleanupScheduleId = schedule.id;
    console.log(`[Session Cleanup] Scheduled in ${delaySeconds}s (id: ${schedule.id})`);
  }

  /**
   * Cancel any pending cleanup
   */
  private async cancelCleanup() {
    if (this.cleanupScheduleId) {
      const cancelled = await this.cancelSchedule(this.cleanupScheduleId);
      if (cancelled) {
        console.log(`[Session Cleanup] Cancelled (id: ${this.cleanupScheduleId})`);
      }
      this.cleanupScheduleId = undefined;
    }
  }

  /**
   * Cleanup callback - executed when scheduled cleanup fires
   * Deletes all session data if no active connections
   */
  async executeCleanup(_payload: Record<string, unknown>, _task: Schedule<Record<string, unknown>>) {
    // Clear the schedule ID since it's now executing
    this.cleanupScheduleId = undefined;
    
    // Double-check no active connections before cleanup
    const connections = [...this.getConnections()];
    if (connections.length > 0) {
      console.log(`[Session Cleanup] Skipped - ${connections.length} active connection(s)`);
      // Reschedule for inactivity timeout
      await this.scheduleCleanup(INACTIVITY_TIMEOUT_MS);
      return;
    }

    console.log("[Session Cleanup] Executing - deleting all session data");
    
    // Use the built-in destroy method which cleans up all agent state
    await this.destroy();
  }

  /**
   * Called when a client connects
   */
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    await super.onConnect(connection, ctx);
    
    // Cancel any pending cleanup since user is back
    await this.cancelCleanup();
    
    // Schedule inactivity cleanup (1 hour)
    await this.scheduleCleanup(INACTIVITY_TIMEOUT_MS);
  }

  /**
   * Called when a client disconnects
   */
  async onClose(connection: Connection, code: number, reason: string, wasClean: boolean) {
    await super.onClose(connection, code, reason, wasClean);
    
    // Check if any connections remain (excluding the one that just closed)
    const remainingConnections = [...this.getConnections()];
    
    if (remainingConnections.length === 0) {
      // No connections left - schedule cleanup with grace period (5 min)
      console.log("[Session Cleanup] All connections closed, starting grace period");
      await this.scheduleCleanup(DISCONNECT_GRACE_PERIOD_MS);
    }
  }

  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    // Check if token limit is reached before processing
    const currentTokens = (this.state as ChatState | undefined)?.tokenUsage?.totalTokens ?? 0;
    if (currentTokens >= TOKEN_LIMIT) {
      // Return a stream with an error message
      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          writer.write({
            type: "text-delta",
            id: "token-limit-error",
            delta: `⚠️ **Token limit reached**\n\nYou've used ${currentTokens.toLocaleString()} of ${TOKEN_LIMIT.toLocaleString()} tokens. Please clear the chat to start a new session.`
          });
        }
      });
      return createUIMessageStreamResponse({ stream });
    }

    // Make abort signal available to tool/subagent executions.
    const requestAbortSignal = options?.abortSignal;
    this.currentAbortSignal = requestAbortSignal;

    // Reset inactivity timer on each message (user is active)
    await this.scheduleCleanup(INACTIVITY_TIMEOUT_MS);

    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Get the model from our gateway - using fast/cheap model
    const model = this.gateway("google/gemini-2.5-flash-lite-preview-09-2025");

    const onFinishWithTokenAccounting = ((result: unknown) => {
      const r = result as Record<string, unknown>;
      const normalized = normalizeTokenUsage(r.totalUsage ?? r.usage);
      if (Object.keys(normalized).length > 0) {
        const prev = (this.state as ChatState | undefined)?.tokenUsage ?? this.initialState.tokenUsage;

        const next: TokenUsageTotals = {
          totalTokens: prev.totalTokens + (normalized.totalTokens ?? 0),
          promptTokens: prev.promptTokens + (normalized.promptTokens ?? 0),
          completionTokens: prev.completionTokens + (normalized.completionTokens ?? 0)
        };

        this.setState({
          ...(this.state as ChatState | undefined),
          tokenUsage: next,
          lastUsage: {
            ...normalized,
            at: new Date().toISOString(),
            model: typeof r.modelId === "string" ? (r.modelId as string) : undefined
          }
        } satisfies ChatState);
      }

      // Clear the abort signal for this request (best-effort).
      if (this.currentAbortSignal === requestAbortSignal) {
        this.currentAbortSignal = undefined;
      }

      return (onFinish as unknown as (arg0: unknown) => unknown)(result);
    }) as unknown as StreamTextOnFinishCallback<ToolSet>;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const emitSubagentStatus = (event: {
          toolCallId: string;
          agent: string;
          phase: "generating" | "executing" | "evaluating";
          iteration?: number;
          maxIterations?: number;
          message?: string;
          at: string;
        }) => {
          writer.write({
            type: SUBAGENT_STATUS_DATA_PART_TYPE,
            id: event.toolCallId,
            data: event,
            transient: true
          });
        };

        // Collect all tools (add MCP tools here after connecting: ...this.mcp.getAITools())
        const allTools = {
          ...createTools(this.gateway, { emitSubagentStatus }),
        };

        const executions = createExecutions(this.gateway, this);

        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);
        console.log("Cleaned Messages:", cleanedMessages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions,
          abortSignal: options?.abortSignal
        });

        const result = streamText({
          system: `You are a helpful coding assistant specializing in regex patterns and code generation.

## Your Tools

You have three tools available:
1. **generateMatchRegex** - Create regex patterns for VALIDATION (match/no-match testing)
2. **generateCaptureRegex** - Create regex patterns for EXTRACTION (capture groups)
3. **generateCode** - Generate custom JavaScript/Python code when regex cannot solve the problem

## Tool Selection Strategy

**IMPORTANT: Always try regex tools first!**

Use regex tools (generateMatchRegex, generateCaptureRegex) when the task involves:
- Pattern matching or validation
- Simple text extraction with capture groups
- Standard format validation (emails, URLs, phone numbers, etc.)

Use generateCode ONLY when:
- Regex clearly cannot solve the problem (complex transformations, conditional logic)
- The regex tools have failed after multiple attempts
- The task requires multi-step processing or calculations
- Data format conversion is needed (e.g., CSV to JSON)

## Workflow

When a user asks for a regex:
1. Understand what they need (validation vs extraction)
2. Gather the required examples from them
3. Let them know you're proceeding to build and test
4. Use the appropriate regex tool first
5. If regex fails or is insufficient, explain why and offer to use code generation (requires their approval)

## Two Types of Regex Tasks

### Validation (Match/No-Match)
For checking if strings are valid or invalid (e.g., "validate emails", "check if URL is valid").

**Required from user:**
- Examples that SHOULD match (valid cases)
- Examples that should NOT match (invalid cases)

### Extraction (Capture Groups)
For pulling specific parts out of strings (e.g., "extract area code", "get domain from email").

**Required from user:**
- Input strings to test
- What parts should be extracted from each input

## Runtime Environment
Infer from context which language they're using:
- Python hints: "Python script", "Jupyter", "pandas" → use Python syntax
- JavaScript hints: "Node.js", "React", "TypeScript", "browser" → use JavaScript syntax
- Default to JavaScript if not specified

## Code Generation Notes

When using generateCode:
- The user must approve before code runs (it's sandboxed with no network access)
- Generated code defines a \`processInput()\` function that takes a string and returns the result
- Provide clear test cases with expected outputs
- Explain what the code will do before requesting approval

## Interaction Guidelines

1. **Ask for missing requirements** - Request test cases if not provided
2. **Confirm before building** - Say "I'll now build and test your regex..." before starting
3. **Never expose internal details** - Don't mention tool names to the user
4. **Show results clearly** - Present the final solution with a clear explanation

## Cancellation / Abort

- If the user cancels/aborts {abort: true}, treat it as **aborted by user**.
- If any tool result contains aborted=true or an error like "aborted by user":
  - Acknowledge: "Aborted by user."
  - Stop the current attempt and ask what they want to do next.
  - Do NOT claim it was aborted due to complexity.
  - Do NOT immediately retry the same tool call.

Call a regex tool at most once per user request; if it fails, ask for better examples/requirements instead of calling it again unchanged.
`,

          messages: await convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinishWithTokenAccounting as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10),
          abortSignal: options?.abortSignal
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/check-open-ai-key") {
      const hasGatewayKey = !!env.AI_GATEWAY_API_KEY;
      return Response.json({
        success: hasGatewayKey
      });
    }
    if (!env.AI_GATEWAY_API_KEY) {
      console.error(
        "AI_GATEWAY_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      // Route the request to our agent or return 404 if not found
      // Enable CORS for cross-origin WebSocket connections (Pages → Worker)
      (await routeAgentRequest(request, env, { cors: true })) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
