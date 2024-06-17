"use client";
import React, { useState } from "react";
import { CopyIcon, CopyIconSuccess } from "./icons/CopyIcon";

interface CopyInputProps {
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  width?: string; // Optional width prop
}

export const CopyInput: React.FC<CopyInputProps> = ({
  value,
  placeholder,
  onChange,
  width = "100%",
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      (err) => {
        console.error("Failed to copy to clipboard", err);
      }
    );
  };
  // TODO: set delimiter & regex flags
  return (
    <div className="relative flex items-center justify-between w-full">
      <input
        type="text"
        className="flex-grow px-3 py-2 mb-3 border-none focus:outline-none focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        onClick={copyToClipboard}
        className={`text-xs w-[100px] text-base px-3 py-2 mb-3 ml-3 text-white transition-transform ${
          copied ? `bg-blue-500 scale-110` : `bg-zinc-500`
        } rounded-md focus:outline-none`}
      >
        {copied ? (
          <div className=" flex items-center justify-center">
            <CopyIconSuccess className="size-5" />
            <span className="ml-1">Copied!</span>
          </div>
        ) : (
          <div className=" flex items-center justify-center">
            <CopyIcon className="size-5" />
            <span className="ml-1">Copy</span>
          </div>
        )}
      </button>
    </div>
  );
};
