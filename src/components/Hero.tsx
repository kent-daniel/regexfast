import React from "react";
import { ArrowDownIcon } from "./icons/Icons";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 md:py-32 px-6 text-center">
      <h1 className="mb-6 relative z-10 text-4xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-100 to-slate-400 text-center font-sans font-bold tracking-tight leading-tight">
        Generate and Test Regex with AI Agent
      </h1>

      <p className="text-xl md:text-2xl mb-3 font-medium text-center max-w-3xl text-neutral-200 leading-relaxed">
        AI coding agent that generates, executes, and evaluates to deliver accurate regex patterns
      </p>
      <p className="text-base md:text-lg mb-10 font-normal text-center max-w-2xl text-neutral-400 leading-relaxed">
        Automatically tested in a secure sandbox for reliable results
      </p>
      {/* <a
        href="https://www.producthunt.com/posts/magic-regex-generator?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-magic&#0045;regex&#0045;generator"
        target="_blank"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=465742&theme=light"
          alt="Magic&#0032;Regex&#0032;Generator - Generate&#0032;and&#0032;test&#0032;regex&#0032;with&#0032;AI | Product Hunt"
          className="w-[250px] h-[54px] my-3"
          width="250"
          height="54"
        />
      </a> */}
      <ArrowDownIcon className=" animate-bounce text-neutral-200 size-10 my-3" />
    </div>
  );
};

export default Hero;
