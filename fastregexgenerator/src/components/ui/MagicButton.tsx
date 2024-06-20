"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormStatus } from "react-dom";

interface MagicButtonProps {
  className?: string;
}

export const MagicButton: React.FC<MagicButtonProps> = ({
  className,
  ...props
}) => {
  const { pending } = useFormStatus();

  const buttonText = pending ? "🍳 Generating ..." : "🔮 Generate";
  return (
    <button
      type="submit"
      className={cn(
        `w-full mt-2 font-semibold font-sans ${pending ? "animate-pulse" : ""}`,
        "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none",
        className
      )}
      {...props}
    >
      <span
        className={`absolute inset-[-1000%] animate-[spin_1s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]`}
      />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 hover:bg-gradient-to-r from-violet-700 to-indigo-900 px-3 py-1 text-lg font-medium text-white backdrop-blur-3xl">
        {buttonText}
      </span>
    </button>
  );
};
