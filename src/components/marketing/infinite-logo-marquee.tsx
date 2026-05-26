"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoMarqueeProps {
  className?: string;
  speed?: "slow" | "medium" | "fast";
}

export function InfiniteLogoMarquee({
  className,
  speed = "medium",
}: LogoMarqueeProps) {
  const logos = [
    { name: "Stripe", url: "https://cdn.worldvectorlogo.com/logos/stripe-4.svg" },
    { name: "Linear", url: "https://cdn.worldvectorlogo.com/logos/linear-1.svg" },
    { name: "Zapier", url: "https://cdn.worldvectorlogo.com/logos/zapier-2.svg" },
    { name: "Vercel", url: "https://cdn.worldvectorlogo.com/logos/vercel.svg" },
    { name: "HubSpot", url: "https://cdn.worldvectorlogo.com/logos/hubspot.svg" },
    { name: "Shopify", url: "https://cdn.worldvectorlogo.com/logos/shopify.svg" },
  ];

  const duration = speed === "fast" ? "15s" : speed === "slow" ? "40s" : "25s";

  return (
    <div className={cn("relative w-full overflow-hidden py-6 select-none", className)}>
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee ${duration} linear infinite;
        }
      `}</style>

      {/* Fade overlay gradients */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--m-gradient-fade)] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--m-gradient-fade)] to-transparent z-10 pointer-events-none" />

      <div className="animate-marquee flex gap-12 items-center">
        {/* First set of logos */}
        {logos.map((logo, index) => (
          <div
            key={`logo-1-${index}`}
            className="flex items-center gap-2.5 opacity-40 hover:opacity-85 transition-opacity duration-300 cursor-pointer"
          >
            {/* Simple logo text & generic placeholder box to represent brand icon cleanly */}
            <div className="w-5 h-5 rounded bg-[var(--m-bg-tertiary)] border border-[var(--m-border-secondary)] flex items-center justify-center font-bold text-[9px] text-[var(--m-text-tertiary)]">
              {logo.name[0]}
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--m-text-secondary)] font-sans">
              {logo.name}
            </span>
          </div>
        ))}

        {/* Duplicated second set of logos for infinite illusion */}
        {logos.map((logo, index) => (
          <div
            key={`logo-2-${index}`}
            className="flex items-center gap-2.5 opacity-40 hover:opacity-85 transition-opacity duration-300 cursor-pointer"
          >
            <div className="w-5 h-5 rounded bg-[var(--m-bg-tertiary)] border border-[var(--m-border-secondary)] flex items-center justify-center font-bold text-[9px] text-[var(--m-text-tertiary)]">
              {logo.name[0]}
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--m-text-secondary)] font-sans">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
