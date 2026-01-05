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
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-[fade-in_0.3s_ease-out]">
      {/* Copilot sparkle icon */}
      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mb-6 shadow-lg animate-[scale-in_0.4s_ease-out]">
        <SparkleIcon size={24} className="text-white" weight="fill" aria-hidden="true" />
      </div>

      {/* Welcome text */}
      <h2 className="text-lg font-medium text-slate-50 mb-2 animate-[slide-up_0.3s_ease-out_0.1s_both]">
        Hi! I'm Regex Copilot.
      </h2>
      <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed animate-[slide-up_0.3s_ease-out_0.15s_both]">
        Tell me what you want to match, and I'll generate the perfect pattern for you.
      </p>

      {/* Suggestion buttons */}
      <nav className="space-y-2 w-full max-w-sm animate-[slide-up_0.3s_ease-out_0.2s_both]" aria-label="Suggested prompts">
        {suggestions.map((s, index) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestionClick?.(s)}
            className="w-full px-4 py-3 text-left text-sm text-slate-300 bg-[#1C232D] rounded-lg border border-white/5 hover:bg-[#232B37] hover:border-blue-500/30 hover:text-slate-100 transition-all duration-150 group focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
            style={{ animationDelay: `${0.25 + index * 0.05}s` }}
          >
            <span className="text-slate-500 group-hover:text-blue-400 transition-colors" aria-hidden="true">"</span>
            <span className="sr-only">Try: </span>{s}
            <span className="text-slate-500 group-hover:text-blue-400 transition-colors" aria-hidden="true">"</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
