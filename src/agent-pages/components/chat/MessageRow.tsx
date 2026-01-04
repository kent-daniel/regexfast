import { isStaticToolUIPart, type ChatAddToolApproveResponseFunction } from "ai";
import type { UIMessage } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";

import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";
import type { SubagentStatusEvent } from "@/shared";

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
        <pre className="text-xs text-neutral-500 overflow-scroll bg-neutral-100 dark:bg-neutral-800 p-2 rounded mb-2">
          {JSON.stringify(model.message, null, 2)}
        </pre>
      )}

      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex gap-3 max-w-[90%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          {model.showAvatar ? (
            <div className="flex items-center gap-2">
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  isUser
                    ? "bg-neutral-200 dark:bg-neutral-700"
                    : "bg-gradient-to-br from-purple-500 to-purple-600"
                }`}
              >
                {isUser ? (
                  <UserIcon
                    size={14}
                    className="text-neutral-600 dark:text-neutral-300"
                  />
                ) : (
                  <SparkleIcon size={14} className="text-white" weight="fill" />
                )}
              </div>
            </div>
          ) : (
            <div className="w-7" />
          )}

          <div className="flex-1 min-w-0">
            <div>
              {model.message?.parts?.map((part, i) => {
                if (part.type === "text") {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: immutable index
                    <div
                      key={i}
                      className={`${
                        isUser
                          ? "bg-purple-500 text-white rounded-2xl rounded-br-md px-4 py-2"
                          : ""
                      }`}
                    >
                      {part.text.startsWith("scheduled message") && (
                        <span className="text-xs text-purple-400 mb-1 block">
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
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
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
