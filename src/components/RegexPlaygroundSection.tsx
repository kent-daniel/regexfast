"use client";

import React from "react";
import { PlaygroundChat } from "./PlaygroundChat";
import { RegexEditorCard } from "./regex-editor";
import { RegexEditorProvider, useRegexEditorContext } from "./regex-editor/regex-editor-context";

function EditorPanel() {
  const { latestInitialData } = useRegexEditorContext();
  
  return (
    <RegexEditorCard
      key={latestInitialData?.pattern} // Re-mount when pattern changes to reset state
      initialData={latestInitialData ?? undefined}
    />
  );
}

export const RegexPlaygroundSection = () => {
  return (
    <section className="w-full px-6 py-8">
      <div className="flex gap-8 h-[800px] bg-[#08090D] rounded-2xl p-6 w-full">
        <RegexEditorProvider>
          {/* Chat Panel - Fixed width with height limit */}
          <div className="w-[580px] flex-shrink-0 h-full">
            <PlaygroundChat />
          </div>
          
          {/* Divider */}
          <div className="w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent flex-shrink-0" />
          
          {/* Editor Panel - Takes all remaining space */}
          <div className="flex-1 min-w-0 overflow-auto">
            <EditorPanel />
          </div>
        </RegexEditorProvider>
      </div>
    </section>
  );
};
