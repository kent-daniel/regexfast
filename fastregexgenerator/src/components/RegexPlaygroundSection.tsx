import React from "react";
import { RegexGeneratorForm } from "./RegexGeneratorForm";
import RegexEditor from "./RegexEditor";
import { RegexResultProvider } from "./RegexResultContext";

export const RegexPlaygroundSection = () => {
  return (
    <section className="flex w-full justify-center text-gray-300 font-mono my-5 py-3">
      <RegexResultProvider>
        <div className="basis-1/3 ">
          <RegexGeneratorForm />
        </div>
        <div className="flex basis-2/3">
          <div className="m-5 h-full min-h-[1em] w-0.5 self-stretch bg-gradient-to-tr from-transparent via-indigo-500 to-transparent opacity-75 dark:via-neutral-200"></div>
          <RegexEditor />
        </div>
      </RegexResultProvider>
    </section>
  );
};
