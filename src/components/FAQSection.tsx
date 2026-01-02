"use client";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon } from "@radix-ui/react-icons";

const faqs = [
  {
    id: 1,
    question: "Why would I use it?",
    answer: `This tool is ideal for developers, data engineers, and data scientists who hates working with regex. It can be used for pattern matching, text extraction, and data/input validation, letting you focus on doing work that's fun without spending much time on regex. While AI-generated regex may not be suitable for highly sensitive applications, it provides a convenient solution for many use cases.`,
  },
  {
    id: 2,
    question: "How does the AI coding agent work?",
    answer: `Our advanced AI-powered regex generator uses an intelligent three-phase approach: (1) Generation - The AI analyzes your natural language description and generates optimized regex patterns. (2) Execution - Each pattern is automatically tested in a secure, isolated sandbox environment using Python and TypeScript to verify syntax correctness and match accuracy. (3) Evaluation - The system evaluates test results in an iterative loop, providing feedback to the AI until the pattern achieves optimal performance. This automated generate-execute-evaluate cycle ensures you receive the most accurate, production-ready regular expression patterns without manual testing or debugging.`,
  },
  {
    id: 3,
    question: "Is my data collected?",
    answer: `Nope, your data is not stored on the server or in any database. Your prompt is sent to Replicate API for processing, but that is the extent of the data handling.`,
  },
];

export default function FAQSection() {
  return (
    <div className="w-full py-6 px-4 text-center text-gray-300">
      <h1 className="text-3xl font-bold mb-8">FAQ</h1>
      <div className="mx-auto w-full my-4 max-w-2xl divide-y divide-white/5 rounded-xl bg-indigo-500/15">
        {faqs.map((faq) => (
          <Disclosure
            as="div"
            key={faq.id}
            className="p-6"
            defaultOpen={faq.id === 1 ? true : false}
          >
            {({ open }) => (
              <>
                <DisclosureButton className="group flex w-full items-center justify-between">
                  <span className="font-medium text-white group-hover:text-white/80">
                    {faq.question}
                  </span>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-white/60 group-hover:text-white/50 transition-transform ${
                      open ? "transform rotate-180" : ""
                    }`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="mt-2  text-white/50 text-left">
                  {faq.answer}
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
