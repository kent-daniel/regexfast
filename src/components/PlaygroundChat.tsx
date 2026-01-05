"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useChatSession } from "@/app/new-agent-app/hooks/use-chat-session";
import {
  ChatHeader,
  ChatInput,
  MessageList,
  OpenAIKeyWarning
} from "@/app/new-agent-app/components";

/**
 * Embeddable version of the Chat component for the playground section.
 * Adapted from the full-page Chat to fit within the left panel layout.
 */
export function PlaygroundChat() {
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
    <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden relative">
      <OpenAIKeyWarning />
      
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
  );
}
