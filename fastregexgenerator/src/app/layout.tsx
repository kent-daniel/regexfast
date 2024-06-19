import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Container } from "@/components/Container";
import Footer from "@/components/Footer";
import Background from "@/components/Background";
import Link from "next/link";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Magic Regex Generator",
  description: "Generate and test regex with ai",
  icons: {
    icon: "/fastregexgenerator/public/I_want_a_magix_box_with_coding copy.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Background />
        <Container>
          <Header />
          {children}
          <Footer />
        </Container>
      </body>
    </html>
  );
}
