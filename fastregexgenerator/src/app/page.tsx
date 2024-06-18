import RegexEditor from "@/components/RegexEditor";
import { MagicButton } from "@/components/ui/MagicButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen p-2">
      <div className="flex w-full justify-center text-gray-300">
        <div className="basis-1/3 ">
          <h1 className="text-2xl font-bold mb-5 border-gray-600 pb-2 border-b tracking-tight">
            Regex Generator 💻
          </h1>
          <form>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-3">
                I want to generate regex for
              </label>
              <Textarea
                required
                placeholder="Matching phone numbers"
                className="text-sm max-h-12 bg-zinc-800"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-3">
                It should match strings like
              </label>
              <Textarea
                required
                placeholder="+919367788755 ,8989829304"
                className="text-sm max-h-12 bg-zinc-800"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-3">
                It should NOT match strings like
              </label>
              <Textarea
                placeholder="789 ,123765 ,1-1-1"
                className="text-sm max-h-12 bg-zinc-800"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-3">More info</label>
              <Textarea
                placeholder="Match a phone number with - and/or country code."
                className="text-sm max-h-12 bg-zinc-800"
              />
            </div>
            <MagicButton text="Generate 🔮" className="w-full mt-2" />
          </form>
        </div>

        <div className="flex basis-2/3">
          <div className="m-5 h-full min-h-[1em] w-0.5 self-stretch bg-gradient-to-tr from-transparent via-indigo-500 to-transparent opacity-75 dark:via-neutral-200"></div>
          <RegexEditor />
        </div>
      </div>
    </main>
  );
}
