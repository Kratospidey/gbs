"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import AuthSyncProvider from "./AuthSyncProvider.tsx";
import { Toaster } from "react-hot-toast";

interface ProvidersProps {
	children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<ClerkProvider>
			<AuthSyncProvider>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Toaster />
				</ThemeProvider>
			</AuthSyncProvider>
		</ClerkProvider>
	);
}
