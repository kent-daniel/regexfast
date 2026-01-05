import { isStaticToolUIPart, type ChatAddToolApproveResponseFunction } from "ai";
import type { UIMessage } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";

import { MemoizedMarkdown } from "@/components/chat/memoized-markdown";
import { ToolInvocationCard } from "@/components/chat/tool-invocation-card";
import type { SubagentStatusEvent } from "@/agent-worker/shared";

import { SparkleIcon, UserIcon } from "@phosphor-icons/react";

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
    <div>
      {showDebug && model.message && (
        <pre className="text-[11px] text-slate-500 overflow-scroll bg-[#1C232D] p-2 rounded mb-2">
          {JSON.stringify(model.message, null, 2)}
        </pre>
      )}

      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex gap-3 max-w-[92%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Only show avatar for assistant, not for user (cleaner Copilot style) */}
          {!isUser && model.showAvatar ? (
            <div className="flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <SparkleIcon size={10} className="text-white" weight="fill" />
              </div>
            </div>
          ) : !isUser ? (
            <div className="w-5" />
          ) : null}

          <div className="flex-1 min-w-0">
            <div>
              {model.message?.parts?.map((part, i) => {
                if (part.type === "text") {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: immutable index
                    <div
                      key={i}
                      className={`text-[13px] leading-relaxed ${
                        isUser
                          ? "bg-[#1C232D] text-slate-100 rounded-xl rounded-br-sm px-4 py-2.5"
                          : "text-slate-200"
                      }`}
                    >
                      {part.text.startsWith("scheduled message") && (
                        <span className="text-[11px] text-blue-400 mb-1 block">
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
                <div className="flex items-center text-[13px] text-slate-400 animate-pulse">
                  Thinking…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
