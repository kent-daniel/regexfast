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
      <ArrowDownIcon className=" animate-bounce text-neutral-200 size-10 my-3" />
    </div>
  );
};

export default Hero;
