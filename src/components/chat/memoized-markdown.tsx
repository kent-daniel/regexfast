"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

// Custom code block component with syntax highlighting
function CodeBlock({
  inline,
  className,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  if (!inline && (match || codeString.includes("\n"))) {
    return (
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: "0.5em 0",
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    );
  }

  return (
    <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm" {...props}>
      {children}
    </code>
  );
}

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    return (
      <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeBlock as any,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";