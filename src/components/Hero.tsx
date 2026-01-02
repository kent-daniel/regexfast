import React from "react";
import { ArrowDownIcon } from "./icons/Icons";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center  py-20 px-6 text-center">
      <h1 className="mb-8 relative z-10 text-3xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-gray-100 to-slate-400 text-center font-sans font-bold text-shadow-glow">
        Generate, Test, and Edit Regular Expression patterns effortlessly with
        AI Agent
      </h1>

      <p className="text-lg md:text-xl mb-4 font-semibold text-center max-w-2xl text-neutral-300">
        AI coding agent that generates, executes, and evaluates regular expressions to deliver the most accurate regex patterns for your needs
      </p>
      <p className="text-md md:text-md mb-8 font-semibold text-center max-w-xl text-neutral-400">
        Our intelligent system automatically tests and validates patterns in a secure sandbox environment, ensuring production-ready results every time
      </p>
      <a
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
      </a>
      <ArrowDownIcon className=" animate-bounce text-neutral-200 size-10 my-3" />
    </div>
  );
};

export default Hero;
