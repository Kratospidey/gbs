// src/components/GridCursorAnimation.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface GridCursorAnimationProps {
	gridSize: number; // Number of grid cells horizontally and vertically
	cellSize: number; // Size of each grid cell in pixels
	highlightRadius: number; // Radius in pixels to determine which cells to highlight
}

export const GridCursorAnimation: React.FC<GridCursorAnimationProps> = ({
	gridSize,
	cellSize,
	highlightRadius,
}) => {
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
		null
	);

	const handleMouseMove = useCallback((e: MouseEvent) => {
		setCursorPos({ x: e.clientX, y: e.clientY });
	}, []);

	const handleMouseLeave = useCallback(() => {
		setCursorPos(null);
	}, []);

	useEffect(() => {
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseleave", handleMouseLeave);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [handleMouseMove, handleMouseLeave]);

	// Calculate grid cells
	const cells = [];
	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			const x = i * cellSize + cellSize / 2;
			const y = j * cellSize + cellSize / 2;
			cells.push({ i, j, x, y });
		}
	}

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{ zIndex: 10 }}
		>
			{cursorPos &&
				cells.map((cell) => {
					const distance = Math.hypot(
						cursorPos.x - cell.x,
						cursorPos.y - cell.y
					);
					if (distance < highlightRadius) {
						// Calculate opacity based on distance
						const opacity = 1 - distance / highlightRadius;
						return (
							<motion.div
								key={`${cell.i}-${cell.j}`}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: opacity > 0 ? opacity : 0, scale: 1 }}
								transition={{ duration: 0.3, ease: "easeOut" }}
								className="absolute"
								style={{
									top: cell.y - cellSize / 2,
									left: cell.x - cellSize / 2,
									width: cellSize,
									height: cellSize,
									border: `1px solid rgba(255, 255, 255, ${opacity})`,
									borderRadius: "4px",
									boxShadow: `0 0 10px rgba(255, 255, 255, ${opacity})`,
									pointerEvents: "none",
									mixBlendMode: "screen",
								}}
							/>
						);
					}
					return null;
				})}
		</div>
	);
};
