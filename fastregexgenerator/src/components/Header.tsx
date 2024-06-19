"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import siteLogo from "../../public/siteLogo.jpeg";

const navLinks = [
  {
    href: "/",
    label: "Generator",
  },
  {
    href: "/cheatsheets",
    label: "Regex cheatsheets",
  },
  {
    href: "/create-post",
    label: `Suggest 💡`,
  },
];

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="flex justify-between items-center py-4 px-2 border-b border-neutral-700">
      <Link href={"/"} className="flex items-center">
        <Image
          src={siteLogo}
          alt="Magic Regex Generator Logo"
          className="w-[35px] h-[35px] rounded-lg mr-2"
          width={35}
          height={35}
        />
        <p className="text-gray-200 text-xl font-bold">MagicRegexGenerator</p>
      </Link>

      <nav>
        <ul className="flex gap-x-5 justify-between text-md font-semibold">
          {navLinks.map((link) => (
            <li
              key={link.label}
              className={`hover:border-b ${
                pathname === link.href ? "text-gray-200" : "text-zinc-400"
              }`}
            >
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};