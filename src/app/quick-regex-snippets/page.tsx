import RegexEditor from "@/components/RegexEditor";
import { RegexResultProvider } from "@/components/RegexResultContext";
import { content } from "@/content";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Quick Snippets",
  description: "Try out quick regex snippets for common patterns. such as email validation, URL matching, and more.",
};

export default function Page() {
  return (
    <main className="text-left overflow-y-scroll">
      <RegexResultProvider>
        {content.map((item, index) => (
          <div key={index} className="my-6 pb-5 border-b border-gray-600">
            <h2 className="text-xl font-semibold mb-2 text-gray-300 text-center">
              {item.title}
            </h2>
            <p className="text-gray-400 text-center">{item.description}</p>
            <RegexEditor
              regexPatternProp={item.value}
              inputTextProp={item.inputTextProp}
            />
          </div>
        ))}
      </RegexResultProvider>
    </main>
  );
}
