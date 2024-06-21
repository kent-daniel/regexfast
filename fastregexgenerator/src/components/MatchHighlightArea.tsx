"use client";
import { Match } from "@/models";
import React, { useEffect, useRef } from "react";
import { useRegexResult } from "./RegexResultContext";

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
  const { result } = useRegexResult();

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
      )}<span class="bg-indigo-500/75 rounded-sm">${formatHtml(
        matchText
      )}</span>`;
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
    onTextChange(e);
  };

  useEffect(() => {
    highlightMatches(text, matches);
    if (result && contentEditableRef.current) {
      contentEditableRef.current.innerText = result.textForTest;
    }
  }, [text, matches, result]);

  return (
    <div className="text-gray-300">
      <div
        ref={contentEditableRef}
        contentEditable="plaintext-only"
        onInput={handleInput}
        className="w-full px-3 py-2 mb-3 border-none rounded-md text-transparent caret-indigo-300 resize-none focus:outline-none focus:border-indigo-400 whitespace-pre-wrap bg-transparent z-10 overflow-y-scroll break-words"
        onScroll={handleScroll}
        style={{
          minHeight: "250px",
          position: "relative",
          maxHeight: "400px",
        }}
      ></div>
      <div
        ref={highlightedRef}
        className="w-full px-3 py-2 mb-3 border-none border-transparent rounded-md resize-none focus:outline-none whitespace-pre-wrap pointer-events-none absolute top-0 left-0 bg-zinc-800 z-0 overflow-y-scroll break-words"
        style={{
          minHeight: "250px",
          maxHeight: "400px",
        }}
        aria-hidden="true"
      ></div>
    </div>
  );
};
