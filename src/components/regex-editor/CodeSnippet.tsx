"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CodeSnippetProps {
  pattern: string;
  flags: string; // Combined flags like "gi"
  runtime: "javascript" | "typescript" | "python";
  mode: "match" | "capture";
}

function generateCodeSnippet(
  pattern: string,
  flags: string,
  runtime: CodeSnippetProps["runtime"],
  mode: CodeSnippetProps["mode"]
): string {
  const escapedPattern = pattern.replace(/\\/g, "\\\\");

  if (runtime === "python") {
    // Convert JS flags to Python flags
    const pythonFlags: string[] = [];
    if (flags.includes("i")) pythonFlags.push("re.IGNORECASE");
    if (flags.includes("m")) pythonFlags.push("re.MULTILINE");
    const flagsStr = pythonFlags.length > 0 ? pythonFlags.join(" | ") : "";

    if (mode === "match") {
      const findallCall = flagsStr
        ? `matches = re.findall(pattern, text, ${flagsStr})`
        : `matches = re.findall(pattern, text)`;
      return `import re
pattern = r'${pattern}'
${findallCall}`;
    } else {
      const searchCall = flagsStr
        ? `match = re.search(pattern, text, ${flagsStr})`
        : `match = re.search(pattern, text)`;
      return `import re
pattern = r'${pattern}'
${searchCall}
if match:
    groups = match.groups()`;
    }
  }

  // JavaScript or TypeScript
  const isTS = runtime === "typescript";

  if (mode === "match") {
    if (isTS) {
      return `const regex: RegExp = /${escapedPattern}/${flags};
const matches: RegExpMatchArray | null = text.match(regex);`;
    }
    return `const regex = /${escapedPattern}/${flags};
const matches = text.match(regex);`;
  } else {
    // capture mode
    if (isTS) {
      return `const regex: RegExp = /${escapedPattern}/${flags};
const match: RegExpExecArray | null = regex.exec(text);
if (match) {
  const groups: string[] = match.slice(1);
}`;
    }
    return `const regex = /${escapedPattern}/${flags};
const match = regex.exec(text);
if (match) {
  const groups = match.slice(1);
}`;
  }
}

function getRuntimeLabel(runtime: CodeSnippetProps["runtime"]): string {
  switch (runtime) {
    case "javascript":
      return "JavaScript";
    case "typescript":
      return "TypeScript";
    case "python":
      return "Python";
  }
}

export function CodeSnippet({
  pattern,
  flags,
  runtime,
  mode,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const code = generateCodeSnippet(pattern, flags, runtime, mode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="rounded-lg bg-slate-800/50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Code Snippet
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
            copied
              ? "text-green-400"
              : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          )}
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4" weight="fill" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Runtime label */}
      <div className="mb-2 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-700" />
        <span>{getRuntimeLabel(runtime)}</span>
        <span className="h-px flex-1 bg-slate-700" />
      </div>

      {/* Code block */}
      <div className="overflow-x-auto rounded bg-[#1C232D] p-3">
        <pre className="text-sm leading-relaxed text-slate-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
