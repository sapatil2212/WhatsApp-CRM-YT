"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  showRadialGlows?: boolean;
}

export function AuroraBackground({
  children,
  showRadialGlows = true,
  className,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start min-h-screen overflow-hidden select-none transition-colors duration-300 bg-[var(--m-bg-primary)] text-[var(--m-text-primary)]",
        className
      )}
      {...props}
    >
      {/* Ambient static noise texture overlay */}
      <div
        className="absolute inset-0 bg-[url('/noise.svg')] pointer-events-none z-10 opacity-[0.01]"
      />

      {/* Layered Cinematic Aurora Lights */}
      {showRadialGlows && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Neon Emerald Glow (Top Left) */}
          <motion.div
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-[var(--m-glow-emerald)] blur-[120px] transition-all duration-300"
            style={{ mixBlendMode: "var(--m-spotlight-blend)" as any }}
          />

          {/* Cyan/Teal Glow (Bottom Right) */}
          <motion.div
            animate={{
              x: [0, -60, 30, 0],
              y: [0, 45, -20, 0],
              scale: [1, 0.95, 1.1, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-[var(--m-glow-cyan)] blur-[150px] transition-all duration-300"
            style={{ mixBlendMode: "var(--m-spotlight-blend)" as any }}
          />

          {/* Deep Indigo/Purple highlight (Center) */}
          <motion.div
            animate={{
              scale: [1, 1.15, 0.85, 1],
              opacity: [0.2, 0.4, 0.2, 0.2],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-[25%] left-[20%] w-[50%] h-[50%] rounded-full bg-[var(--m-glow-purple)] blur-[180px] transition-all duration-300"
            style={{ mixBlendMode: "var(--m-spotlight-blend)" as any }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative w-full z-20 flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}
