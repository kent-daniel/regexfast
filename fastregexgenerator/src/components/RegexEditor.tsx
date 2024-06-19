"use client";
import React, { useState, useEffect } from "react";
import { getRegexMatches } from "../actions/actions";
import { CopyInput } from "./CopyInput";
import RegexEditorOptions from "./RegexEditorOptions";
import { MatchHighlightArea } from "./MatchHighlightArea";
import { Match, RegexResultDTO } from "@/models";

export interface RegexEditorBaseProps {
  regexPatternProp?: string;
  inputTextProp?: string;
  flagsProp?: string[];
  delimiterProp?: string;
  languageProp?: string;
  matchesProp?: Match[];
}

var data: RegexResultDTO | null = {
  pattern: "\\d+",
  flags: ["g", "i"],
  textForTest: "123",
  success: true,
};

const RegexEditor: React.FC<RegexEditorBaseProps> = ({
  regexPatternProp = "",
  inputTextProp = "",
  flagsProp = ["g"],
  delimiterProp = "/",
  languageProp = "js",
  matchesProp = [],
}) => {
  const [regexPattern, setRegexPattern] = useState<string>(regexPatternProp);
  const [inputText, setInputText] = useState<string>(inputTextProp);
  const [flags, setFlags] = useState<string[]>(flagsProp);
  const [delimiter, setDelimiter] = useState<string>(delimiterProp);
  const [language, setLanguage] = useState<string>(languageProp);
  const [matches, setMatches] = useState<Match[]>(matchesProp);

  useEffect(() => {
    // Update state when props change
    if (data) {
      console.log("called");
      setRegexPattern(data.pattern);
      setInputText(data.textForTest);
      setFlags(data.flags);
    }

    return () => {
      data = null;
    };
  }, []);

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

  return (
    <div className={`px-2 w-full`}>
      <h2 className="text-gray-300 mb-10  border-gray-600 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">
        Regex Editor
      </h2>
      <div className="flex items-center justify-between mb-3">
        <label
          htmlFor="text"
          className="block text-md font-medium text-gray-300"
        >
          Regex Options:
        </label>
        <RegexEditorOptions
          setFlags={setFlags}
          defaultFlags={flags}
          setLanguage={setLanguage}
        />
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
      <div className="relative max-w-[650px]">
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
