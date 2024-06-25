import React from "react";
import { ArrowDownIcon } from "./icons/Icons";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center  py-20 px-6 text-center">
      <h1 className="mb-8 relative z-10 text-3xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-gray-100 to-slate-400 text-center font-sans font-bold text-shadow-glow">
        Generate, Test, and Edit Regular Expression patterns effortlessly with
        AI
      </h1>

      <p className="text-lg md:text-xl mb-4 font-semibold text-center max-w-2xl text-neutral-300">
        Describe what you want to match in English. Get the AI-generated regex
        in the editor to test and refine
      </p>
      <p className="text-md md:text-md mb-8 font-semibold text-center max-w-xl text-neutral-400">
        Regex sucks. Simplify it with AI, so you can focus on meaningful work.
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
