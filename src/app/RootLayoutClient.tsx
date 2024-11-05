// src/app/RootLayoutClient.tsx
"use client";

import { useEffect, useState } from "react";
import {
	ClerkProvider,
	SignInButton,
	SignedIn,
	SignedOut,
	UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

interface RootLayoutClientProps {
	children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<ClerkProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				enableSystem
				disableTransitionOnChange
			>
				<SignedOut>
					<SignInButton />
				</SignedOut>
				<SignedIn>
					<UserButton />
				</SignedIn>
				{children}
			</ThemeProvider>
		</ClerkProvider>
	);
}
