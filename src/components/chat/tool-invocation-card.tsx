import type { ToolUIPart, ChatAddToolApproveResponseFunction } from "ai";
import { Check, X, CircleNotch, Warning, Code, CaretDown, CaretUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { APPROVAL } from "@/agent-worker/shared";
import type { SubagentPhase } from "@/agent-worker/shared";
import { useState, useEffect } from "react";
import { RegexResultCard } from "./regex-result-card";
import { useRegexEditorContext } from "@/components/regex-editor/regex-editor-context";

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
 * Get user-friendly tool name with action verb
 */
function getFriendlyToolName(toolName: string): string {
  switch (toolName) {
    case "generateMatchRegex":
      return "Generating match regex";
    case "generateCaptureRegex":
      return "Generating capture regex";
    case "generateCode":
      return "Generating code";
    default:
      return toolName;
  }
}

/**
 * Get compact completed message
 */
function getCompletedMessage(toolName: string, output: unknown): { text: string; isError: boolean; details?: string[] } {
  const result = output as { 
    success?: boolean; 
    error?: string; 
    aborted?: boolean;
    testResults?: { passed: number; failed: number; total: number };
    failedTests?: Array<{ input: string; expected: string; actual: string }>;
  } | undefined;
  
  if (result?.aborted) {
    return { text: "Aborted by user", isError: true };
  }
  
  if (result?.success === false) {
    const details = result.failedTests?.map(t => 
      `"${t.input}" — expected ${t.expected}, got ${t.actual}`
    );
    return { 
      text: result.error || "Failed", 
      isError: true,
      details
    };
  }
  
  if (result?.testResults) {
    const { passed, total } = result.testResults;
    return { 
      text: `Completed • ${passed}/${total} tests passed`, 
      isError: false 
    };
  }
  
  return { text: "Completed", isError: false };
}

/**
 * Get phase label for subagent status
 */
function getPhaseLabel(phase?: SubagentPhase): string | null {
  switch (phase) {
    case "generating": return "Generating pattern";
    case "executing": return "Testing regex";
    case "evaluating": return "Evaluating results";
    default: return null;
  }
}

/**
 * Check if this is a regex generation tool
 */
function isRegexTool(toolName: string): boolean {
  return toolName === "generateMatchRegex" || toolName === "generateCaptureRegex";
}

/**
 * Extract regex result from tool output
 */
function getRegexResult(output: unknown): {
  pattern: string;
  flags: string;
  success: boolean;
  iterations: number;
  runtime: string;
  testResults?: {
    passed: number;
    failed: number;
    total: number;
    mode?: "match" | "capture";
    details?: Array<{
      input: string;
      passed: boolean;
      expected?: string | (string | null)[];
      actual?: string | (string | null)[] | null;
    }>;
  };
  example?: string;
} | null {
  const result = output as Record<string, unknown> | undefined;
  if (!result || typeof result.pattern !== "string") return null;
  
  // Type-safe extraction of testResults
  const testResults = result.testResults as {
    passed: number;
    failed: number;
    total: number;
    mode?: "match" | "capture";
    details?: Array<{
      input: string;
      passed: boolean;
      expected?: string | (string | null)[];
      actual?: string | (string | null)[] | null;
    }>;
  } | undefined;
  
  return {
    pattern: result.pattern as string,
    flags: (result.flags as string) || "",
    success: result.success === true,
    iterations: (result.iterations as number) || 1,
    runtime: (result.runtime as string) || "javascript",
    testResults,
    example: result.example as string | undefined,
  };
}

export function ToolInvocationCard({
  toolUIPart,
  toolCallId,
  subagentPhase,
  needsConfirmation,
  onSubmit,
  addToolApprovalResponse
}: ToolInvocationCardProps) {
  const { setLatestInitialData } = useRegexEditorContext();
  const toolName = getFriendlyToolName(toolUIPart.type.replace("tool-", ""));
  const rawToolName = toolUIPart.type.replace("tool-", "");
  const isCompleted = toolUIPart.state === "output-available";
  const isRunning = toolUIPart.state === "input-streaming" || toolUIPart.state === "input-available";
  
  // AI SDK 6: Check for approval-requested state
  const isApprovalRequested = toolUIPart.state === "approval-requested";
  const needsApproval = needsConfirmation && toolUIPart.state === "input-available";

  // Determine if this is a code generation tool
  const isCodeGenerationTool = isApprovalRequiredTool(rawToolName);
  
  // Determine if this is a regex tool
  const isRegex = isRegexTool(rawToolName);

  // State for expandable error details
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State for elapsed time
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(() => Date.now());

  // Update elapsed time while running
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Get output info for completed state
  const outputInfo = isCompleted && "output" in toolUIPart 
    ? getCompletedMessage(rawToolName, toolUIPart.output)
    : null;

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

  const phaseLabel = getPhaseLabel(subagentPhase);

  // When a regex tool completes, publish its output for the editor panel.
  useEffect(() => {
    if (!isRegex) return;
    if (!isCompleted) return;
    if (!("output" in toolUIPart)) return;
    const regexResult = getRegexResult(toolUIPart.output);
    if (!regexResult) return;

    setLatestInitialData({
      pattern: regexResult.pattern,
      flags: regexResult.flags,
      runtime: regexResult.runtime,
      testResults: regexResult.testResults,
    });
  }, [isRegex, isCompleted, toolUIPart, setLatestInitialData]);

  // Approval Required State - Copilot style
  if (isApprovalRequested || needsApproval) {
    return (
      <div className="my-2 rounded-lg bg-amber-500/10 border-l-2 border-l-amber-500 overflow-hidden transition-all duration-200">
        <div className="flex items-center gap-2 px-3 py-2">
          <Warning size={16} className="text-amber-500 shrink-0" weight="fill" />
          <span className="text-sm text-slate-300">
            {isCodeGenerationTool ? "Code execution requires approval" : "Awaiting approval"}
          </span>
        </div>
        
        <div className="px-3 pb-3 pt-1 border-t border-amber-500/20">
          <p className="text-xs text-slate-400 whitespace-pre-wrap mb-3">
            {getApprovalDescription(rawToolName, "input" in toolUIPart ? toolUIPart.input : {})}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </span>
              Sandboxed
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5"
                onClick={() => handleApproval(false)}
              >
                Deny
              </Button>
              <Button
                size="sm"
                className="h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-0"
                onClick={() => handleApproval(true)}
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Running State - Compact inline
  if (isRunning) {
    return (
      <div className="my-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border-l-2 border-l-blue-500 transition-all duration-200">
        <CircleNotch size={16} className="text-blue-500 animate-spin shrink-0" />
        <span className="text-sm text-slate-300">
          {phaseLabel || toolName}...
        </span>
        {subagentPhase && (
          <span className="text-xs text-slate-500">
            {isCodeGenerationTool && <Code size={12} className="inline mr-1" />}
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500 tabular-nums">
          {elapsedTime.toFixed(1)}s
        </span>
      </div>
    );
  }

  // Completed State - Success or Error
  if (isCompleted && outputInfo) {
    const { text, isError, details } = outputInfo;
    
    // Special handling for regex tools - use RegexResultCard
    if (isRegex && "output" in toolUIPart) {
      const regexResult = getRegexResult(toolUIPart.output);
      if (regexResult) {
        return (
          <RegexResultCard
            pattern={regexResult.pattern}
            flags={regexResult.flags}
            success={regexResult.success}
            iterations={regexResult.iterations}
            runtime={regexResult.runtime}
            testResults={regexResult.testResults}
            example={regexResult.example}
          />
        );
      }
    }
    
    // Error state with expandable details
    if (isError) {
      return (
        <div className="my-2 rounded-lg bg-red-500/10 border-l-2 border-l-red-500 overflow-hidden transition-all duration-200">
          <div 
            className={`flex items-center gap-2 px-3 py-2 ${details?.length ? 'cursor-pointer hover:bg-red-500/5' : ''}`}
            onClick={() => details?.length && setIsExpanded(!isExpanded)}
            onKeyDown={(e) => e.key === 'Enter' && details?.length && setIsExpanded(!isExpanded)}
            role={details?.length ? "button" : undefined}
            tabIndex={details?.length ? 0 : undefined}
          >
            <X size={16} className="text-red-500 shrink-0" weight="bold" />
            <span className="text-sm text-slate-300">{text}</span>
            {details?.length ? (
              <button 
                type="button"
                className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {isExpanded ? (
                  <>Hide <CaretUp size={12} /></>
                ) : (
                  <>Details <CaretDown size={12} /></>
                )}
              </button>
            ) : null}
          </div>
          
          {isExpanded && details?.length ? (
            <div className="px-3 pb-3 pt-1 border-t border-red-500/20 space-y-1.5 animate-[expand_0.2s_ease-out]" role="region" aria-label="Error details">
              {details.map((detail, i) => (
                <p key={`detail-${detail.slice(0, 20)}-${i}`} className="text-xs text-slate-400 pl-6">
                  <span aria-hidden="true">•</span> {detail}
                </p>
              ))}
              <p className="text-xs text-slate-500 pl-6 pt-1 flex items-center gap-1">
                <span aria-hidden="true">💡</span> Try adding more specific examples
              </p>
            </div>
          ) : null}
        </div>
      );
    }
    
    // Success state - compact
    return (
      <div className="my-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border-l-2 border-l-green-500 transition-all duration-200">
        <Check size={16} className="text-green-500 shrink-0" weight="bold" />
        <span className="text-sm text-slate-300">{text}</span>
      </div>
    );
  }

  // Fallback/Pending state (rarely shown)
  return (
    <div className="my-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border-l-2 border-l-slate-500 transition-all duration-200">
      <CircleNotch size={16} className="text-slate-400 shrink-0" />
      <span className="text-sm text-slate-400">{toolName}</span>
    </div>
  );
}
