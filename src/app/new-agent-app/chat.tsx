"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

// Hooks
import { useChatSession } from "./hooks/use-chat-session";

// Components
import {
  ChatHeader,
  ChatInput,
  MessageList,
  OpenAIKeyWarning
} from "./components";

import { TOKEN_LIMIT } from "@/agent-worker/shared";

export default function Chat() {
  const [showDebug, setShowDebug] = useState(false);
  const [agentInput, setAgentInput] = useState("");

  const {
    agentState,
    agentMessages,
    subagentStatusByToolCallId,
    abortedToolCallIds,
    isStreaming,
    pendingToolCallConfirmation,
    activeToolCalls,
    sendMessage,
    handleStop,
    clearHistory,
    addToolResult,
    addToolApprovalResponse,
    computeRows
  } = useChatSession();

  // Check if token limit is reached
  const totalTokens = agentState?.tokenUsage?.totalTokens ?? 0;
  const isLimitReached = totalTokens >= TOKEN_LIMIT;

  // Force dark mode for chat
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setAgentInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setAgentInput(suggestion);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim() || isLimitReached) return;

    const message = agentInput;
    setAgentInput("");

    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: message }]
      },
      {
        body: {
          annotations: {
            hello: "world"
          }
        }
      }
    );
  };

  const rows = computeRows();

  return (
    <div className="h-screen w-full flex justify-center items-center bg-white dark:bg-neutral-950 overflow-hidden">
      <OpenAIKeyWarning />
      <div className="h-screen w-full mx-auto max-w-2xl flex flex-col overflow-hidden relative">
        <ChatHeader
          totalTokens={agentState?.tokenUsage?.totalTokens}
          showDebug={showDebug}
          onToggleDebug={() => setShowDebug((prev) => !prev)}
          onClearHistory={clearHistory}
          isStreaming={isStreaming}
        />

        <MessageList
          rows={rows}
          isEmpty={agentMessages.length === 0}
          showDebug={showDebug}
          addToolResult={addToolResult}
          addToolApprovalResponse={addToolApprovalResponse}
          abortedToolCallIds={abortedToolCallIds}
          subagentStatusByToolCallId={subagentStatusByToolCallId}
          onSuggestionClick={handleSuggestionClick}
        />

        <ChatInput
          value={agentInput}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onStop={handleStop}
          isStreaming={isStreaming}
          isDisabled={pendingToolCallConfirmation || isLimitReached}
          isLimitReached={isLimitReached}
          activeToolCalls={activeToolCalls}
        />
      </div>
    </div>
  );
}
