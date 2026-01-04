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
      className="p-4 bg-white absolute bottom-0 left-0 right-0 z-10 dark:bg-neutral-950"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Textarea
            disabled={isDisabled}
            placeholder={
              isDisabled
                ? "Please respond to the tool confirmation above..."
                : "Send a message..."
            }
            className="flex w-full border border-neutral-200 dark:border-neutral-700 px-3 py-2 ring-offset-background placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl text-base! pb-10 dark:bg-neutral-900"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={2}
            style={{ height: textareaHeight }}
          />
          <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                aria-label={
                  activeToolCalls.length > 0
                    ? `Stop generation (tools: ${activeToolCalls.join(", ")})`
                    : "Stop generation"
                }
              >
                <StopIcon size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                disabled={isDisabled || !value.trim()}
                aria-label="Send message"
              >
                <PaperPlaneTiltIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
