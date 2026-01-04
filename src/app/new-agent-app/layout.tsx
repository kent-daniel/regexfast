import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Regex Agent",
  description: "Chat with an AI assistant to generate regex patterns and code",
};

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout removes the default Header/Footer/Container
  // to give the agent chat a full-screen experience
  return <>{children}</>;
}
