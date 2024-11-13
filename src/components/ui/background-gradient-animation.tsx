// src/components/ui/BackgroundGradientAnimation.tsx
"use client";
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const BackgroundGradientAnimation = ({
	className,
}: {
	className?: string;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				const xPercent = (x / rect.width) * 100;
				const yPercent = (y / rect.height) * 100;
				containerRef.current.style.setProperty("--mouse-x", `${xPercent}%`);
				containerRef.current.style.setProperty("--mouse-y", `${yPercent}%`);
			}
		};
		if (containerRef.current) {
			containerRef.current.addEventListener("mousemove", handleMouseMove);
		}
		return () => {
			if (containerRef.current) {
				containerRef.current.removeEventListener("mousemove", handleMouseMove);
			}
		};
	}, []);

	return (
		<div
			className={cn("relative w-full h-full overflow-hidden", className)}
			ref={containerRef}
		>
			<div className="absolute inset-0 gradient-animation"></div>
		</div>
	);
};
