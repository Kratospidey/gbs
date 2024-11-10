// src/components/mode-toggle.tsx
"use client";

import * as React from "react";
import { MoonIcon, SunIcon, DesktopIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [isHovering, setIsHovering] = React.useState(false);

  // Determine the current theme; fallback to 'light' if undefined
  const currentTheme = (theme === "system" ? resolvedTheme : theme) ?? "light";

  // Determine other themes to show on hover
  const otherThemes = ["light", "dark", "system"].filter((t) => t !== theme);

  const themeIcons: Record<string, JSX.Element> = {
    light: <SunIcon className="h-5 w-5" />, // Increased size
    dark: <MoonIcon className="h-5 w-5" />, // Increased size
    system: <DesktopIcon className="h-5 w-5" />, // Increased size
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Current Theme Button */}
      <button
        className="p-1 h-6 w-6 bg-background text-foreground rounded-full flex items-center justify-center shadow transition-transform duration-200 hover:scale-110"
        title={`Current theme: ${currentTheme}`}
        onClick={() => {
          // Toggle to the next theme on click
          const nextTheme = otherThemes[0];
          setTheme(nextTheme);
        }}
      >
        {themeIcons[currentTheme]}
        <span className="sr-only">Current theme: {currentTheme}</span>
      </button>

      {/* Other Themes */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            className="absolute flex flex-col items-center bg-background rounded-lg p-1 shadow-lg"
            style={{ bottom: "110%", marginBottom: "6px" }} // Adjusted margin
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {otherThemes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="p-1 h-5 w-5 bg-transparent text-foreground rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-1 last:mb-0"
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
