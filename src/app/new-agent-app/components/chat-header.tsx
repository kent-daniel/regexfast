"use client";

import { Button } from "@/components/ui/button";
import { BugIcon, TrashIcon, SparkleIcon } from "@phosphor-icons/react";

type ChatHeaderProps = {
  totalTokens?: number;
  showDebug: boolean;
  onToggleDebug: () => void;
  onClearHistory: () => void;
};

export function ChatHeader({
  totalTokens,
  showDebug,
  onToggleDebug,
  onClearHistory
}: ChatHeaderProps) {
  return (
    <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2.5 bg-[#151B23] flex-shrink-0">
      <div className="flex items-center justify-center h-6 w-6 bg-gradient-to-br from-blue-500 to-violet-500 rounded-md">
        <SparkleIcon size={12} className="text-white" weight="fill" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-[13px] text-slate-50">Regex Copilot</h2>
          {totalTokens !== undefined && (
            <span className="text-[11px] text-slate-500">
              {totalTokens} tokens
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md h-6 w-6 text-slate-400 hover:text-slate-50 hover:bg-white/10"
          onClick={onToggleDebug}
          title="Toggle debug mode"
        >
          <BugIcon size={14} className={showDebug ? "text-blue-400" : ""} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-md h-6 w-6 text-slate-400 hover:text-slate-50 hover:bg-white/10"
          onClick={onClearHistory}
          title="Clear chat"
        >
          <TrashIcon size={14} />
        </Button>
      </div>
    </div>
  );
}
