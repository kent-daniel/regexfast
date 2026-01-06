"use client";

import { useRegexEditor } from "@/hooks/useRegexEditor";
import { PatternInput } from "./PatternInput";
import { ResultsPanel } from "./ResultsPanel";
import { CodeSnippet } from "./CodeSnippet";
import { cn } from "@/lib/utils";
import { TerminalWindow } from "@phosphor-icons/react";

interface RegexEditorCardProps {
  initialData?: {
    pattern: string;
    flags: string;
    runtime?: string;
    testResults?: {
      mode?: "match" | "capture";
      details?: Array<{
        input: string;
        passed: boolean;
        expected?: string | (string | null)[];
        actual?: string | (string | null)[] | null;
      }>;
    };
  };
}

export function RegexEditorCard({ initialData }: RegexEditorCardProps) {
  const {
    pattern,
    setPattern,
    flags,
    toggleFlag,
    testInput,
    setTestInput,
    mode,
    setMode,
    runtime,
    setRuntime,
    results,
    isLoading,
    runTest,
  } = useRegexEditor(initialData);

  return (
    <div className="bg-slate-950 rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-slate-800 flex flex-col h-full ring-1 ring-white/5">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/10 rounded-md">
                 <TerminalWindow size={18} className="text-blue-400" weight="duotone"/>
            </div>
           <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Regex Studio</h2>
        </div>
        <div className="flex gap-1.5">
           <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors" />
           <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors" />
        </div>
      </header>

      {/* Pattern Input Section */}
      <div className="z-20 relative">
        <PatternInput
          pattern={pattern}
          onPatternChange={setPattern}
          flags={flags}
          onFlagToggle={toggleFlag}
          mode={mode}
          onModeChange={setMode}
          runtime={runtime}
          onRuntimeChange={setRuntime}
          onRun={runTest}
          isLoading={isLoading}
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Test Input Section */}
          <section className="flex-1 flex flex-col min-h-[200px] border-r border-slate-800 bg-slate-900/30">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Test Strings
                </label>
                <div className="text-[10px] text-slate-500 font-mono">
                    Multi-line supported
                </div>
            </div>
            
            <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className={cn(
                "flex-1 w-full p-4 resize-none bg-transparent",
                "font-mono text-sm leading-relaxed text-slate-300",
                "placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/50 transition-colors",
                "selection:bg-blue-500/30 selection:text-blue-200"
            )}
            placeholder={`Enter your test cases here...
Example:
test@example.com
invalid-email
hello@world.co.uk`}
            spellCheck={false}
            />
        </section>

        {/* Results Panel */}
        <div className="flex-1 min-h-[200px] bg-slate-900 overflow-hidden relative z-0">
            <ResultsPanel results={results} mode={mode} isLoading={isLoading} />
        </div>
      </div>

      {/* Code Snippet - Footer */}
      <div className="border-t border-slate-800 bg-slate-950 p-4">
        <CodeSnippet
          pattern={pattern}
          flags={flags.join("")}
          runtime={runtime}
          mode={mode}
        />
      </div>
    </div>
  );
}
