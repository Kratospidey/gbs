// src/components/GridCursorAnimation.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import throttle from "lodash.throttle";

interface GridCursorAnimationProps {
	gridSizeX: number; // Number of grid cells horizontally
	gridSizeY: number; // Number of grid cells vertically
	cellSize: number; // Size of each grid cell in pixels
	highlightRadius: number; // Radius in pixels to determine which cells to highlight
	style?: React.CSSProperties;
}

export const GridCursorAnimation: React.FC<GridCursorAnimationProps> = ({
	gridSizeX,
	gridSizeY,
	cellSize,
	highlightRadius,
	style,
}) => {
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
		null
	);

	// Throttled mouse move handler for performance
	const handleMouseMove = useCallback(
		throttle((e: MouseEvent) => {
			setCursorPos({ x: e.clientX, y: e.clientY }); // Use clientX/Y for viewport-relative coordinates
		}, 50), // Throttle delay in ms
		[]
	);

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

	// Calculate the grid cell indices that fall within the highlightRadius
	const getVisibleCells = () => {
		if (!cursorPos) return [];

		const { x, y } = cursorPos;

		// Determine the range of cells to render based on highlightRadius
		const minX = Math.max(0, Math.floor((x - highlightRadius) / cellSize));
		const maxX = Math.min(
			gridSizeX - 1,
			Math.floor((x + highlightRadius) / cellSize)
		);
		const minY = Math.max(0, Math.floor((y - highlightRadius) / cellSize));
		const maxY = Math.min(
			gridSizeY - 1,
			Math.floor((y + highlightRadius) / cellSize)
		);

		const visibleCells = [];

		for (let i = minX; i <= maxX; i++) {
			for (let j = minY; j <= maxY; j++) {
				const cellX = i * cellSize + cellSize / 2;
				const cellY = j * cellSize + cellSize / 2;
				const distance = Math.hypot(x - cellX, y - cellY);
				if (distance < highlightRadius) {
					const opacity = 1 - distance / highlightRadius;
					visibleCells.push({
						i,
						j,
						x: cellX,
						y: cellY,
						opacity,
					});
				}
			}
		}

		return visibleCells;
	};

	const visibleCells = getVisibleCells();

	return (
		<div
			className="fixed inset-0 pointer-events-none"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				zIndex: 5,
				...style,
			}}
		>
			<AnimatePresence>
				{visibleCells.map((cell) => (
					<motion.div
						key={`${cell.i}-${cell.j}`}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: cell.opacity > 0 ? cell.opacity : 0, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="absolute"
						style={{
							top: cell.y - cellSize / 2,
							left: cell.x - cellSize / 2,
							width: cellSize,
							height: cellSize,
							border: `1px solid rgba(255, 255, 255, ${cell.opacity * 0.5})`,
							borderRadius: "4px",
							boxShadow: `0 0 10px rgba(255, 255, 255, ${cell.opacity * 0.3})`,
							pointerEvents: "none",
							mixBlendMode: "screen",
						}}
					/>
				))}
			</AnimatePresence>
		</div>
	);
};
