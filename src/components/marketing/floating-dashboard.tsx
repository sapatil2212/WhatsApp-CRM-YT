"use client";

import React, { useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { MessageSquare, TrendingUp, Sparkles, BarChart2, Inbox, RefreshCw, Send, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingDashboard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { damping: 25, stiffness: 200 });
  const springY = useSpring(y, { damping: 25, stiffness: 200 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    // Map mouse position to degree values (max 8 degrees tilt)
    x.set((mouseX / width) * 16);
    y.set(-(mouseY / height) * 16);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[550px] flex items-center justify-center pointer-events-auto select-none"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        style={{
          rotateY: springX,
          rotateX: springY,
          transformStyle: "preserve-3d",
        }}
        className="w-full max-w-2xl h-[480px] relative flex items-center justify-center transition-all duration-300"
      >
        {/* PANEL 1: Back/Main Panel (CRM Analytics) */}
        <div
          style={{ transform: "translateZ(0px)" }}
          className="absolute inset-0 w-full h-full rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--m-border-primary)] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BarChart2 className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--m-text-primary)]">WA CRM Operating System</h4>
                <p className="text-[10px] text-[var(--m-text-muted)]">Workspace / analytics</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--m-bg-tertiary)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--m-bg-tertiary)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
            </div>
          </div>

          {/* Core Dashboard Content Grid */}
          <div className="flex-1 grid grid-cols-3 gap-4 pt-4 pb-2">
            <div className="col-span-2 space-y-4">
              {/* Analytics Graph Mock */}
              <div className="rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-3 h-[180px] flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-center z-10">
                  <span className="text-[10px] uppercase font-bold text-[var(--m-text-tertiary)]">Daily Converged Conversations</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="size-3" /> +14.8%
                  </span>
                </div>
                {/* SVG Graph path */}
                <svg className="absolute bottom-0 left-0 right-0 w-full h-[90px] pointer-events-none" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,80 C50,70 100,50 150,55 C200,60 250,20 300,30 C350,40 400,10 400,10 L400,100 L0,100 Z"
                    fill="url(#chart-glow)"
                  />
                  <path
                    d="M0,80 C50,70 100,50 150,55 C200,60 250,20 300,30 C350,40 400,10 400,10"
                    fill="none"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth="2.5"
                  />
                </svg>
                <div className="text-xl font-bold text-[var(--m-text-primary)] z-10">14,240</div>
              </div>

              {/* Broadcast Performance metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-3 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-[var(--m-text-tertiary)]">Templates Active</span>
                  <span className="text-sm font-bold text-[var(--m-text-secondary)] mt-2">32 Verified</span>
                </div>
                <div className="rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-3 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-[var(--m-text-tertiary)]">Response Rate</span>
                  <span className="text-sm font-bold text-emerald-400 mt-2">91.4% Avg</span>
                </div>
              </div>
            </div>

            {/* Quick Stats sidebar */}
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-3 flex flex-col justify-between h-full">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold text-[var(--m-text-tertiary)]">Quick Stats</span>
                  <p className="text-[10px] text-[var(--m-text-muted)]">Live Agent Capacity</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--m-text-tertiary)]">Queued:</span>
                    <span className="font-bold text-[var(--m-text-secondary)]">12</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--m-text-tertiary)]">Active Chats:</span>
                    <span className="font-bold text-[var(--m-text-secondary)]">45</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--m-text-tertiary)]">Avg Resolution:</span>
                    <span className="font-bold text-emerald-400">1.8m</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--m-bg-tertiary)] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[82%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: Middle Panel (Shared Inbox Simulation) */}
        <motion.div
          style={{ transform: "translateZ(40px) translateY(40px) translateX(50px)" }}
          className="absolute w-[360px] h-[280px] rounded-xl border border-[var(--m-border-glass)] bg-[var(--m-bg-primary)] p-4 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--m-border-primary)] pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <Inbox className="size-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-[var(--m-text-secondary)]">Shared Inbox</span>
            </div>
            <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded px-1.5 font-bold">LIVE</span>
          </div>

          {/* Conversation item list */}
          <div className="flex-1 space-y-2.5">
            {/* Conversation 1 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--m-bg-card)] border border-[var(--m-border-glass)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">JD</div>
                <div>
                  <h5 className="text-[11px] font-bold text-[var(--m-text-secondary)]">John Doe</h5>
                  <p className="text-[9px] text-[var(--m-text-tertiary)]">Pricing inquiry... is it self-hosted?</p>
                </div>
              </div>
              <span className="text-[8px] text-[var(--m-text-muted)]">10m ago</span>
            </div>

            {/* Conversation 2 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--m-bg-card)] border border-[var(--m-border-glass)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">MC</div>
                <div>
                  <h5 className="text-[11px] font-bold text-[var(--m-text-secondary)]">Monica Chang</h5>
                  <p className="text-[9px] text-[var(--m-text-tertiary)]">AI auto-replied correctly.</p>
                </div>
              </div>
              <span className="text-[8px] text-[var(--m-text-muted)]">22m ago</span>
            </div>

            {/* Conversation 3 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--m-bg-card)] border border-[var(--m-border-glass)] opacity-70">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">RT</div>
                <div>
                  <h5 className="text-[11px] font-bold text-[var(--m-text-secondary)]">Ray Thompson</h5>
                  <p className="text-[9px] text-[var(--m-text-tertiary)]">Sent campaign broadcast.</p>
                </div>
              </div>
              <span className="text-[8px] text-[var(--m-text-muted)]">1h ago</span>
            </div>
          </div>
        </motion.div>

        {/* PANEL 3: Top/Foreground Panel (AI Flow Rule Trigger) */}
        <motion.div
          style={{ transform: "translateZ(80px) translateY(-50px) translateX(-110px)" }}
          className="absolute w-[310px] h-[220px] rounded-xl border border-emerald-500/30 bg-[var(--m-bg-primary)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--m-text-primary)] flex items-center gap-1">AI Action Engine</span>
              <p className="text-[9px] text-[var(--m-text-muted)]">Rules & triggers</p>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-[10px] bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] p-2 rounded-lg">
              <span className="text-[var(--m-text-tertiary)] font-medium">When lead matches:</span>
              <span className="bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px]">
                "Intent: Enterprise"
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] p-2 rounded-lg">
              <span className="text-[var(--m-text-tertiary)] font-medium">Auto-qualify with GPT:</span>
              <span className="text-[var(--m-text-secondary)] font-mono text-[8px] font-bold">Enabled (v4-turbo)</span>
            </div>

            <div className="flex items-center justify-between text-[10px] bg-emerald-950/20 border border-emerald-800/40 p-2 rounded-lg">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <RefreshCw className="size-3 animate-spin" /> Live Qualification
              </span>
              <span className="font-bold text-[var(--m-text-secondary)]">Active</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
