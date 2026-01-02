"use client";
import React, { useState, useEffect } from "react";
import { getRegexMatches } from "../actions/actions";
import { CopyInput } from "./CopyInput";
import RegexEditorOptions from "./RegexEditorOptions";
import { MatchHighlightArea } from "./MatchHighlightArea";
import { Match, RegexResultDTO } from "@/models";
import { useRegexResult } from "./RegexResultContext";

export interface RegexEditorBaseProps {
  regexPatternProp?: string;
  inputTextProp?: string;
  flagsProp?: string[];
  delimiterProp?: string;
  languageProp?: string;
  matchesProp?: Match[];
}

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
  const [timeSpent, setTimeSpent] = useState<string>();
  const [serverStatus, setServerStatus] = useState<string>();

  const { result, setResult } = useRegexResult();

  useEffect(() => {
    if (result) {
      setRegexPattern(result.pattern);
      setInputText(result.textForTest);
      setFlags(result.flags);
    }
    fetchMatches(regexPattern, inputText, flags.join(""));
    return () => {
      setResult(null);
    };
  }, [regexPattern, inputText, flags, language, result]);

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
      const { matches, timeSpent, status } = await getRegexMatches(
        pattern,
        text,
        flags,
        language
      );
      setMatches(matches);
      setTimeSpent(timeSpent);
      setServerStatus(status);
    } catch (error) {
      console.error("Error while fetching matches:", error);
    }
  };

  return (
    <div className={`px-2 w-full font-mono`}>
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
      <div className="flex items-center justify-between my-3">
        <label
          htmlFor="text"
          className="block text-md font-medium text-gray-300"
        >
          Text Matches:
        </label>
        <div
          className={`text-sm ${
            serverStatus === "invalid"
              ? "text-yellow-500"
              : serverStatus === "success"
              ? "text-green-500"
              : serverStatus === "error"
              ? "text-red-500"
              : "text-gray-300"
          }`}
        >
          {`${matches.length} matches • ${timeSpent}ms • ${serverStatus}`}
        </div>
      </div>

      <div className="relative min-w-[650px]">
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
