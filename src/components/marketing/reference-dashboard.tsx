"use client";

import React from "react";
import { Bot, Sparkles } from "lucide-react";

export function ReferenceDashboard() {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-0 px-4 md:px-0">
      {/* Background Glow Effect behind Dashboard */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[85%] h-[280px] rounded-full pointer-events-none z-0 animate-pulse bg-[var(--m-glow-emerald)] blur-[100px]"
        style={{ animationDuration: "8s" }}
      />

      {/* The Dashboard Card Container */}
      <div
        className="relative z-10 w-full h-[380px] rounded-t-2xl border-t border-x border-[var(--m-border-primary)] bg-[var(--m-bg-surface)] shadow-[var(--m-shadow-card)] backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col"
      >
        
        {/* Top Header Row */}
        <div
          className="h-14 border-b border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)] px-6 flex items-center justify-between shrink-0 transition-all duration-300"
        >
          {/* Logo on Left */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bot className="size-3.5" />
            </div>
            <span
              className="text-xs font-bold tracking-tight flex items-center gap-1 transition-colors text-[var(--m-text-heading)]"
            >
              wacrm <Sparkles className="size-2 text-emerald-400" />
            </span>
          </div>

          {/* Search/Pill in Center */}
          <div
            className="w-64 h-7 rounded-full border border-[var(--m-border-primary)] bg-[var(--m-bg-tertiary)] transition-all duration-300"
          />

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            <div className="w-5.5 h-5.5 rounded-full bg-[var(--m-bg-tertiary)] transition-colors" />
            <div className="w-5.5 h-5.5 rounded-full bg-[var(--m-bg-tertiary)] transition-colors" />
            <div className="w-5.5 h-5.5 rounded-full bg-[var(--m-bg-tertiary)] transition-colors" />
            <div className="w-16 h-5.5 rounded bg-[var(--m-bg-tertiary)] transition-colors" />
          </div>
        </div>

        {/* Content Body area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar on Left */}
          <div
            className="w-48 border-r border-[var(--m-border-primary)] bg-[var(--m-bg-primary)] p-4 space-y-4 shrink-0 hidden sm:block transition-all duration-300"
          >
            {/* Nav Item 1 */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[var(--m-bg-tertiary)] transition-colors" />
              <div className="w-24 h-3 rounded bg-[var(--m-bg-tertiary)] transition-colors" />
            </div>
            {/* Nav Item 2 */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[var(--m-bg-tertiary)] transition-colors" />
              <div className="w-20 h-3 rounded bg-[var(--m-bg-tertiary)] transition-colors" />
            </div>
          </div>

          {/* Core Content Grid on Right */}
          <div
            className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-300 bg-[var(--m-bg-primary)]"
          >
            {/* Card 1 */}
            <div
              className="h-44 rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-4 flex flex-col justify-between transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--m-bg-tertiary)]" />
              <div className="space-y-2">
                <div className="w-16 h-2 rounded bg-[var(--m-bg-tertiary)]" />
                <div className="w-24 h-2.5 rounded bg-[var(--m-bg-tertiary)]" />
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="h-44 rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-4 flex flex-col justify-between transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--m-bg-tertiary)]" />
              <div className="space-y-2">
                <div className="w-12 h-2 rounded bg-[var(--m-bg-tertiary)]" />
                <div className="w-20 h-2.5 rounded bg-[var(--m-bg-tertiary)]" />
              </div>
            </div>

            {/* Card 3 */}
            <div
              className="h-44 rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-4 flex flex-col justify-between transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--m-bg-tertiary)]" />
              <div className="space-y-2">
                <div className="w-20 h-2 rounded bg-[var(--m-bg-tertiary)]" />
                <div className="w-16 h-2.5 rounded bg-[var(--m-bg-tertiary)]" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
