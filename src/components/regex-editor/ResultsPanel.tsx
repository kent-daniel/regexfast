"use client";

import { Check, X, WarningCircle, Ghost } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
    mode: "match" | "capture";
    results?: Array<{
        input: string;
        passed: boolean;
        groups?: (string | null)[];
        matched?: boolean;
    }>;
    isLoading: boolean;
    error?: string;
}

export function ResultsPanel({ mode, results, isLoading, error }: ResultsPanelProps) {
    const passedCount = results?.filter((r) => r.passed).length ?? 0;
    const totalCount = results?.length ?? 0;
    const allPassed = totalCount > 0 && passedCount === totalCount;

    return (
        <div className="bg-slate-900 border-t border-slate-800 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Output Results
                </span>
                {results && results.length > 0 && mode === "match" && (
                    <div className={cn(
                        "text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1.5",
                        allPassed
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                    )}>
                        <span>{passedCount}/{totalCount} passed</span>
                        {allPassed && <Check weight="bold" />}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {isLoading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <ErrorState error={error} />
                ) : !results || results.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ResultsList results={results} mode={mode} />
                )}
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3 p-2">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-800/20 border border-slate-800/50 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-slate-700/50" />
                        <div className="h-4 w-3/4 rounded bg-slate-700/50" />
                    </div>
                    <div className="ml-7 h-3 w-1/2 rounded bg-slate-700/30" />
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 opacity-60">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                <Ghost size={32} weight="duotone" />
            </div>
            <p className="text-sm font-medium">Ready to test</p>
            <p className="text-xs text-slate-600 mt-1 text-center max-w-[200px]">
                Enter your patterns and inputs above, then click Run to see verification output.
            </p>
        </div>
    );
}

function ErrorState({ error }: { error: string }) {
    return (
        <div className="p-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
                <WarningCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-red-400 mb-1">Compilation Error</h3>
                    <p className="text-sm text-red-300/90 font-mono break-words">{error}</p>
                </div>
            </div>
        </div>
    );
}

function ResultsList({
    results,
    mode,
}: {
    results: NonNullable<ResultsPanelProps["results"]>;
    mode: "match" | "capture";
}) {
    return (
        <div className="space-y-2">
            {results.map((result, index) => (
                <ResultRow key={index} result={result} mode={mode} />
            ))}
        </div>
    );
}

function ResultRow({
    result,
    mode,
}: {
    result: NonNullable<ResultsPanelProps["results"]>[number];
    mode: "match" | "capture";
}) {

    const borderColor = mode === "capture"
        ? "border-slate-700/50 hover:border-slate-600/50"
        : result.passed
            ? "border-green-500/10 hover:border-green-500/30"
            : "border-red-500/10 hover:border-red-500/30";

    const bgColor = mode === "capture"
        ? "bg-slate-800/20 hover:bg-slate-800/30"
        : result.passed
            ? "bg-green-500/5 hover:bg-green-500/10"
            : "bg-red-500/5 hover:bg-red-500/10";

    return (
        <div className={cn(
            "group p-3 rounded-lg border transition-all duration-200",
            borderColor,
            bgColor
        )}>
            {/* Main row */}
            <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 p-0.5 rounded-full overflow-hidden flex-shrink-0")}>
                    {result.passed && mode === "match" ? (
                        <Check className="h-4 w-4 text-green-400" weight="bold" />
                    ) : mode !== "capture" ? (
                        <X className="h-4 w-4 text-red-400" weight="bold" />
                    ) : null}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                            "truncate font-mono text-sm",
                            result.passed ? "text-slate-200" : "text-slate-300"
                        )}>
                            {result.input}
                        </span>

                        {mode === "match" && (
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0",
                                result.matched
                                    ? "bg-green-500/20 text-green-400 border-green-500/20"
                                    : "bg-slate-700/50 text-slate-500 border-slate-700"
                            )}>
                                {result.matched ? "MATCH" : "NO MATCH"}
                            </span>
                        )}
                    </div>

                    {/* Capture groups (only in capture mode) */}
                    {mode === "capture" && (
                        <div className="mt-2.5">
                            {result.groups && result.groups.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {result.groups.map((group, i) => (
                                        <span
                                            key={i}
                                            className="font-mono text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 inline-flex items-center gap-1.5"
                                        >
                                            {group ?? <span className="text-slate-500 italic">empty</span>}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-500 italic flex items-center gap-1">
                                    <WarningCircle size={12} /> No captures
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
