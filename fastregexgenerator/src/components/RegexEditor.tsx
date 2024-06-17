"use client";
import React, { useState, useRef, useEffect } from "react";
import { Match, getRegexMatches } from "../actions/actions";

const RegexEditor: React.FC = () => {
  const [regexPattern, setRegexPattern] = useState("");
  const [inputText, setInputText] = useState("");

  const contentEditableRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMatchesAndHighlight(regexPattern, inputText);
  }, [regexPattern, inputText]);

  const handleRegexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pattern = e.target.value;
    setRegexPattern(pattern);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    const text = e.target.innerText;
    setInputText(text);
  };

  const fetchMatchesAndHighlight = async (pattern: string, text: string) => {
    try {
      if (text.length === 0 || pattern.length === 0) {
        if (highlightedRef.current) {
          highlightedRef.current.innerHTML = escapeHtml(text);
        }
        return;
      }

      const matches = await getRegexMatches(pattern, text);
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

      html += `${escapeHtml(
        beforeMatch
      )}<span class="bg-yellow-200">${escapeHtml(matchText)}</span>`;
      lastIndex = index + matchText.length;
    });

    html += escapeHtml(text.substring(lastIndex));
    return html;
  };

  const escapeHtml = (unsafe: string) => {
    return unsafe.replace(/[&<"']/g, (match) => {
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
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h2 className="text-lg font-semibold mb-4">Regex Editor</h2>
      <label
        htmlFor="regex"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        Regex Pattern:
      </label>
      <input
        type="text"
        id="regex"
        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
        placeholder="regex pattern"
        value={regexPattern}
        onChange={handleRegexChange}
      />
      <label
        htmlFor="text"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        Text to Match:
      </label>
      <div className="relative w-full">
        <div
          ref={contentEditableRef}
          contentEditable
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent inserting new lines
            }
          }}
          onInput={handleTextChange}
          className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:border-blue-500 whitespace-pre-wrap bg-transparent z-10 overflow-none"
          style={{
            minHeight: "100px",
            position: "relative",
            maxHeight: "400px",
          }}
        ></div>
        <div
          ref={highlightedRef}
          className="w-full px-3 py-2 mb-3 border border-transparent rounded-md resize-none focus:outline-none whitespace-pre-wrap pointer-events-none absolute top-0 left-0 bg-white z-0"
          style={{ minHeight: "100px", maxHeight: "400px", overflow: "hidden" }}
          aria-hidden="true"
        ></div>
      </div>
    </div>
  );
};

export default RegexEditor;

// TODO:
// Highlight in text
// do UX like
// generate me regex to find / check content inside html tags
// in :
// <html> abc <a>ttt</a> <body><p>lorem ipsum</p></body></html>
// it should match:
// abc ttt lorem ipsum
// it should not match:
// <p>lorem ipsum</p> abc <a>ttt</a> <body><p>lorem ipsum</p></body>

// clear button for both text to match & regex pattern
// font to be more code like
// copy pastable fields
// limit for textfield chars
// excecute regex -> if null -> feedback to ai -> keep going for 3 times , if none , output the last one , warn user
// read how to boost SEO in nextjs
// setup server & deploy to EC2 (ask lasith)
// section for common regexes for SEO
// setup posthog , sentry
// darkmode
// setup domain , hosting
// launch & GTM 🚀
// setup google ads (later)
// support for other languages (later)
// explain feature (later)
