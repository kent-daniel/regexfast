import { useState } from "react";
import { Check, X, CaretDown, CaretUp, Copy, CheckCircle } from "@phosphor-icons/react";

/**
 * Test result detail for display
 */
interface TestDetail {
    input: string;
    passed: boolean;
    expected?: string | (string | null)[];
    actual?: string | (string | null)[] | null;
}

/**
 * Test results summary
 */
interface TestResultsSummary {
    passed: number;
    failed: number;
    total: number;
    mode?: "match" | "capture";
    details?: TestDetail[];
}

/**
 * Props for RegexResultCard
 */
interface RegexResultCardProps {
    pattern: string;
    flags: string;
    success: boolean;
    iterations: number;
    runtime: string;
    testResults?: TestResultsSummary;
    example?: string;
}

/**
 * A collapsible card showing regex generation results with test details
 */
export function RegexResultCard({
    pattern,
    flags,
    success,
    iterations,
    runtime,
    testResults,
    example,
}: RegexResultCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const fullRegex = `/${pattern}/${flags}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(fullRegex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const borderColor = success ? "border-l-green-500" : "border-l-amber-500";
    const bgColor = success ? "bg-green-500/5" : "bg-amber-500/5";

    return (
        <div
            className={`my-2 rounded-lg ${bgColor} border-l-2 ${borderColor} overflow-hidden transition-all duration-200`}
        >
            {/* Header - always visible */}
            <div className="flex items-center gap-2 px-3 py-2">
                {success ? (
                    <Check size={16} className="text-green-500 shrink-0" weight="bold" />
                ) : (
                    <X size={16} className="text-amber-500 shrink-0" weight="bold" />
                )}

                <code className="text-sm font-mono text-slate-200 bg-slate-800/50 px-2 py-1 rounded block overflow-x-auto whitespace-nowrap custom-scrollbar">
                    {fullRegex}
                </code>

                {/* Copy button */}
                <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title="Copy regex"
                >
                    {copied ? (
                        <CheckCircle size={14} className="text-green-400" />
                    ) : (
                        <Copy size={14} className="text-slate-400" />
                    )}
                </button>

                {/* Test summary badge */}
                {testResults && (
                    <span
                        className={`text-xs px-1.5 py-0.5 rounded ${testResults.failed === 0
                                ? "bg-green-500/20 text-green-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                    >
                        {testResults.passed}/{testResults.total}
                    </span>
                )}

                {/* Expand/collapse button */}
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
                >
                    {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                </button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-3 animate-[expand_0.2s_ease-out]">
                    {/* Metadata row */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                            Runtime: <span className="text-slate-400">{runtime}</span>
                        </span>
                        <span>
                            Iterations: <span className="text-slate-400">{iterations}</span>
                        </span>
                    </div>

                    {/* Test results breakdown */}
                    {testResults?.details && testResults.details.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-xs text-slate-500 font-medium">
                                Test Results
                            </span>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {testResults.details.map((detail, i) => (
                                    <TestCaseRow key={`test-${detail.input.slice(0, 10)}-${i}`} detail={detail} mode={testResults.mode} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Code example */}
                    {example && (
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500 font-medium">
                                Usage Example
                            </span>
                            <pre className="text-xs bg-[#1C232D] p-2 rounded overflow-x-auto text-slate-300">
                                {example}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Single test case row
 */
function TestCaseRow({
    detail,
    mode,
}: {
    detail: TestDetail;
    mode?: "match" | "capture";
}) {
    const icon = detail.passed ? (
        <Check size={12} className="text-green-500" weight="bold" />
    ) : (
        <X size={12} className="text-red-500" weight="bold" />
    );

    // Truncate long inputs
    const displayInput =
        detail.input.length > 40
            ? `${detail.input.slice(0, 40)}…`
            : detail.input;

    return (
        <div
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${detail.passed ? "bg-green-500/5" : "bg-red-500/10"
                }`}
        >
            {icon}
            <code className="text-slate-300 font-mono truncate flex-1">
                "{displayInput}"
            </code>
            {!detail.passed && mode === "match" && (
                <span className="text-slate-500 text-[10px]">
                    expected {detail.expected}, got {detail.actual}
                </span>
            )}
            {!detail.passed && mode === "capture" && (
                <span className="text-slate-500 text-[10px] truncate max-w-[150px]">
                    got {JSON.stringify(detail.actual)}
                </span>
            )}
        </div>
    );
}
