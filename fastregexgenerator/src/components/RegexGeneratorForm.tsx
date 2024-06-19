"use client";
import React, { useRef, useState } from "react";
import { MagicButton } from "./ui/MagicButton";
import { Textarea } from "./ui/textarea";
import { submitForm } from "@/actions/actions";
import { RegexResultDTO } from "@/models";

interface RegexGeneratorFormProps {
  setResult: (result: RegexResultDTO) => void;
}
export const RegexGeneratorForm = ({ setResult }: RegexGeneratorFormProps) => {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <>
      <h1 className="text-2xl font-bold mb-5 border-gray-600 pb-2 border-b tracking-tight">
        Regex Generator
      </h1>
      <form
        ref={ref}
        action={async (formData) => {
          const result = await submitForm(formData);
          setResult(result);
          ref.current?.reset();
        }}
        className="py-3"
      >
        <div className="mb-4">
          <label className="block text-sm  mb-3">
            I want to generate regex for
          </label>
          <Textarea
            required
            name="description"
            placeholder="Matching phone numbers"
            className="text-sm max-h-12 bg-zinc-800"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm  mb-3">
            It should match strings like
          </label>
          <Textarea
            required
            name="shouldMatch"
            placeholder="+619330489795 ,6089534304"
            className="text-sm max-h-12 bg-zinc-800"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm  mb-3">
            It should NOT match strings like
          </label>
          <Textarea
            name="shouldNotMatch"
            placeholder="789 ,12345 ,1-1-1"
            className="text-sm max-h-12 bg-zinc-800"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm  mb-3">More info</label>
          <Textarea
            name="info"
            placeholder="Match a phone number with - and/or country code."
            className="text-sm max-h-12 bg-zinc-800"
          />
        </div>

        <MagicButton />
      </form>
    </>
  );
};
