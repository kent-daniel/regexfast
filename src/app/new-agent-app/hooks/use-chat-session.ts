"use client";

import { useState, useEffect, useCallback } from "react";
import { useAgent } from "agents/react";
import { isStaticToolUIPart } from "ai";
import { useAgentChat } from "agents/ai-react";
import type { UIMessage } from "@ai-sdk/react";
import {
  SUBAGENT_STATUS_DATA_PART_TYPE,
  type SubagentStatusEvent
} from "@/agent-worker/shared";
import type { MessageRowModel } from "@/components/chat/message-row";

type ChatState = {
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
};

export function useChatSession() {
  // Generate a unique session ID per browser tab
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const stored = sessionStorage.getItem("agent-session-id");
    console.log(process.env.NEXT_PUBLIC_WORKER_URL);
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
    // In production/preview, connect directly to the Worker URL
    // In development, Next.js rewrites /agents/* to the Worker
    host: process.env.NEXT_PUBLIC_WORKER_URL || undefined,
    onStateUpdate: (state) => {
      setAgentState(state as ChatState);
    }
  });

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

  // Local tracking of aborted tool calls
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

  // Cleanup completed tool call statuses
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

  // Check for pending tool confirmations
  const pendingToolCallConfirmation = agentMessages.some((m: UIMessage) =>
    m.parts?.some(
      (part) =>
        isStaticToolUIPart(part) &&
        part.state === "input-available" &&
        !abortedToolCallIds.has(part.toolCallId)
    )
  );

  // Derive active tool calls
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

  // Helper to check if message has renderable parts
  const messageHasRenderableParts = (m?: UIMessage) => {
    if (!m?.parts?.length) return false;
    return m.parts.some(
      (part) =>
        (part.type === "text" && (part.text ?? "").trim().length > 0) ||
        isStaticToolUIPart(part)
    );
  };

  // Compute message rows for rendering
  const computeRows = useCallback((): MessageRowModel[] => {
    const lastAssistantMessage = [...agentMessages]
      .reverse()
      .find((m) => m.role === "assistant");

    const showThinking =
      (status === "submitted" || status === "streaming") &&
      !messageHasRenderableParts(lastAssistantMessage);

    const rows: MessageRowModel[] = agentMessages.map((m, index) => {
      const showAvatar =
        index === 0 || agentMessages[index - 1]?.role !== m.role;

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

    return rows;
  }, [agentMessages, status]);

  const isStreaming = status === "submitted" || status === "streaming";

  return {
    // State
    agentState,
    agentMessages,
    subagentStatusByToolCallId,
    abortedToolCallIds,
    status,
    isStreaming,
    pendingToolCallConfirmation,
    activeToolCalls,

    // Actions
    sendMessage,
    handleStop,
    clearHistory,
    addToolResult,
    addToolApprovalResponse,

    // Computed
    computeRows
  };
}
