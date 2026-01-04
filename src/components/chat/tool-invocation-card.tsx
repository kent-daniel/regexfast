import type { ToolUIPart, ChatAddToolApproveResponseFunction } from "ai";
import { WrenchIcon, CheckCircleIcon, CircleNotchIcon, WarningCircleIcon, CodeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { APPROVAL } from "@/agent-worker/shared";
import type { SubagentPhase } from "@/agent-worker/shared";

interface ToolInvocationCardProps {
  toolUIPart: ToolUIPart;
  toolCallId: string;
  subagentPhase?: SubagentPhase;
  needsConfirmation: boolean;
  onSubmit: ({
    toolCallId,
    result
  }: {
    toolCallId: string;
    result: string;
  }) => void;
  addToolResult: (toolCallId: string, result: string) => void;
  addToolApprovalResponse?: ChatAddToolApproveResponseFunction;
}

/**
 * Check if this tool requires approval based on toolName
 */
function isApprovalRequiredTool(toolName: string): boolean {
  return toolName === "generateCode";
}

/**
 * Get a user-friendly description for the approval dialog
 */
function getApprovalDescription(toolName: string, args: unknown): string {
  if (toolName === "generateCode") {
    const input = args as { description?: string; runtime?: string; tests?: unknown[] };
    return `The agent wants to generate and execute custom ${input.runtime || "JavaScript"} code. This will run in a sandboxed environment with no network access.

Description: ${input.description || "Not specified"}
Test cases: ${input.tests?.length || 0}`;
  }
  return `Allow ${toolName}?`;
}

/**
 * 
 * 
 * get a user friendly name for the tool 
 */
function getFriendlyToolName(toolName: string): string {
  switch (toolName) {
    case "generateMatchRegex":
      return "Working on match regex";
    case "generateCaptureRegex":
      return "Working on capture regex";
    case "generateCode":
      return "Generating code";
    default:
      return toolName;
  }
}

export function ToolInvocationCard({
  toolUIPart,
  toolCallId,
  subagentPhase,
  needsConfirmation,
  onSubmit,
  addToolApprovalResponse
}: ToolInvocationCardProps) {
  const toolName = getFriendlyToolName(toolUIPart.type.replace("tool-", ""));
  const isCompleted = toolUIPart.state === "output-available";
  const isRunning = toolUIPart.state === "input-streaming" || toolUIPart.state === "input-available";
  
  // AI SDK 6: Check for approval-requested state
  const isApprovalRequested = toolUIPart.state === "approval-requested";
  const needsApproval = needsConfirmation && toolUIPart.state === "input-available";

  // Determine if this is a code generation tool
  const isCodeGenerationTool = isApprovalRequiredTool(toolName);

  // Get status info
  const getStatusInfo = () => {
    // AI SDK 6 approval-requested state takes precedence
    if (isApprovalRequested) {
      return {
        icon: <WarningCircleIcon size={14} className="text-amber-500" />,
        text: "Awaiting approval",
        color: "text-amber-500"
      };
    }
    if (needsApproval) {
      return {
        icon: <WarningCircleIcon size={14} className="text-amber-500" />,
        text: "Waiting for approval",
        color: "text-amber-500"
      };
    }
    if (isCompleted) {
      return {
        icon: <CheckCircleIcon size={14} className="text-green-500" />,
        text: "Completed",
        color: "text-green-500"
      };
    }
    if (isRunning) {
      return {
        icon: <CircleNotchIcon size={14} className="text-purple-500 animate-spin" />,
        text: "Running",
        color: "text-purple-500"
      };
    }
    return {
      icon: <WrenchIcon size={14} className="text-neutral-400" />,
      text: "Pending",
      color: "text-neutral-400"
    };
  };

  const statusInfo = getStatusInfo();

  const phaseLabel = (() => {
    if (!subagentPhase) return null;
    if (subagentPhase === "generating") return "Generating";
    if (subagentPhase === "executing") return "Executing";
    if (subagentPhase === "evaluating") return "Evaluating";
    return null;
  })();

  // Handle AI SDK 6 approval response
  const handleApproval = (approved: boolean) => {
    if (isApprovalRequested && addToolApprovalResponse && "approval" in toolUIPart) {
      // AI SDK 6 native approval flow
      const approvalPart = toolUIPart as ToolUIPart & { approval?: { id: string } };
      if (approvalPart.approval?.id) {
        addToolApprovalResponse({
          id: approvalPart.approval.id,
          approved,
        });
      }
    } else {
      // Fallback to legacy onSubmit
      onSubmit({ toolCallId, result: approved ? APPROVAL.YES : APPROVAL.NO });
    }
  };

  return (
    <div className="my-2 py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/50">
      <div className="flex items-center gap-2">
        {isCodeGenerationTool ? (
          <CodeIcon size={14} className="text-blue-500 shrink-0" />
        ) : (
          <WrenchIcon size={14} className="text-purple-500 shrink-0" />
        )}
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {toolName}
        </span>
        {phaseLabel && isRunning && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            · {phaseLabel}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs ml-auto">
          {statusInfo.icon}
          <span className={statusInfo.color}>{statusInfo.text}</span>
        </span>
      </div>

      {/* AI SDK 6 approval-requested state */}
      {isApprovalRequested && (
        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700/50">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap mb-3">
            {getApprovalDescription(toolName, "input" in toolUIPart ? toolUIPart.input : {})}
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApproval(false)}
            >
              Deny
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleApproval(true)}
            >
              Approve
            </Button>
          </div>
        </div>
      )}

      {/* Legacy approval flow */}
      {needsApproval && !isApprovalRequested && (
        <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSubmit({ toolCallId, result: APPROVAL.NO })}
          >
            Deny
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onSubmit({ toolCallId, result: APPROVAL.YES })}
          >
            Allow
          </Button>
        </div>
      )}
    </div>
  );
}
