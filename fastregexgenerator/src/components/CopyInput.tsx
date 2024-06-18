"use client";
import React, { useState } from "react";
import { CopyIcon, CopyIconSuccess } from "./icons/Icons";

interface CopyInputProps {
  value: string;
  delimiter: string;
  flags: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CopyInput: React.FC<CopyInputProps> = ({
  value,
  placeholder,
  delimiter,
  flags,
  onChange,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(`${delimiter}${value}${delimiter}${flags}`)
      .then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        },
        (err) => {
          console.error("Failed to copy to clipboard", err);
        }
      );
  };
  return (
    <div className="relative flex items-center w-full mb-2">
      <div className="bg-gray-100 rounded-l-md flex items-center grow">
        <div className="text-lg px-2 text-gray-500">
          <span>{delimiter}</span>
        </div>
        <input
          type="text"
          className={`flex-grow h-[40px] py-2 border-none bg-transparent focus:outline-none text-gray-800`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <div className="text-lg px-2 text-gray-500">
          <span>
            {delimiter}
            {flags || ""}
          </span>
        </div>
      </div>
      <button
        onClick={copyToClipboard}
        className={`text-xs w-[100px] h-[40px] border-none rounded-r-md rounded-l-none px-3 py-2 text-white ${
          copied ? `bg-indigo-500` : `bg-zinc-500`
        } focus:outline-none`}
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
