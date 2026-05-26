"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useMarketingTheme } from "./marketing-theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useMarketingTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 p-1 rounded-full border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] backdrop-blur-md shadow-[var(--m-shadow-card)] transition-all duration-300",
        className
      )}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = mode === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            className={cn(
              "relative flex items-center justify-center h-8 w-8 rounded-full text-[var(--m-text-tertiary)] hover:text-[var(--m-text-primary)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              isActive && "text-[var(--m-text-primary)]"
            )}
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
          >
            {isActive && (
              <motion.span
                layoutId="active-theme-pill"
                className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className="h-4 w-4 relative z-10" />
          </button>
        );
      })}
    </div>
  );
}
