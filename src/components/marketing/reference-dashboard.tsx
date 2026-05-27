"use client";

import React from "react";
import { Bot, Sparkles } from "lucide-react";

export function ReferenceDashboard() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-0 px-4 md:px-0">
      {/* Background Glow Effect behind Dashboard */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[85%] h-[280px] rounded-full pointer-events-none z-0 animate-pulse bg-[var(--m-glow-emerald)] blur-[100px]"
        style={{ animationDuration: "8s" }}
      />

      {/* The Dashboard Card Container */}
      <div
        className="relative z-10 w-full h-[420px] rounded-t-2xl border-t border-x border-[var(--m-border-primary)] bg-[var(--m-bg-surface)] shadow-[var(--m-shadow-card)] backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col"
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
          {/* Sidebar on Left — matches actual lg:w-60 (240px) */}
          <div
            className="w-60 border-r border-[var(--m-border-primary)] bg-[var(--m-bg-primary)] px-3 py-4 space-y-1 shrink-0 hidden sm:flex sm:flex-col transition-all duration-300"
          >
            {/* Active nav item */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10">
              <div className="w-4 h-4 rounded bg-emerald-500/40 shrink-0" />
              <div className="w-20 h-2.5 rounded bg-emerald-500/30" />
            </div>
            {/* Nav items */}
            {[28, 24, 20, 26, 22, 18].map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                <div className="w-4 h-4 rounded bg-[var(--m-bg-tertiary)] shrink-0 transition-colors" />
                <div className={`h-2.5 rounded bg-[var(--m-bg-tertiary)] transition-colors`} style={{ width: `${w * 3}px` }} />
              </div>
            ))}
            <div className="mx-3 my-2 border-t border-[var(--m-border-primary)]" />
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <div className="w-4 h-4 rounded bg-[var(--m-bg-tertiary)] shrink-0 transition-colors" />
              <div className="w-16 h-2.5 rounded bg-[var(--m-bg-tertiary)] transition-colors" />
            </div>
          </div>

          {/* Core Content Grid on Right */}
          <div
            className="flex-1 p-5 flex flex-col gap-4 overflow-hidden transition-all duration-300 bg-[var(--m-bg-primary)]"
          >
            {/* Metric cards row — 4 cols matching actual dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { w: "w-20", accent: "bg-emerald-500/20" },
                { w: "w-16", accent: "bg-blue-500/20" },
                { w: "w-24", accent: "bg-purple-500/20" },
                { w: "w-18", accent: "bg-amber-500/20" },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-3 flex flex-col gap-2 transition-all duration-300"
                >
                  <div className={`w-7 h-7 rounded-lg ${card.accent}`} />
                  <div className={`${card.w} h-2 rounded bg-[var(--m-bg-tertiary)]`} />
                  <div className="w-12 h-3 rounded bg-[var(--m-bg-tertiary)]" />
                </div>
              ))}
            </div>

            {/* Charts row — 3+2 col split matching actual dashboard */}
            <div className="grid grid-cols-5 gap-3 flex-1 min-h-0">
              <div className="col-span-3 rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-3 flex flex-col gap-2 transition-all duration-300">
                <div className="w-28 h-2 rounded bg-[var(--m-bg-tertiary)]" />
                <div className="flex-1 flex items-end gap-1 pt-2">
                  {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-emerald-500/25 transition-all duration-300"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-3 flex flex-col items-center justify-center gap-2 transition-all duration-300">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--m-bg-tertiary)] border-t-emerald-500/60 border-r-blue-500/40" />
                <div className="w-20 h-2 rounded bg-[var(--m-bg-tertiary)]" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
