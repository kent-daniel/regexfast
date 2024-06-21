import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className=" text-center text-gray-300 text-lg font-bold mt-auto h-[80px] flex flex-col items-center justify-center">
      <small>
        by
        <Link
          className="bg-gradient-to-r from-indigo-900 to-indigo-700 p-1 rounded-md mx-2"
          href={"https://x.com/KentDaniel777"}
        >
          @KentDaniel
        </Link>
      </small>
      <small>&copy; 2024 Magic Regex Generator. All rights reserved.</small>
    </footer>
  );
};

export default Footer;
