// src/app/RootLayoutClient.tsx
"use client";

import { useEffect, useState } from "react";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GridCursorAnimation } from "@/components/GridCursorAnimation";

interface RootLayoutClientProps {
	children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);

		// Hide any button with the exact text "Sign in"
		const buttons = document.querySelectorAll("button");
		buttons.forEach((button) => {
			if (button.textContent?.trim() === "Sign in") {
				button.style.display = "none";
			}
		});
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<ClerkProvider
			publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
		>
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				enableSystem
				disableTransitionOnChange
			>
				{/* Background wrapper */}
				<div className="relative min-h-screen">
					{/* Grid background with mask */}
					<div className="fixed inset-0 dark:bg-black bg-white dark:bg-grid-white/[0.2] bg-grid-black/[0.2]">
						{/* Radial gradient mask */}
						<div className="absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
					</div>

					{/* Cursor Animation Overlay */}
					<GridCursorAnimation
						gridSize={32} // Adjust based on your grid configuration
						cellSize={32} // Adjust based on your grid cell size
						highlightRadius={150} // Adjust the radius for highlighting
					/>

					{/* Content */}
					<div className="relative z-0">{children}</div>
				</div>
			</ThemeProvider>
		</ClerkProvider>
	);
}
