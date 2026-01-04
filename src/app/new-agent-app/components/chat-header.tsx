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
    <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10 bg-white dark:bg-neutral-950">
      <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
        <SparkleIcon size={18} className="text-white" weight="fill" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base">Copilot</h2>
          {totalTokens !== undefined && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {totalTokens} tokens
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md h-8 w-8"
          onClick={onToggleDebug}
          title="Toggle debug mode"
        >
          <BugIcon size={18} className={showDebug ? "text-purple-500" : ""} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-md h-8 w-8"
          onClick={onClearHistory}
          title="Clear chat"
        >
          <TrashIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
