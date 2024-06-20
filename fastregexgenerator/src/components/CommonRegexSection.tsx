import React from "react";
import { CopyInput } from "./CopyInput";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

const CommonRegexSection = () => {
  const commonRegexPatterns = [
    {
      title: "Common Email Pattern",
      description: "Matches most email addresses.",
      value: "^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6})*$",
    },
    {
      title: "HTML Tags",
      description: "Matches HTML tags and its attributes.",
      value: "<\\/?[\\w\\s]*>|<.+[\\W]>",
    },
    {
      title: "Dates dd-MM-YYYY",
      description: "Matches dates in dd-MM-YYYY format.",
      value: "([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))",
    },
    {
      title: "Bitcoin Address",
      description: "Matches Bitcoin addresses",
      value: "([13][a-km-zA-HJ-NP-Z0-9]{26,33})",
    },
  ];

  return (
    <section className="py-10 my-10 text-gray-200 shadow-lg ">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Common Regex Snippets
      </h1>

      {commonRegexPatterns.map((pattern, index) => (
        <div key={index} className={`my-6 pb-5 border-b border-gray-600`}>
          <h2 className="text-xl font-semibold mb-2">{pattern.title}</h2>
          <p className="mb-2">{pattern.description}</p>
          <CopyInput
            value={pattern.value}
            delimiter="/"
            flags="g"
            className=" font-mono"
          />
          <Button
            variant="outline"
            className="flex items-center  hover:text-violet-800 text-neutral-200 border-b-0.5 border-t-0 border-r-0 border-l-0 hover:bg-gray-300 bg-indigo-500  border-gray-500  mt-5"
          >
            Try it out
            <ArrowRightIcon className="ml-1" />
          </Button>
        </div>
      ))}
    </section>
  );
};

export default CommonRegexSection;
