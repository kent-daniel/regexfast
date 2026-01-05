"use client";

import { SparkleIcon } from "@phosphor-icons/react";

const suggestions = [
  "Match emails ending in .edu",
  "Extract phone numbers from text",
  "Validate URLs with http/https",
];

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-5 max-w-xs mx-auto px-4">
        <div className="bg-gradient-to-br from-blue-500 to-violet-500 rounded-full p-3 inline-flex">
          <SparkleIcon size={22} className="text-white" weight="fill" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-medium text-[15px] text-slate-50">Hi! I'm Regex Copilot.</h3>
          <p className="text-slate-400 text-[13px] leading-relaxed">
            Tell me what you want to match, and I'll generate the perfect pattern.
          </p>
        </div>
        <div className="space-y-1.5 pt-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full px-3 py-2 text-left text-[12px] text-slate-300 bg-[#1C232D] rounded-md border border-white/5 hover:bg-[#232B37] hover:border-blue-500/30 transition-colors"
            >
              "{s}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
