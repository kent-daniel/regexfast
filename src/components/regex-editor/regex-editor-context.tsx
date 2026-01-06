"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type RegexEditorInitialData = {
  pattern: string;
  flags: string;
  runtime?: string;
  testResults?: {
    mode?: "match" | "capture";
    details?: Array<{
      input: string;
      passed: boolean;
      expected?: string | (string | null)[];
      actual?: string | (string | null)[] | null;
    }>;
  };
};

type RegexEditorContextValue = {
  /** Most recent regex tool output, used to initialize the editor. */
  latestInitialData: RegexEditorInitialData | null;
  /** Set from tool invocations when a new regex is produced. */
  setLatestInitialData: (data: RegexEditorInitialData) => void;
};

const RegexEditorContext = createContext<RegexEditorContextValue>({
  latestInitialData: null,
  setLatestInitialData: () => {
    // no-op by default so consumers can be used outside provider
  },
});

export function RegexEditorProvider({ children }: { children: ReactNode }) {
  const [latestInitialData, setLatestInitialDataState] = useState<RegexEditorInitialData | null>(
    null
  );

  const setLatestInitialData = useCallback((data: RegexEditorInitialData) => {
    setLatestInitialDataState(data);
  }, []);

  const value = useMemo<RegexEditorContextValue>(
    () => ({
      latestInitialData,
      setLatestInitialData,
    }),
    [latestInitialData, setLatestInitialData]
  );

  return <RegexEditorContext.Provider value={value}>{children}</RegexEditorContext.Provider>;
}

export function useRegexEditorContext() {
  return useContext(RegexEditorContext);
}
