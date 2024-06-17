import RegexEditor from "@/components/RegexEditor";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <div className="flex w-full justify-center">
        <div className="bg-gray-100 p-4 basis-2/5">
          <h2 className="text-xl font-bold mb-4">Form</h2>
          {/* Add your form elements here */}
          <form>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="input1"
              >
                Input 1
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="input1"
                type="text"
                placeholder="Enter text"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="input2"
              >
                Input 2
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="input2"
                type="text"
                placeholder="Enter text"
              />
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
            >
              Submit
            </button>
          </form>
        </div>

        <div className="flex basis-3/5 items-center">
          <div className="m-5 h-full min-h-[1em] w-0.5 self-stretch bg-gradient-to-tr from-transparent via-neutral-500 to-transparent opacity-75 dark:via-neutral-200"></div>
          <RegexEditor />
        </div>
      </div>
    </main>
  );
}
