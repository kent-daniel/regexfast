"use client";

import { useRef, useEffect } from "react";
import type { ChatAddToolApproveResponseFunction } from "ai";
import { MessageRow, type MessageRowModel } from "@/components/chat/message-row";
import type { SubagentStatusEvent } from "@/agent-worker/shared";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom - contained within the container only
  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  // Scroll when rows change (new messages or streaming content)
  useEffect(() => {
    scrollToBottom();
  }, [rows]);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto px-5 py-6 space-y-5 min-h-0 overscroll-contain"
    >
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
    </div>
  );
}
