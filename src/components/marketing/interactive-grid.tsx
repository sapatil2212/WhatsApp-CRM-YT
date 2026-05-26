"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InteractiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  gridSize?: number;
  glowColor?: string;
  glowRadius?: number;
}

export function InteractiveGrid({
  className,
  gridSize = 40,
  glowColor = "rgba(16, 185, 129, 0.12)", // Emerald color glow
  glowRadius = 300,
  ...props
}: InteractiveGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseLeave = () => {
      setCoords({ x: -1000, y: -1000 });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none overflow-hidden opacity-40 select-none",
        className
      )}
      style={{
        backgroundImage: `radial-gradient(circle at ${coords.x}px ${coords.y}px, ${glowColor} 0%, transparent ${glowRadius}px)`,
        ...props.style,
      }}
      {...props}
    >
      {/* Grid Pattern */}
      <svg className="absolute inset-0 w-full h-full" width="100%" height="100%">
        <defs>
          <pattern
            id="interactive-grid-pattern"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="var(--m-grid-stroke)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#interactive-grid-pattern)" />
      </svg>
    </div>
  );
}
