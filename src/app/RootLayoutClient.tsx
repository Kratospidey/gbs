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
					{/* Cursor Animation Overlay */}
					<GridCursorAnimation
						gridSizeX={gridSizeX}
						gridSizeY={gridSizeY}
						cellSize={cellSize}
						highlightRadius={highlightRadius}
						style={{ zIndex: 1 }} // Lower z-index
					/>
					{/* Content */}
					<div className="relative z-10">{children}</div> {/* Higher z-index */}
				</div>
			</ThemeProvider>
		</ClerkProvider>
	);
}
