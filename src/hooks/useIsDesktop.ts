// src/hooks/useIsDesktop.ts
import { useState, useEffect } from "react";

export const useIsDesktop = (breakpoint: number = 768) => {
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		const checkIsDesktop = () => {
			setIsDesktop(window.innerWidth >= breakpoint);
		};

		// Initial check
		checkIsDesktop();

		// Add resize event listener
		window.addEventListener("resize", checkIsDesktop);

		// Cleanup event listener on unmount
		return () => window.removeEventListener("resize", checkIsDesktop);
	}, [breakpoint]);

	return isDesktop;
};
