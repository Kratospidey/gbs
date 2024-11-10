// src/components/mode-toggle.tsx
"use client";

import * as React from "react";
import { MoonIcon, SunIcon, DesktopIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ModeToggle() {
	const { setTheme, theme, resolvedTheme } = useTheme();
	const [isHovering, setIsHovering] = React.useState(false);

	// Determine the current theme; fallback to 'light' if undefined
	const currentTheme = (theme === "system" ? resolvedTheme : theme) ?? "light";

	// Determine other themes to show on hover
	const otherThemes = ["light", "dark", "system"].filter((t) => t !== theme);

	const themeIcons: Record<string, JSX.Element> = {
		light: <SunIcon className="h-6 w-6" />,
		dark: <MoonIcon className="h-6 w-6" />,
		system: <DesktopIcon className="h-6 w-6" />,
	};

	const handleMouseEnter = () => setIsHovering(true);
	const handleMouseLeave = () => setIsHovering(false);

	return (
		<div
			className="relative flex flex-col items-center"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Current Theme Button */}
			<button
				className="p-2 h-10 w-10 bg-background text-foreground rounded-full flex items-center justify-center shadow-lg"
				title={`Current theme: ${currentTheme}`}
			>
				{themeIcons[currentTheme]}
				<span className="sr-only">Current theme: {currentTheme}</span>
			</button>

			{/* Other Themes */}
			<AnimatePresence>
				{isHovering && (
					<motion.div
						className="absolute flex flex-col items-center"
						style={{ bottom: "110%", marginBottom: "10px" }}
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
					>
						{otherThemes.map((t) => (
							<button
								key={t}
								onClick={() => setTheme(t)}
								className="p-2 h-10 w-10 mb-2 bg-background text-foreground rounded-full flex items-center justify-center shadow-lg"
								title={`Switch to ${t} theme`}
							>
								{themeIcons[t]}
								<span className="sr-only">Switch to {t} theme</span>
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
