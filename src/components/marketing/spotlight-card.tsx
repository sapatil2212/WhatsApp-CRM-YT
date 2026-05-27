"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  glowColor?: string;
  glowSize?: number;
  interactive?: boolean;
}

export function SpotlightCard({
  children,
  className,
  glowColor = "rgba(16, 185, 129, 0.15)", // Emerald-green spotlight by default
  glowSize = 250,
  interactive = true,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !interactive) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] backdrop-blur-md overflow-hidden transition-all duration-300",
        interactive &&
          "hover:border-[var(--m-border-secondary)] hover:shadow-lg",
        className
      )}
      {...props}
    >
      {/* Background Spotlight Sweep */}
      {interactive && isHovered && (
        <div
          className="absolute pointer-events-none z-0 transition-opacity duration-300"
          style={{
            width: `${glowSize}px`,
            height: `${glowSize}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            left: `${coords.x - glowSize / 2}px`,
            top: `${coords.y - glowSize / 2}px`,
            mixBlendMode: "var(--m-spotlight-blend)" as any,
            opacity: "var(--m-spotlight-opacity)" as any,
          }}
        />
      )}

      {/* Floating reflection light sweep line */}
      {interactive && (
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      )}

      {/* Card Content wrapper to force stacking order above spotlight */}
      <div className="relative z-10 w-full h-full flex flex-col p-5">
        {children}
      </div>
    </div>
  );
}
