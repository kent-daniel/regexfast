"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import siteLogo from "../../public/siteLogo.jpeg";
import posthog from "posthog-js";

const navLinks = [
  {
    href: "/",
    label: "Generator",
  },
  {
    href: "/quick-regex-snippets",
    label: "Regex snippets",
  },
  posthog.isFeatureEnabled("suggest_tab")
    ? {
        href: "/suggest",
        label: `Suggest 💡`,
      }
    : null,
];

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="flex justify-between items-center py-4 px-2 border-b border-neutral-700">
      <Link href={"/"} className="flex items-center">
        <Image
          src={siteLogo}
          alt="Magic Regex Generator Logo"
          className="w-[40px] h-[40px] rounded-md mr-2"
          width={40}
          height={40}
        />
        <p className="text-gray-200 text-xl font-bold">MagicRegexGenerator</p>
      </Link>

      <nav>
        <ul className="flex gap-x-5 justify-between text-md font-semibold">
          {navLinks.map((link) =>
            link ? (
              <li
                key={link.label}
                className={`hover:border-b ${
                  pathname === link.href ? "text-gray-200" : "text-zinc-400"
                }`}
              >
                <Link href={link.href}>{link.label}</Link>
              </li>
            ) : null
          )}
        </ul>
      </nav>
    </header>
  );
};
