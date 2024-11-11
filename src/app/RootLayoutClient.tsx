// src/app/RootLayoutClient.tsx
"use client";

import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GridCursorAnimation } from "@/components/GridCursorAnimation";

interface RootLayoutClientProps {
	children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
	const [isMounted, setIsMounted] = useState(false);
	const [cellSize, setCellSize] = useState(100); // Desired cell size in pixels
	const [gridSizeX, setGridSizeX] = useState(0);
	const [gridSizeY, setGridSizeY] = useState(0);
	const [highlightRadius, setHighlightRadius] = useState(200); // Adjust as needed

	useEffect(() => {
		setIsMounted(true);

		// Hide any button with the exact text "Sign in"
		const buttons = document.querySelectorAll("button");
		buttons.forEach((button) => {
			if (button.textContent?.trim() === "Sign in") {
				button.style.display = "none";
			}
		});

		// Function to calculate grid configuration based on window size
		const calculateGrid = () => {
			const { innerWidth, innerHeight } = window;

			const newGridSizeX = Math.ceil(innerWidth / cellSize);
			const newGridSizeY = Math.ceil(innerHeight / cellSize);

			setGridSizeX(newGridSizeX);
			setGridSizeY(newGridSizeY);
		};

		// Initial calculation
		calculateGrid();

		// Recalculate on window resize
		window.addEventListener("resize", calculateGrid);
		return () => {
			window.removeEventListener("resize", calculateGrid);
		};
	}, [cellSize]);

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
					<div
						className="fixed inset-0 dark:bg-black bg-white"
						style={{
							backgroundImage: `
								linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
								linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
							`,
							backgroundSize: `${cellSize}px ${cellSize}px`,
							backgroundPosition: "0 0",
						}}
					>
						{/* Radial gradient mask */}
						<div className="absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
					</div>

					{/* Cursor Animation Overlay */}
					<GridCursorAnimation
						gridSizeX={gridSizeX}
						gridSizeY={gridSizeY}
						cellSize={cellSize}
						highlightRadius={highlightRadius}
					/>

					{/* Content */}
					<div className="relative z-0">{children}</div>
				</div>
			</ThemeProvider>
		</ClerkProvider>
	);
}
