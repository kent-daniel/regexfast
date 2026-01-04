"use client";

import { SparkleIcon } from "@phosphor-icons/react";

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm mx-auto px-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 inline-flex">
          <SparkleIcon size={32} className="text-white" weight="fill" />
        </div>
        <h3 className="font-semibold text-xl">How can I help you today?</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          I can help with code, answer questions, and assist with various tasks.
        </p>
      </div>
    </div>
  );
}
