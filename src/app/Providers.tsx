// src/app/Providers.tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";

interface ProvidersProps {
	children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<ClerkProvider>
			{/* Removed UserProfileSync component */}
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				enableSystem
				disableTransitionOnChange
			>
				{children}
			</ThemeProvider>
		</ClerkProvider>
	);
}
