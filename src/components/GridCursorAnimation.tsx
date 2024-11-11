// src/components/GridCursorAnimation.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
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

  // Memoize cells to optimize performance
  const cells = useMemo(() => {
    const tempCells = [];
    for (let i = 0; i < gridSizeX; i++) {
      for (let j = 0; j < gridSizeY; j++) {
        const x = i * cellSize + cellSize / 2;
        const y = j * cellSize + cellSize / 2;
        tempCells.push({ i, j, x, y });
      }
    }
    return tempCells;
  }, [gridSizeX, gridSizeY, cellSize]);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 5 }} // Lower z-index to stay behind components with higher z-index
    >
      {cursorPos &&
        cells.map((cell) => {
          // Adjust cell position relative to viewport by subtracting scroll offset
          const scrollX = window.scrollX || window.pageXOffset;
          const scrollY = window.scrollY || window.pageYOffset;
          const cellPosX = cell.x - scrollX;
          const cellPosY = cell.y - scrollY;

          const distance = Math.hypot(
            cursorPos.x - cellPosX,
            cursorPos.y - cellPosY
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
                className="fixed"
                style={{
                  top: cellPosY - cellSize / 2,
                  left: cellPosX - cellSize / 2,
                  width: cellSize,
                  height: cellSize,
                  border: `1px solid rgba(255, 255, 255, ${opacity * 0.5})`,
                  borderRadius: "4px",
                  boxShadow: `0 0 10px rgba(255, 255, 255, ${opacity * 0.3})`,
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
