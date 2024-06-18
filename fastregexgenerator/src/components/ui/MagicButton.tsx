import { cn } from "@/lib/utils";
import React from "react";
interface MagicButtonProps {
  text: string;
  className?: string;
}
export const MagicButton: React.FC<MagicButtonProps> = ({
  text,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        `relative inline-flex h-12 overflow-hidden rounded-full p-[3px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50`,
        className
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 hover:bg-gradient-to-r from-violet-600 to-indigo-600  px-3 py-1 text-lg font-medium text-white backdrop-blur-3xl">
        {text}
      </span>
    </button>
  );
};
