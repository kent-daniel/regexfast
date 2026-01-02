import { content } from "@/content";
import { RegexResultProvider } from "@/components/RegexResultContext";
import RegexEditor from "@/components/RegexEditor";
import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const runtime = 'edge';

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const item = content.find((item) => item.id === params.id);

  return {
    title: item?.title,
    description: item?.description,
  };
}

export default function Page({ params }: { params: { id: string } }) {
  // Extract id from params
  const { id } = params;

  // Find the item in content array based on id
  const item = content.find((item) => item.id === id);

  if (!item) {
    // Handle case where item with specified id is not found
    notFound();
  }

  return (
    <main className="text-center">
      <RegexResultProvider>
        <h2 className="text-2xl font-semibold my-4 text-gray-300 text-center">
          {item.title}
        </h2>
        <p className="text-gray-400 text-center mb-4">{item.description}</p>
        <RegexEditor
          regexPatternProp={item.value}
          inputTextProp={item.inputTextProp}
          flagsProp={item.flags.split("")}
        />
      </RegexResultProvider>
    </main>
  );
}
