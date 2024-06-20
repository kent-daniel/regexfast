import CommonRegexSection from "@/components/CommonRegexSection";
import Hero from "@/components/Hero";
import { RegexPlaygroundSection } from "@/components/RegexPlaygroundSection";

export default function Home() {
  return (
    <main className="min-h-screen p-2">
      <Hero />
      <RegexPlaygroundSection />
      <CommonRegexSection />
    </main>
  );
}
