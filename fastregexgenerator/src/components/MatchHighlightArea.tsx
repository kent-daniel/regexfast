"use client";
import { Match } from "@/actions/actions";
import React, { useEffect, useMemo, useRef } from "react";

interface MatchHighlightAreaProps {
  matches: Match[];
  text: string;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MatchHighlightArea: React.FC<MatchHighlightAreaProps> = ({
  onTextChange,
  text,
  matches,
}) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  const highlightMatches = (text: string, matches: Match[]): void => {
    if ((text.length === 0 || matches.length === 0) && highlightedRef.current) {
      highlightedRef.current.innerHTML = formatHtml(text);
      return;
    }
    const highlightedHtml = generateHighlightedHtml(text, matches);
    if (highlightedRef.current) {
      highlightedRef.current.innerHTML = highlightedHtml;
    }
  };

  const handleScroll = () => {
    if (highlightedRef.current && contentEditableRef.current) {
      highlightedRef.current.scrollTop = contentEditableRef.current.scrollTop;
    }
  };

  const generateHighlightedHtml = (text: string, matches: Match[]): string => {
    let html = "";
    let lastIndex = 0;
    matches.forEach((match) => {
      const { index, text: matchText } = match;
      const beforeMatch = text.substring(lastIndex, index);

      html += `${formatHtml(
        beforeMatch
      )}<span class="bg-indigo-300 rounded-sm">${formatHtml(matchText)}</span>`;
      lastIndex = index + matchText.length;
    });

    html += formatHtml(text.substring(lastIndex));
    return html;
  };

  const formatHtml = (unsafe: string): string => {
    const cleanHtml = unsafe.replace(/[&<"']/g, (match) => {
      switch (match) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#039;";
        default:
          return match;
      }
    });
    return cleanHtml;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const CHARACTER_LIMIT = 1000;
    // if (contentEditableRef.current) {
    //   const currentText = contentEditableRef.current.innerText;
    //   if (currentText.length > CHARACTER_LIMIT) {
    //     contentEditableRef.current.innerText = currentText.substring(
    //       0,
    //       CHARACTER_LIMIT
    //     );
    //     e.preventDefault();
    //     return;
    //   }
    // }
    onTextChange(e);
  };

  useEffect(() => {
    highlightMatches(text, matches);
  }, [text, matches]);

  return (
    <>
      <div
        ref={contentEditableRef}
        contentEditable="plaintext-only"
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Prevent inserting new lines
          }
        }}
        onInput={handleInput}
        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:border-blue-500 whitespace-pre-wrap bg-transparent z-10 overflow-none"
        onScroll={handleScroll}
        style={{
          minHeight: "300px",
          position: "relative",
          maxHeight: "400px",
        }}
      ></div>
      <div
        ref={highlightedRef}
        className="w-full px-3 py-2 mb-3 border border-transparent rounded-md resize-none focus:outline-none whitespace-pre-wrap pointer-events-none absolute top-0 left-0 bg-white z-0"
        style={{
          minHeight: "300px",
          maxHeight: "400px",
        }}
        aria-hidden="true"
      ></div>
    </>
  );
};
