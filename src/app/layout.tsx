import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Container } from "@/components/Container";
import Footer from "@/components/Footer";
import Background from "@/components/Background";
import { PHProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Magic Regex Generator",
    template: "%s - Magic regex Generator",
  },
  description:
    "Generate and test regular expressions effortlessly with our AI-powered Regex Generator. This tool offers AI regex generation for email validation, text parsing, and more. Create regex patterns based on your example data, convert text to regular expressions, and generate regex for JavaScript with ease.",
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link
        rel="icon"
        href="/icon?<generated>"
        type="image/<generated>"
        sizes="<generated>"
      />
      <PHProvider>
        <body className={inter.className}>
          <Background />
          <Container>
            <Header />
            {children}
            <Footer />
          </Container>
        </body>
      </PHProvider>
    </html>
  );
}
