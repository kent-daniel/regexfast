"use client";

import { Button } from "@/components/ui/button";
import { BugIcon, TrashIcon, SparkleIcon } from "@phosphor-icons/react";

type ChatHeaderProps = {
  totalTokens?: number;
  showDebug: boolean;
  onToggleDebug: () => void;
  onClearHistory: () => void;
  isStreaming?: boolean;
};

export function ChatHeader({
  totalTokens,
  showDebug,
  onToggleDebug,
  onClearHistory,
  isStreaming = false
}: ChatHeaderProps) {
  return (
    <header className="px-4 py-3 border-b border-white/5 flex items-center gap-2.5 bg-[#151B23] flex-shrink-0 h-12">
      {/* Copilot sparkle icon with gradient */}
      <div className="flex items-center justify-center h-6 w-6 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full shadow-sm shadow-blue-500/20">
        <SparkleIcon size={12} className="text-white" weight="fill" />
      </div>

      {/* Title */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-sm text-slate-50">Regex Copilot</h2>
          {totalTokens !== undefined && (
            <span className="text-[11px] text-slate-500 font-mono">
              {totalTokens.toLocaleString()} tokens
            </span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
        <span 
          className={`w-2 h-2 rounded-full ${
            isStreaming 
              ? "bg-blue-500 animate-pulse" 
              : "bg-green-500 animate-[pulse_3s_ease-in-out_infinite]"
          }`} 
        />
        <span className="hidden sm:inline">{isStreaming ? "Thinking" : "Ready"}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md h-7 w-7 text-slate-400 hover:text-slate-50 hover:bg-white/10 transition-colors"
          onClick={onToggleDebug}
          title="Toggle debug mode"
        >
          <BugIcon size={14} className={showDebug ? "text-blue-400" : ""} />
        </Button>

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
