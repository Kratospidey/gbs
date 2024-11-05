// src/components/mode-toggle.tsx
"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  className?: string;
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();

  // Determine the current theme; fallback to 'light' if undefined
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        className="p-0 h-6 w-6 hover:bg-transparent"
        title="Toggle theme"
      >
        {currentTheme === "dark" ? (
          <MoonIcon className="h-6 w-6" />
        ) : (
          <SunIcon className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
      <div
        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg 
                invisible group-hover:visible opacity-0 group-hover:opacity-100 
                transition-all duration-300 ease-in-out transform 
                -translate-y-1 group-hover:translate-y-0
                group-hover:delay-100
                before:content-[''] before:absolute before:top-[-10px] before:left-0 before:w-full before:h-[10px]"
      >
        <button
          onClick={() => setTheme("light")}
          className="w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
        >
          <SunIcon className="h-4 w-4 mr-2" />
          Light
        </button>
        <button
          onClick={() => setTheme("dark")}
          className="w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
        >
          <MoonIcon className="h-4 w-4 mr-2" />
          Dark
        </button>
        <button
          onClick={() => setTheme("system")}
          className="w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          System
        </button>
      </div>
    </div>
  );
}
