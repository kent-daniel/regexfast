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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

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
        />

        <MessageList
          rows={rows}
          isEmpty={agentMessages.length === 0}
          showDebug={showDebug}
          addToolResult={addToolResult}
          addToolApprovalResponse={addToolApprovalResponse}
          abortedToolCallIds={abortedToolCallIds}
          subagentStatusByToolCallId={subagentStatusByToolCallId}
        />

        <ChatInput
          value={agentInput}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onStop={handleStop}
          isStreaming={isStreaming}
          isDisabled={pendingToolCallConfirmation}
          activeToolCalls={activeToolCalls}
        />
      </div>
    </div>
  );
}
