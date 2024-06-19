"use client";
import React, { useState } from "react";
import { RegexGeneratorForm } from "./RegexGeneratorForm";
import RegexEditor from "./RegexEditor";
import { RegexResultDTO } from "@/models";

export const RegexPlaygroundSection = () => {
  const [regexResult, setRegexResult] = useState<RegexResultDTO>();
  const updateRegexResult = () => {
    setRegexResult({
      pattern: "\\w+",
      flags: ["g", "i"],
      textForTest: "Hello World",
      success: true,
    });
  };

  return (
    <section className="flex w-full justify-center text-gray-300 font-mono my-5 py-3">
      <div className="basis-1/3 ">
        <RegexGeneratorForm setResult={setRegexResult} />
      </div>
      <div className="flex basis-2/3">
        <div className="m-5 h-full min-h-[1em] w-0.5 self-stretch bg-gradient-to-tr from-transparent via-indigo-500 to-transparent opacity-75 dark:via-neutral-200"></div>
        <button onClick={(e) => updateRegexResult()}>A button</button>
        <RegexEditor
          regexPatternProp={regexResult?.pattern}
          flagsProp={regexResult?.flags}
          inputTextProp={regexResult?.textForTest}
        />
      </div>
    </section>
  );
};
