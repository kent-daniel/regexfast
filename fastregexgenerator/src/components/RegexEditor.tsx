"use client";
import React, { useState, useRef, useEffect } from "react";
import { Match, getRegexMatches } from "../actions/actions";
import { Roboto_Mono } from "next/font/google";
import { CopyInput } from "./CopyInput";
import RegexEditorOptions from "./RegexEditorOptions";
export const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
});

const RegexEditor: React.FC = () => {
  const [regexPattern, setRegexPattern] = useState("");
  const [inputText, setInputText] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [language, setLanguage] = useState<string>("");

  const contentEditableRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMatchesAndHighlight(regexPattern, inputText);
  }, [regexPattern, inputText, flags]);

  const handleRegexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pattern = `${e.target.value}`;
    setRegexPattern(pattern);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    const text = e.target.innerText;
    setInputText(text);
  };

  const handleScroll = () => {
    if (highlightedRef.current && contentEditableRef.current) {
      highlightedRef.current.scrollTop = contentEditableRef.current.scrollTop;
    }
  };

  const fetchMatchesAndHighlight = async (pattern: string, text: string) => {
    try {
      if (text.length === 0 || pattern.length === 0) {
        if (highlightedRef.current) {
          highlightedRef.current.innerHTML = formatHtml(text);
        }
        return;
      }

      const matches = await getRegexMatches(pattern, text, flags.join(""));
      highlightMatches(text, matches);
    } catch (error) {
      console.error("Error while fetching matches:", error);
    }
  };

  const highlightMatches = (text: string, matches: Match[]) => {
    const highlightedHtml = generateHighlightedHtml(text, matches);
    if (highlightedRef.current) {
      highlightedRef.current.innerHTML = highlightedHtml;
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
      )}<span class="bg-blue-300 rounded-sm">${formatHtml(matchText)}</span>`;
      lastIndex = index + matchText.length;
    });

    html += formatHtml(text.substring(lastIndex));
    return html;
  };

  const formatHtml = (unsafe: string) => {
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

  // TODO: newline when wrap text when reached maxwidth
  return (
    <div className={`p-4 w-full ${roboto_mono.className}`}>
      <h2 className="text-gray-300 mb-10 border-gray-600 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Regex Editor
      </h2>

      <div className="flex items-center justify-between mb-3">
        <label
          htmlFor="text"
          className="block text-md font-medium text-gray-300"
        >
          Regex Options:
        </label>
        <RegexEditorOptions setFlags={setFlags} setLanguage={setLanguage} />
      </div>

      <CopyInput
        delimiter="\"
        option={flags.join("")}
        placeholder="Regex pattern"
        value={regexPattern}
        onChange={handleRegexChange}
      />
      <label
        htmlFor="text"
        className="block mb-2 text-md font-medium text-gray-300"
      >
        Text Matches:
      </label>
      <div className="relative w-full">
        <div
          ref={contentEditableRef}
          contentEditable="plaintext-only"
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent inserting new lines
            }
          }}
          onInput={handleTextChange}
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
      </div>
    </div>
  );
};

export default RegexEditor;
