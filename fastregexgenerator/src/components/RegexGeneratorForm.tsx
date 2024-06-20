"use client";
import React, { useRef } from "react";
import { MagicButton } from "./ui/MagicButton";
import { Textarea } from "./ui/textarea";
import { submitForm } from "@/actions/actions";
import { useRegexResult } from "./RegexResultContext";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const RegexGeneratorForm = () => {
  const ref = useRef<HTMLFormElement>(null);
  const { setResult } = useRegexResult();
  return (
    <>
      <h1 className="text-2xl font-bold mb-5 border-gray-600 pb-2 border-b tracking-tight">
        Regex Generator
      </h1>
      <form
        ref={ref}
        action={async (formData) => {
          const result = await submitForm(formData);
          setResult(result);
        }}
        className="py-3"
      >
        <TooltipProvider>
          <div className="mb-4">
            <label className="block text-sm  mb-3">
              I want to generate regex for
            </label>
            <Textarea
              required
              name="description"
              placeholder="Matching phone numbers"
              className="text-sm max-h-12 bg-zinc-800"
            />
          </div>
          <div className="mb-4">
            <div className="flex items-center  justify-between mb-3">
              <label className="block text-sm">
                It should match strings like
              </label>
              <Tooltip key={"shouldMatchTooltip"}>
                <TooltipTrigger>
                  <InfoCircledIcon />
                </TooltipTrigger>
                <TooltipContent>
                  Give 2-3 examples (comma seperated) for best results
                </TooltipContent>
              </Tooltip>
            </div>

            <Textarea
              required
              name="shouldMatch"
              placeholder="+619330489795 ,6089534304"
              className="text-sm max-h-12 bg-zinc-800"
            />
          </div>
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm  ">
                It should NOT match strings like
              </label>
              <Tooltip key={"shouldNotMatchTooltip"}>
                <TooltipTrigger>
                  <InfoCircledIcon />
                </TooltipTrigger>
                <TooltipContent>
                  Give 2-3 examples (comma seperated) for best results
                </TooltipContent>
              </Tooltip>
            </div>

            <Textarea
              name="shouldNotMatch"
              placeholder="789 ,12345 ,1-1-1"
              className="text-sm max-h-12 bg-zinc-800"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm  mb-3">More info</label>
            <Textarea
              name="info"
              placeholder="Match a phone number with - and/or country code."
              className="text-sm max-h-12 bg-zinc-800"
            />
          </div>
        </TooltipProvider>

        <MagicButton />
      </form>
    </>
  );
};
