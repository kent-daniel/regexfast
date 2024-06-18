"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JavascriptIcon } from "./icons/Icons";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type definitions
interface Language {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface Flag {
  value: string;
  label: string;
}

interface RegexEditorOptionsProps {
  setFlags: (flags: string[]) => void;
  setLanguage: (language: string) => void;
}

const languages: Language[] = [
  { value: "js", label: "JavaScript", Icon: JavascriptIcon },
];

const flags: Flag[] = [
  {
    value: "g",
    label: "Global - Makes the expression search for all occurrences.",
  },
  {
    value: "m",
    label: "Multiline - Anchors ^ and $ match the start and end of each line.",
  },
  {
    value: "i",
    label: "Case Insensitive - Makes the expression case insensitive.",
  },
  { value: "s", label: "Dotall - Allows . to match newline characters." },
  {
    value: "u",
    label: "Unicode - Treats the pattern as a sequence of Unicode code points.",
  },
];

const RegexEditorOptions: React.FC<RegexEditorOptionsProps> = ({
  setFlags,
  setLanguage,
}) => {
  return (
    <div className="flex justify-end items-center">
      <ToggleGroup
        type="multiple"
        className="w-[180px] flex p-1 mx-2"
        defaultValue={["g"]}
        onValueChange={(values) => setFlags(values)}
      >
        <TooltipProvider>
          {flags.map((flag, index) => (
            <Tooltip key={flag.value}>
              <TooltipTrigger>
                <ToggleGroupItem
                  value={flag.value}
                  aria-label={`Toggle ${flag.label.toLowerCase()}`}
                  className={`bg-gray-400 ${
                    index === 0 ? "rounded-l rounded-r-none border-r" : ""
                  } ${
                    index === flags.length - 1
                      ? "rounded-r rounded-l-none border-none"
                      : ""
                  } ${
                    index !== 0 && index !== flags.length - 1
                      ? "rounded-none border-r border-gray-300"
                      : ""
                  }`}
                >
                  {flag.value}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>{flag.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </ToggleGroup>
      <Select onValueChange={setLanguage} value={"js"}>
        <SelectTrigger className="w-[160px] text-gray-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {languages.map(({ value, label, Icon }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center">
                  <Icon className="mr-1" />
                  <p>{label}</p>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RegexEditorOptions;
