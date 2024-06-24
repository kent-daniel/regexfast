import React from "react";
import { CopyInput } from "./CopyInput";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { content } from "@/content";
import Link from "next/link";

const CommonRegexSection = () => {
  return (
    <section className="py-10 my-10 text-gray-200 shadow-lg ">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Common Regex Snippets
      </h1>

      {content.slice(0, 3).map((item, index) => (
        <div key={index} className={`my-6 pb-5 border-b border-gray-600`}>
          <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
          <p className="mb-2">{item.description}</p>
          <CopyInput
            value={item.value}
            delimiter="/"
            flags={item.flags}
            className=" font-mono"
          />
          <Link href={`/quick-regex-snippets/${item.id}`}>
            <Button
              variant="outline"
              className="flex items-center  hover:text-violet-800 text-neutral-200 border-b-0.5 border-t-0 border-r-0 border-l-0 hover:bg-gray-300 bg-indigo-500  border-gray-500  mt-5"
            >
              Try it out
              <ArrowRightIcon className="ml-1" />
            </Button>
          </Link>
        </div>
      ))}
    </section>
  );
};

export default CommonRegexSection;
