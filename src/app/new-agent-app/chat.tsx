"use client";
/** biome-ignore-all lint/correctness/useUniqueElementIds: it's alright */
import { useEffect, useState, useRef, useCallback } from "react";
import { useAgent } from "agents/react";
import { isStaticToolUIPart } from "ai";
import { useAgentChat } from "agents/ai-react";
import type { UIMessage } from "@ai-sdk/react";
import {
  SUBAGENT_STATUS_DATA_PART_TYPE,
  type SubagentStatusEvent
} from "@/agent-logic/shared";

// Component imports
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageRow,
  type MessageRowModel
} from "@/components/chat/message-row";

// Icon imports
import {
  BugIcon,
  TrashIcon,
  PaperPlaneTiltIcon,
  StopIcon,
  SparkleIcon
} from "@phosphor-icons/react";

type ChatState = {
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
};

export default function Chat() {
  const [showDebug, setShowDebug] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Force dark mode for chat
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Generate a unique session ID per browser tab, persisted in sessionStorage
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const stored = sessionStorage.getItem("agent-session-id");
    if (stored) {
      setSessionId(stored);
    } else {
      const newId = crypto.randomUUID();
      sessionStorage.setItem("agent-session-id", newId);
      setSessionId(newId);
    }
  }, []);

  const [agentState, setAgentState] = useState<ChatState | null>(null);

  const agent = useAgent({
    agent: "chat",
    name: sessionId || "default",
    onStateUpdate: (state) => {
      setAgentState(state as ChatState);
    }
  });

  const [agentInput, setAgentInput] = useState("");
  const handleAgentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAgentInput(e.target.value);
  };

  const handleAgentSubmit = async (
    e: React.FormEvent,
    extraData: Record<string, unknown> = {}
  ) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

    const message = agentInput;
    setAgentInput("");

    // Send message to agent
    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: message }]
      },
      {
        body: extraData
      }
    );
  };

  const [subagentStatusByToolCallId, setSubagentStatusByToolCallId] = useState<
    Record<string, SubagentStatusEvent>
  >({});

  const {
    messages: agentMessages,
    addToolResult,
    addToolApprovalResponse,
    clearHistory,
    status,
    sendMessage,
    stop
  } = useAgentChat<unknown, UIMessage<{ createdAt: string }>>({
    agent,
    onData: (dataPart) => {
      if (!dataPart || typeof dataPart !== "object") return;

      const dp = dataPart as { type?: string; data?: unknown };
      if (dp.type !== SUBAGENT_STATUS_DATA_PART_TYPE) return;

      const event = dp.data as SubagentStatusEvent | undefined;
      if (!event?.toolCallId) return;

      setSubagentStatusByToolCallId((prev) => ({
        ...prev,
        [event.toolCallId]: event
      }));
    }
  });

  // Local-only tracking of tool calls that were aborted via UI Stop.
  // Important: do NOT call addToolResult here, since that sends messages to the agent
  // and can trigger duplicate assistant turns.
  const [abortedToolCallIds, setAbortedToolCallIds] = useState<Set<string>>(
    () => new Set()
  );

  const handleStop = useCallback(() => {
    stop();

    const inProgressStates = new Set([
      "input-streaming",
      "input-available",
      "approval-requested"
    ]);

    const ids = new Set<string>();
    for (const message of agentMessages) {
      if (message.role !== "assistant" || !message.parts) continue;
      for (const part of message.parts) {
        if (!isStaticToolUIPart(part)) continue;
        if (!inProgressStates.has(part.state)) continue;
        ids.add(part.toolCallId);
      }
    }

    if (ids.size > 0) {
      setAbortedToolCallIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.add(id);
        return next;
      });
    }
  }, [agentMessages, stop]);

  // Scroll to bottom when messages change
  useEffect(() => {
    agentMessages.length > 0 && scrollToBottom();
  }, [agentMessages, scrollToBottom]);

  // Best-effort cleanup: once a tool call finishes, drop its transient status.
  useEffect(() => {
    const terminalStates = new Set([
      "output-available",
      "output-error",
      "output-denied"
    ]);

    const completedIds = new Set<string>();
    for (const message of agentMessages) {
      if (message.role !== "assistant" || !message.parts) continue;
      for (const part of message.parts) {
        if (!isStaticToolUIPart(part)) continue;
        if (!terminalStates.has(part.state)) continue;
        completedIds.add(part.toolCallId);
      }
    }

    if (completedIds.size === 0) return;

    setSubagentStatusByToolCallId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of completedIds) {
        if (id in next) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [agentMessages]);

  const pendingToolCallConfirmation = agentMessages.some((m: UIMessage) =>
    m.parts?.some(
      (part) =>
        isStaticToolUIPart(part) &&
        part.state === "input-available" &&
        !abortedToolCallIds.has(part.toolCallId)
    )
  );

  // Derive currently active tool calls from the streaming messages.
  // Kept for future UX decisions (currently only shown in debug UI).
  const activeToolCalls = (() => {
    const lastAssistantMessage = [...agentMessages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastAssistantMessage?.parts) return [];

    const inProgressStates = [
      "input-streaming",
      "input-available",
      "approval-requested"
    ];

    return lastAssistantMessage.parts
      .filter(
        (part) =>
          isStaticToolUIPart(part) &&
          inProgressStates.includes(part.state) &&
          !abortedToolCallIds.has(part.toolCallId)
      )
      .map((part) => part.type.replace("tool-", ""));
  })();

  // Row view-model (Option A): compute exactly what to render.
  const messageHasRenderableParts = (m?: UIMessage) => {
    if (!m?.parts?.length) return false;

    return m.parts.some(
      (part) =>
        (part.type === "text" && (part.text ?? "").trim().length > 0) ||
        isStaticToolUIPart(part)
    );
  };

  const lastAssistantMessage = [...agentMessages]
    .reverse()
    .find((m) => m.role === "assistant");

  const showThinking =
    (status === "submitted" || status === "streaming") &&
    !messageHasRenderableParts(lastAssistantMessage);

  const rows: MessageRowModel[] = agentMessages.map((m, index) => {
    const showAvatar = index === 0 || agentMessages[index - 1]?.role !== m.role;

    return {
      key: m.id,
      role: m.role as "user" | "assistant",
      showAvatar,
      message: m,
      showThinkingTail: false
    };
  });

  if (showThinking) {
    const last = agentMessages[agentMessages.length - 1];
    const lastIsAssistantPlaceholder =
      last?.role === "assistant" && !messageHasRenderableParts(last);

    if (lastIsAssistantPlaceholder && rows.length > 0) {
      rows[rows.length - 1] = {
        ...rows[rows.length - 1],
        showThinkingTail: true
      };
    } else {
      const showAvatar =
        agentMessages.length === 0 ||
        agentMessages[agentMessages.length - 1]?.role !== "assistant";

      rows.push({
        key: "thinking",
        role: "assistant",
        showAvatar,
        message: undefined,
        showThinkingTail: true
      });
    }
  }

  return (
    <div className="h-screen w-full flex justify-center items-center bg-white dark:bg-neutral-950 overflow-hidden">
      <HasOpenAIKey />
      <div className="h-screen w-full mx-auto max-w-2xl flex flex-col overflow-hidden relative">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10 bg-white dark:bg-neutral-950">
          <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <SparkleIcon size={18} className="text-white" weight="fill" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">Copilot</h2>
              {agentState?.tokenUsage?.totalTokens !== undefined && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {agentState.tokenUsage.totalTokens} tokens
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md h-8 w-8"
              onClick={() => setShowDebug((prev) => !prev)}
              title="Toggle debug mode"
            >
              <BugIcon size={18} className={showDebug ? "text-purple-500" : ""} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-md h-8 w-8"
              onClick={clearHistory}
              title="Clear chat"
            >
              <TrashIcon size={18} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-h-[calc(100vh-10rem)]">
          {agentMessages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-sm mx-auto px-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 inline-flex">
                  <SparkleIcon size={32} className="text-white" weight="fill" />
                </div>
                <h3 className="font-semibold text-xl">How can I help you today?</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  I can help with code, answer questions, and assist with various tasks.
                </p>
              </div>
            </div>
          )}
          {rows.map((row) => (
            <MessageRow
              key={row.key}
              model={row}
              showDebug={showDebug}
              addToolResult={addToolResult}
              addToolApprovalResponse={addToolApprovalResponse}
                abortedToolCallIds={abortedToolCallIds}
              subagentStatusByToolCallId={subagentStatusByToolCallId}
            />
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAgentSubmit(e, {
              annotations: {
                hello: "world"
              }
            });
            setTextareaHeight("auto"); // Reset height after submission
          }}
          className="p-4 bg-white absolute bottom-0 left-0 right-0 z-10 dark:bg-neutral-950"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Textarea
                disabled={pendingToolCallConfirmation}
                placeholder={
                  pendingToolCallConfirmation
                    ? "Please respond to the tool confirmation above..."
                    : "Send a message..."
                }
                className="flex w-full border border-neutral-200 dark:border-neutral-700 px-3 py-2  ring-offset-background placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl text-base! pb-10 dark:bg-neutral-900"
                value={agentInput}
                onChange={(e) => {
                  handleAgentInputChange(e);
                  // Auto-resize the textarea
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  setTextareaHeight(`${e.target.scrollHeight}px`);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    handleAgentSubmit(e as unknown as React.FormEvent);
                    setTextareaHeight("auto"); // Reset height on Enter submission
                  }
                }}
                rows={2}
                style={{ height: textareaHeight }}
              />
              <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                {status === "submitted" || status === "streaming" ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                    aria-label={
                      activeToolCalls.length > 0
                        ? `Stop generation (tools: ${activeToolCalls.join(", ")})`
                        : "Stop generation"
                    }
                  >
                    <StopIcon size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                    disabled={pendingToolCallConfirmation || !agentInput.trim()}
                    aria-label="Send message"
                  >
                    <PaperPlaneTiltIcon size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function HasOpenAIKey() {
  const [hasOpenAiKey, setHasOpenAiKey] = useState<{ success: boolean } | null>(null);

  useEffect(() => {
    fetch("/check-open-ai-key")
      .then((res) => res.json())
      .then((data) => setHasOpenAiKey(data as { success: boolean }))
      .catch(() => setHasOpenAiKey({ success: true })); // Default to success on error
  }, []);

  if (!hasOpenAiKey || hasOpenAiKey.success) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-red-200 dark:border-red-900 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-labelledby="warningIcon"
              >
                <title id="warningIcon">Warning Icon</title>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                OpenAI API Key Not Configured
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-1">
                Requests to the API, including from the frontend UI, will not
                work until an OpenAI API key is configured.
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Please configure an OpenAI API key by setting a{" "}
                <a
                  href="https://developers.cloudflare.com/workers/configuration/secrets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400"
                >
                  secret
                </a>{" "}
                named{" "}
                <code className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400 font-mono text-sm">
                  OPENAI_API_KEY
                </code>
                . <br />
                You can also use a different model provider by following these{" "}
                <a
                  href="https://github.com/cloudflare/agents-starter?tab=readme-ov-file#use-a-different-ai-model-provider"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400"
                >
                  instructions.
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
