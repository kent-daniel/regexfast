"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon, StopIcon, WarningCircle } from "@phosphor-icons/react";

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onStop: () => void;
  isStreaming: boolean;
  isDisabled: boolean;
  isLimitReached?: boolean;
  activeToolCalls?: string[];
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  isDisabled,
  isLimitReached = false,
  activeToolCalls = []
}: ChatInputProps) {
  const [textareaHeight, setTextareaHeight] = useState("auto");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLimitReached) return;
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

  const canSubmit = !isDisabled && !isLimitReached && value.trim().length > 0;

  // Show limit reached banner
  if (isLimitReached) {
    return (
      <div className="p-4 bg-[#151B23] border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <WarningCircle size={20} className="text-red-400 flex-shrink-0" weight="fill" />
          <div className="flex-1">
            <p className="text-sm text-red-300 font-medium">Token limit reached</p>
            <p className="text-xs text-red-400/80">Clear the chat to start a new session.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-[#151B23] border-t border-white/5 flex-shrink-0"
    >
      <div className="relative">
        <Textarea
          disabled={isDisabled}
          placeholder={
            isDisabled
              ? "Please respond to the tool confirmation above..."
              : "Describe what you want to match..."
          }
          className="w-full border border-white/10 bg-[#1C232D] text-slate-50 text-sm px-4 py-3 pr-12 rounded-xl placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[52px] max-h-[180px] overflow-hidden resize-none transition-colors"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ height: textareaHeight }}
        />
        <div className="absolute right-3 bottom-3">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
              aria-label="Stop generation"
            >
              <StopIcon size={14} className="text-white" weight="bold" />
            </button>
          ) : (
            <button
              type="submit"
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 shadow-sm ${
                canSubmit
                  ? "bg-blue-500 hover:bg-blue-600 hover:shadow-md active:scale-95"
                  : "bg-zinc-700 opacity-40 cursor-not-allowed"
              }`}
              disabled={!canSubmit}
              aria-label="Send message"
            >
              <ArrowUpIcon size={16} className="text-white" weight="bold" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
