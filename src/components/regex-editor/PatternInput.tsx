"use client";

import { useState } from "react";
import {
  Copy,
  CheckCircle,
  Play,
  CircleNotch,
  SlidersHorizontal,
  CodeBlock,
  TextAa,
  Hash,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PatternInputProps {
  pattern: string;
  flags: ("g" | "i" | "m")[];
  mode: "match" | "capture";
  runtime: "javascript" | "typescript" | "python";
  isLoading: boolean;
  onPatternChange: (pattern: string) => void;
  onFlagToggle: (flag: "g" | "i" | "m") => void;
  onModeChange: (mode: "match" | "capture") => void;
  onRuntimeChange: (runtime: "javascript" | "typescript" | "python") => void;
  onRun: () => void;
}

const FLAG_OPTIONS: ("g" | "i" | "m")[] = ["g", "i", "m"];

export function PatternInput({
  pattern,
  flags,
  mode,
  runtime,
  isLoading,
  onPatternChange,
  onFlagToggle,
  onModeChange,
  onRuntimeChange,
  onRun,
}: PatternInputProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  const fullRegex = `/${pattern}/${flags.join("")}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullRegex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-slate-900 border-b border-slate-800">
      <div className="flex flex-col gap-2">
         <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash weight="bold" className="text-blue-500" />
              Pattern
            </label>
            <div className="flex items-center gap-2">
                 <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-200 text-xs font-medium flex items-center gap-1",
                   showOptions ? "bg-slate-800 text-blue-400" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <SlidersHorizontal size={14} />
                <span>Options</span>
              </button>
            </div>
         </div>

        <div className="relative flex items-stretch group">
          {/* Input Container */}
          <div className="flex-1 flex items-center bg-slate-950/50 border border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200 shadow-sm">
            {/* Opening delimiter */}
            <span className="pl-3 pr-1 text-slate-500 font-mono text-lg select-none">
              /
            </span>

            {/* Pattern input */}
            <input
              type="text"
              value={pattern}
              onChange={(e) => onPatternChange(e.target.value)}
              placeholder="regex..."
              className={cn(
                "flex-1 bg-transparent text-slate-200 font-mono text-base",
                "py-3 border-none outline-none",
                "placeholder:text-slate-600"
              )}
              autoComplete="off"
              spellCheck="false"
            />

            {/* Closing delimiter & Flags */}
            <div className="flex items-center pr-3 gap-2">
               <span className="text-slate-500 font-mono text-lg select-none">
                /
              </span>
              {flags.length > 0 && (
                 <span className="text-blue-400 font-mono text-sm font-medium tracking-wide">
                  {flags.join("")}
                </span>
              )}
            </div>
             
             {/* Copy Action */}
              <div className="border-l border-slate-700/50 pl-1 pr-1">
                 <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      "p-2 rounded-md transition-all duration-200",
                      "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                    )}
                    title="Copy regex"
                  >
                    {copied ? (
                      <CheckCircle size={18} className="text-green-400" weight="fill" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
              </div>

          </div>
          
           {/* Run/Test Button - integrated next to input on large screens, or maybe just keeps it prominent */}
           <button
            type="button"
            onClick={onRun}
            disabled={isLoading}
            className={cn(
              "ml-3 flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-blue-900/20",
              "bg-blue-600 text-white border border-blue-500",
              "hover:bg-blue-500 hover:border-blue-400 hover:shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            )}
          >
            {isLoading ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <Play size={18} weight="fill" />
            )}
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Expanded Options Panel */}
      <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ease-in-out",
          showOptions ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
      )}>
         {/* Left Col: Flags & Mode */}
         <div className="space-y-3 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
             <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <TextAa size={14} /> Flags
                </span>
                <div className="flex gap-1.5">
                     {FLAG_OPTIONS.map((flag) => (
                    <button
                        key={flag}
                        onClick={() => onFlagToggle(flag)}
                        className={cn(
                        "w-7 h-7 flex items-center justify-center rounded text-xs font-mono transition-all duration-200 border",
                        flags.includes(flag)
                            ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                            : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                        )}
                    >
                        {flag}
                    </button>
                    ))}
                </div>
             </div>
             
             <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    Mode
                  </span>
                   <div className="flex bg-slate-900/50 p-0.5 rounded-lg border border-slate-700/50">
                    {[
                        { value: "match", label: "Match" },
                        { value: "capture", label: "Capture" },
                    ].map((opt) => (
                        <button
                        key={opt.value}
                        onClick={() => onModeChange(opt.value as any)}
                        className={cn(
                            "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
                            mode === opt.value
                            ? "bg-slate-700 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                        >
                        {opt.label}
                        </button>
                    ))}
                    </div>
             </div>
         </div>

         {/* Right Col: Runtime */}
         <div className="space-y-3 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between h-full">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                   <CodeBlock size={14} /> Runtime
                </span>
                 <div className="flex flex-col gap-1 w-2/3">
                    {[
                        { value: "javascript", label: "JavaScript (ES6+)" },
                        { value: "python", label: "Python 3" },
                        // { value: "typescript", label: "TypeScript" }, // Minimal diff from JS for regex usually
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onRuntimeChange(opt.value as any)}
                            className={cn(
                                "flex items-center justify-between px-3 py-1.5 rounded text-xs transition-all duration-150 border",
                                runtime === opt.value
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                                    : "bg-transparent border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                            )}
                        >
                           <span>{opt.label}</span>
                           {runtime === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
                        </button>
                    ))}
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
}
