"use client";

import React from "react";
import Link from "next/link";
import { Bot, Home, AlertCircle, ArrowLeft } from "lucide-react";
import { InteractiveGrid } from "@/components/marketing/interactive-grid";

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[var(--m-bg-primary)] px-4 text-center overflow-hidden select-none">
      {/* Grid backdrops */}
      <InteractiveGrid gridSize={42} className="opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[350px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
          <AlertCircle className="size-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight font-mono">404</h1>
          <h2 className="text-lg font-bold text-[var(--m-text-primary)]">Message Delivery Failed</h2>
          <p className="text-xs text-[var(--m-text-tertiary)] leading-relaxed max-w-sm mx-auto">
            The conversation path you are looking for has expired or does not exist. We've returned a '404' delivery status receipt.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-1.5"
          >
            <Home className="size-3.5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
