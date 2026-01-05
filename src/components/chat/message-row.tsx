import { isStaticToolUIPart, type ChatAddToolApproveResponseFunction } from "ai";
import type { UIMessage } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";

import { MemoizedMarkdown } from "@/components/chat/memoized-markdown";
import { ToolInvocationCard } from "@/components/chat/tool-invocation-card";
import type { SubagentStatusEvent } from "@/agent-worker/shared";

import { SparkleIcon } from "@phosphor-icons/react";

export type MessageRowModel = {
  key: string;
  role: "user" | "assistant";
  showAvatar: boolean;
  message?: UIMessage;
  showThinkingTail: boolean;
};

type Props = {
  model: MessageRowModel;
  showDebug: boolean;
  addToolResult: (args: {
    tool: string;
    toolCallId: string;
    output: unknown;
  }) => void;
  addToolApprovalResponse?: ChatAddToolApproveResponseFunction;
  abortedToolCallIds?: Set<string>;
  subagentStatusByToolCallId?: Record<string, SubagentStatusEvent>;
};

export function MessageRow({
  model,
  showDebug,
  addToolResult,
  addToolApprovalResponse,
  abortedToolCallIds,
  subagentStatusByToolCallId
}: Props) {
  const isUser = model.role === "user";

  return (
    <div className="animate-[message-enter_0.2s_ease-out]">
      {showDebug && model.message && (
        <pre className="text-[11px] text-slate-500 overflow-scroll bg-[#1C232D] p-2 rounded-lg mb-2 border border-white/5">
          {JSON.stringify(model.message, null, 2)}
        </pre>
      )}

      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex gap-3 max-w-[88%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Copilot sparkle avatar for assistant only - clean Copilot style */}
          {!isUser && model.showAvatar ? (
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-sm shadow-blue-500/20">
                <SparkleIcon size={12} className="text-white" weight="fill" />
              </div>
            </div>
          ) : !isUser ? (
            <div className="w-6" />
          ) : null}

          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              {model.message?.parts?.map((part, i) => {
                if (part.type === "text") {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: immutable index
                    <div
                      key={i}
                      className={`text-sm leading-relaxed ${
                        isUser
                          ? "bg-zinc-800 text-slate-50 rounded-xl rounded-br-sm px-4 py-3"
                          : "text-slate-50"
                      }`}
                    >
                      {part.text.startsWith("scheduled message") && (
                        <span className="text-xs text-blue-400 mb-1 block font-medium">
                          🕒 Scheduled
                        </span>
                      )}
                      <MemoizedMarkdown
                        id={`${model.key}-${i}`}
                        content={part.text.replace(/^scheduled message: /, "")}
                      />
                    </div>
                  );
                }

                if (isStaticToolUIPart(part) && model.role === "assistant") {
                  const toolCallId = part.toolCallId;
                  const toolName = part.type.replace("tool-", "");

                  const subagentPhase = subagentStatusByToolCallId?.[toolCallId]?.phase;

                  const isAborted = Boolean(abortedToolCallIds?.has(toolCallId));
                  const isInProgress =
                    part.state === "input-streaming" ||
                    part.state === "input-available" ||
                    part.state === "approval-requested";

                  const toolUIPart: ToolUIPart =
                    isAborted && isInProgress
                      ? ({
                          ...part,
                          state: "output-available",
                          output: {
                            success: false,
                            aborted: true,
                            error: "Operation aborted by user"
                          }
                        } as ToolUIPart)
                      : part;

                  return (
                    <ToolInvocationCard
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable enough for UI parts
                      key={`${toolCallId}-${i}`}
                      toolUIPart={toolUIPart}
                      toolCallId={toolCallId}
                      subagentPhase={subagentPhase}
                      needsConfirmation={toolName === "generateCode"}
                      onSubmit={({ toolCallId, result }) => {
                        addToolResult({
                          tool: toolName,
                          toolCallId,
                          output: result
                        });
                      }}
                      addToolResult={(toolCallId, result) => {
                        addToolResult({
                          tool: toolName,
                          toolCallId,
                          output: result
                        });
                      }}
                      addToolApprovalResponse={addToolApprovalResponse}
                    />
                  );
                }

                return null;
              })}

              {model.showThinkingTail && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>Thinking…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
