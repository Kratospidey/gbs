// src/app/Providers.tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
// Removed Supabase imports
// import { useUser } from "@clerk/nextjs";
// import { useEffect } from "react";
// import { syncUserProfile } from "@/lib/syncUserProfile";

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
