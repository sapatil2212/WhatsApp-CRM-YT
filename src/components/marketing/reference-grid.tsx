"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ReferenceGridProps extends React.HTMLAttributes<HTMLDivElement> {
  gridSize?: number;
}

export function ReferenceGrid({
  className,
  gridSize = 90,
  ...props
}: ReferenceGridProps) {
  // Staggered absolute square blocks to replicate the reference image pattern
  const highlights = [
    { row: 1, col: 2, opacity: 0.03 },
    { row: 2, col: 5, opacity: 0.05 },
    { row: 3, col: 1, opacity: 0.04 },
    { row: 4, col: 8, opacity: 0.03 },
    { row: 2, col: 9, opacity: 0.04 },
    { row: 5, col: 3, opacity: 0.06 },
    { row: 6, col: 7, opacity: 0.04 },
    { row: 4, col: 2, opacity: 0.05 },
    { row: 5, col: 10, opacity: 0.03 },
    { row: 1, col: 6, opacity: 0.04 },
  ];

  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none transition-colors duration-300 bg-[var(--m-bg-primary)]",
        className
      )}
      {...props}
    >
      {/* Background Radial Glow */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[75%] h-[400px] rounded-full transition-all duration-300 pointer-events-none bg-[var(--m-glow-emerald)] blur-[120px]"
        style={{ mixBlendMode: "var(--m-spotlight-blend)" as any }}
      />

      {/* SVG Grid Squares */}
      <svg className="absolute inset-0 w-full h-full" width="100%" height="100%">
        <defs>
          <pattern
            id="ref-grid-pattern"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={gridSize}
              height={gridSize}
              fill="none"
              stroke="var(--m-grid-stroke)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ref-grid-pattern)" />
      </svg>

      {/* Staggered highlighted squares */}
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(auto-fill, ${gridSize}px)`, gridAutoRows: `${gridSize}px` }}>
        {highlights.map((h, i) => (
          <div
            key={i}
            className="transition-colors duration-300 bg-[var(--m-text-heading)]"
            style={{
              gridRowStart: h.row,
              gridColumnStart: h.col,
              opacity: `calc(${h.opacity} * var(--m-grid-opacity-scale, 1))` as any,
              width: `${gridSize}px`,
              height: `${gridSize}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
