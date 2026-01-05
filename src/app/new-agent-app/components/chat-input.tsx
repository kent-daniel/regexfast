"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { PaperPlaneTiltIcon, StopIcon } from "@phosphor-icons/react";

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onStop: () => void;
  isStreaming: boolean;
  isDisabled: boolean;
  activeToolCalls?: string[];
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  isDisabled,
  activeToolCalls = []
}: ChatInputProps) {
  const [textareaHeight, setTextareaHeight] = useState("auto");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(e);
    setTextareaHeight("auto");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    // Auto-resize the textarea
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    setTextareaHeight(`${e.target.scrollHeight}px`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-[#151B23] border-t border-white/10 flex-shrink-0"
    >
      <div className="relative">
        <Textarea
          disabled={isDisabled}
          placeholder={
            isDisabled
              ? "Please respond to the tool confirmation above..."
              : "Describe what you want to match..."
          }
          className="w-full border border-white/10 bg-[#1C232D] text-slate-100 text-[13px] px-3.5 py-2.5 pr-10 rounded-lg placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px] overflow-hidden resize-none"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ height: textareaHeight }}
        />
        <div className="absolute right-2.5 bottom-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              aria-label="Stop generation"
            >
              <StopIcon size={14} className="text-white" />
            </button>
          ) : (
            <button
              type="submit"
              className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-90 disabled:opacity-30 disabled:bg-none disabled:bg-zinc-600 transition-all"
              disabled={isDisabled || !value.trim()}
              aria-label="Send message"
            >
              <PaperPlaneTiltIcon size={14} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
