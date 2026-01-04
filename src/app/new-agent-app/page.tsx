"use client";

import Chat from "./chat";
import { Providers } from "@/providers";

export default function NewAgentAppPage() {
	return (
		<Providers>
			<div className="bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
				<Chat />
			</div>
		</Providers>
	);
}

