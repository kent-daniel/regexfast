"use client";

import { Button } from "@/components/ui/button";
import { BugIcon, TrashIcon, SparkleIcon } from "@phosphor-icons/react";
import { TOKEN_LIMIT } from "@/agent-worker/shared";

type ChatHeaderProps = {
  totalTokens?: number;
  showDebug: boolean;
  onToggleDebug: () => void;
  onClearHistory: () => void;
  isStreaming?: boolean;
};

function TokenProgressBar({ totalTokens }: { totalTokens: number }) {
  const percentUsed = Math.min((totalTokens / TOKEN_LIMIT) * 100, 100);
  const percentRemaining = 100 - percentUsed;
  
  // Color based on remaining percentage
  let barColor = "bg-green-500";
  if (percentRemaining <= 25) {
    barColor = "bg-red-500";
  } else if (percentRemaining <= 50) {
    barColor = "bg-yellow-500";
  }

  const isLimitReached = totalTokens >= TOKEN_LIMIT;

  return (
    <div 
      className="flex items-center gap-2 cursor-default"
      title={`${totalTokens.toLocaleString()} / ${TOKEN_LIMIT.toLocaleString()} tokens used`}
    >
      <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
        {isLimitReached ? (
          <span className="text-red-400">Limit reached</span>
        ) : (
          <>Tokens: {Math.round(percentRemaining)}%</>
        )}
      </span>
      <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
    </div>
  );
}

export function ChatHeader({
  totalTokens,
  showDebug,
  onToggleDebug,
  onClearHistory,
  isStreaming = false
}: ChatHeaderProps) {
  return (
    <header className="px-4 py-3 border-b border-white/5 flex items-center gap-2.5 bg-[#151B23] flex-shrink-0 h-12">
      {/* Copilot sparkle icon */}
      <div className="flex items-center justify-center h-6 w-6 bg-blue-500 rounded-full shadow-sm">
        <SparkleIcon size={12} className="text-white" weight="fill" />
      </div>

      {/* Title */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h2 className="font-medium text-sm text-slate-50">Regex Copilot</h2>
          {totalTokens !== undefined && (
            <TokenProgressBar totalTokens={totalTokens} />
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2" role="status" aria-live="polite">
        <span 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isStreaming 
              ? "bg-blue-500 animate-pulse" 
              : "bg-green-500 animate-[copilot-pulse_3s_ease-in-out_infinite]"
          }`}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{isStreaming ? "Thinking" : "Ready"}</span>
        <span className="sr-only">{isStreaming ? "AI is thinking" : "AI is ready"}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        {/* <Button
          variant="ghost"
          size="icon"
          className="rounded-md h-7 w-7 text-slate-400 hover:text-slate-50 hover:bg-white/10 transition-colors"
          onClick={onToggleDebug}
          title="Toggle debug mode"
        >
          <BugIcon size={14} className={showDebug ? "text-blue-400" : ""} />
        </Button> */}

        <Button
          variant="ghost"
          size="icon"
          className="rounded-md h-7 w-7 text-slate-400 hover:text-slate-50 hover:bg-white/10 transition-colors"
          onClick={onClearHistory}
          title="Clear chat"
        >
          <TrashIcon size={14} />
        </Button>
      </div>
    </header>
  );
}
