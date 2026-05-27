"use client";

import React from "react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { BarChart2, Sparkles, TrendingUp, RefreshCw, Zap, CheckCheck } from "lucide-react";
import { AnimatedMetrics } from "@/components/marketing/animated-metrics";

export default function AnalyticsPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="size-3 animate-pulse" /> data insights
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.1]">
          Cinematic Analytics <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Powering High Growth.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] max-w-xl mx-auto">
          Review read receipts, agent response times, and AI resolution rates in real-time. Make data-driven marketing decisions.
        </p>
      </div>

      {/* Metrics Counters */}
      <AnimatedMetrics />

      {/* Analytics Main Graphic Box */}
      <div className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/5 via-cyan-950/5 to-transparent pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase tracking-wide">
              <TrendingUp className="size-4 animate-pulse" /> Live conversion metrics
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--m-text-primary)] tracking-tight leading-snug">
              Monitor Campaign Read Receipts.
            </h3>
            <p className="text-xs text-[var(--m-text-tertiary)] leading-relaxed">
              Unlike emails that silently rot in spam, 98% of sent WhatsApp templates are opened. Track exact delivery timestamps, read confirmations, and quick reply clicks.
            </p>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/30 p-6 h-[280px] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center z-10">
              <span className="text-[10px] uppercase font-bold text-[var(--m-text-tertiary)]">Monthly Conversation Growth</span>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                +24% Year Over Year
              </span>
            </div>

            {/* SVG Chart paths */}
            <svg className="absolute bottom-0 left-0 right-0 w-full h-[150px] pointer-events-none" viewBox="0 0 500 100" preserveAspectRatio="none">
              <path
                d="M0,90 C100,75 180,30 250,55 C320,80 400,20 500,10 L500,100 L0,100 Z"
                fill="rgba(16, 185, 129, 0.05)"
              />
              <path
                d="M0,90 C100,75 180,30 250,55 C320,80 400,20 500,10"
                fill="none"
                stroke="rgb(16, 185, 129)"
                strokeWidth="2.5"
              />
            </svg>
            <div className="text-3xl font-black text-[var(--m-text-primary)] z-10">145,240</div>
          </div>
        </div>
      </div>

      {/* Analytics Card Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard>
          <RefreshCw className="size-5 text-emerald-400 mb-3 animate-spin" style={{ animationDuration: "12s" }} />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Real-Time Refresh</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Data refreshes automatically. Live metrics show user actions under 1 second. No manually refreshing required.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(6, 182, 212, 0.12)">
          <Zap className="size-5 text-cyan-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Agent Performance Timers</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Review average response latency, deal resolution times, and team task completion metrics.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(168, 85, 247, 0.12)">
          <CheckCheck className="size-5 text-purple-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">SLA Auditing</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Validate sending rates, templates delivery reliability, and message queues to align with service guarantees.
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
