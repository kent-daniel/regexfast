"use client";

import dynamic from "next/dynamic";
import { Providers } from "@/providers";

// Dynamically import Chat with SSR disabled to prevent prerender errors
// (useAgent tries to establish WebSocket connections which fail during static generation)
const Chat = dynamic(() => import("./chat"), { ssr: false });

export default function NewAgentAppPage() {
	return (
		<Providers>
			<div className="bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
				<Chat />
			</div>
		</Providers>
	);
}

