"use client";
import { RegexResultDTO } from "@/models";
import React, { useContext, useMemo, useState } from "react";
import { createContext } from "react";

export const RegexResultContext = createContext<RegexResultContextType | null>(
  null
);
interface RegexResultContextType {
  result: RegexResultDTO | null;
  setResult: (result: RegexResultDTO | null) => void;
}

export function RegexResultProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [result, changeResult] = useState<RegexResultDTO | null>(null);

  const setResult = (newResult: RegexResultDTO | null) => {
    changeResult(newResult);
  };

  return (
    <RegexResultContext.Provider value={{ result, setResult }}>
      {children}
    </RegexResultContext.Provider>
  );
}

export const useRegexResult = () => {
  const value = useContext(RegexResultContext);
  if (!value) {
    throw new Error("💣 useRegexResult hook used without RegexResultContext");
  }

  return value;
};
