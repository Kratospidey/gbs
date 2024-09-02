// DarkModeToggle.tsx
"use client";

import React, { useEffect, useState } from "react";

const DarkModeToggle = () => {
	const [isDarkMode, setIsDarkMode] = useState(false);

	useEffect(() => {
		const html = document.documentElement;
		const storedTheme = localStorage.getItem("theme");

		if (storedTheme === "dark") {
			html.classList.add("dark");
			setIsDarkMode(true);
		} else if (storedTheme === "light") {
			html.classList.remove("dark");
			setIsDarkMode(false);
		}
	}, []);

	const toggleDarkMode = () => {
		const html = document.documentElement;

		if (html.classList.contains("dark")) {
			html.classList.remove("dark");
			localStorage.setItem("theme", "light");
			setIsDarkMode(false);
		} else {
			html.classList.add("dark");
			localStorage.setItem("theme", "dark");
			setIsDarkMode(true);
		}
	};

	return (
		<button onClick={toggleDarkMode} className="p-2 text-sm">
			{isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
		</button>
	);
};

export default DarkModeToggle;
