"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ChatAddToolApproveResponseFunction } from "ai";
import { MessageRow, type MessageRowModel } from "@/components/chat/message-row";
import type { SubagentStatusEvent } from "@/agent-logic/shared";
import { EmptyState } from "./empty-state";

type MessageListProps = {
  rows: MessageRowModel[];
  isEmpty: boolean;
  showDebug: boolean;
  addToolResult: (args: {
    tool: string;
    toolCallId: string;
    output: unknown;
  }) => void;
  addToolApprovalResponse?: ChatAddToolApproveResponseFunction;
  abortedToolCallIds: Set<string>;
  subagentStatusByToolCallId: Record<string, SubagentStatusEvent>;
};

export function MessageList({
  rows,
  isEmpty,
  showDebug,
  addToolResult,
  addToolApprovalResponse,
  abortedToolCallIds,
  subagentStatusByToolCallId
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom on mount and when rows change
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, rows.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-h-[calc(100vh-10rem)]">
      {isEmpty ? (
        <EmptyState />
      ) : (
        rows.map((row) => (
          <MessageRow
            key={row.key}
            model={row}
            showDebug={showDebug}
            addToolResult={addToolResult}
            addToolApprovalResponse={addToolApprovalResponse}
            abortedToolCallIds={abortedToolCallIds}
            subagentStatusByToolCallId={subagentStatusByToolCallId}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
