"use client";

import { SparkleIcon } from "@phosphor-icons/react";

const suggestions = [
  "Match emails ending in .edu",
  "Extract phone numbers from text",
  "Validate URLs with http/https",
  "Find dates in MM/DD/YYYY format",
];

type EmptyStateProps = {
  onSuggestionClick?: (suggestion: string) => void;
};

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      {/* Copilot sparkle icon with gradient */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
        <SparkleIcon size={24} className="text-white" weight="fill" />
      </div>

      {/* Welcome text */}
      <h2 className="text-lg font-medium text-slate-50 mb-2">
        Hi! I'm Regex Copilot.
      </h2>
      <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
        Tell me what you want to match, and I'll generate the perfect pattern for you.
      </p>

      {/* Suggestion buttons */}
      <div className="space-y-2 w-full max-w-sm">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestionClick?.(s)}
            className="w-full px-4 py-3 text-left text-sm text-slate-300 bg-[#1C232D] rounded-lg border border-white/5 hover:bg-[#232B37] hover:border-blue-500/30 hover:text-slate-100 transition-all duration-150 group"
          >
            <span className="text-slate-500 group-hover:text-blue-400 transition-colors">"</span>
            {s}
            <span className="text-slate-500 group-hover:text-blue-400 transition-colors">"</span>
          </button>
        ))}
      </div>
    </div>
  );
}
