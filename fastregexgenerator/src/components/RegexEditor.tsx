"use client";
import React, { useState, useRef, useEffect } from "react";
import { Match, getRegexMatches } from "../actions/actions";
import { Roboto_Mono } from "next/font/google";
import { CopyInput } from "./CopyInput";
import RegexEditorOptions from "./RegexEditorOptions";
import { MatchHighlightArea } from "./MatchHighlightArea";

export const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
});

export interface RegexEditorBaseProps {
  regexPattern?: string;
  inputText?: string;
  flags?: string[];
  delimiter?: string;
  language?: string;
  matches?: Match[];
}

const RegexEditor: React.FC<RegexEditorBaseProps> = ({
  regexPattern: initialRegexPattern = "",
  inputText: initialInputText = "",
  flags: initialFlags = ["g"],
  delimiter: initialDelimiter = "/",
  language: initialLanguage = "js",
  matches: initialMatches = [],
}) => {
  const [regexPattern, setRegexPattern] = useState(initialRegexPattern);
  const [inputText, setInputText] = useState(initialInputText);
  const [flags, setFlags] = useState<string[]>(initialFlags);
  const [delimiter, setDelimiter] = useState<string>(initialDelimiter);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [matches, setMatches] = useState<Match[]>(initialMatches);

  useEffect(() => {
    fetchMatches(regexPattern, inputText, flags.join(""));
  }, [regexPattern, inputText, flags, language]);

  const handleRegexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pattern = `${e.target.value}`;
    setRegexPattern(pattern);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    const text = e.target.innerText;
    setInputText(text);
  };

  const fetchMatches = async (pattern: string, text: string, flags: string) => {
    try {
      const matches = await getRegexMatches(pattern, text, flags, language);
      setMatches(matches);
    } catch (error) {
      console.error("Error while fetching matches:", error);
    }
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
        delimiter={delimiter}
        flags={flags.join("")}
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
      <div className="relative max-w-[600px]">
        <MatchHighlightArea
          onTextChange={handleTextChange}
          text={inputText}
          matches={matches}
        />
      </div>
    </div>
  );
};

export default RegexEditor;
