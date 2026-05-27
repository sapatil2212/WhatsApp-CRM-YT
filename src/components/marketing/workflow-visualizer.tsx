"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Bot,
  UserCheck,
  Calendar,
  DollarSign,
  PartyPopper,
  CheckCircle2,
  Circle,
  Loader2,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  borderActive: string;
  logLines: string[];
}

const STEPS: Step[] = [
  {
    id: "1",
    label: "Lead Inbound",
    sub: "WhatsApp message received",
    icon: MessageSquare,
    color: "text-emerald-400",
    glow: "rgba(16,185,129,0.35)",
    borderActive: "border-emerald-500",
    logLines: [
      "→ Inbound message from +1 (555) 021-••••",
      "→ Source: Meta Ads campaign #WA-2024",
      "→ Trigger: new_conversation fired",
    ],
  },
  {
    id: "2",
    label: "AI Qualifies Lead",
    sub: "Intent detection & scoring",
    icon: Bot,
    color: "text-cyan-400",
    glow: "rgba(6,182,212,0.35)",
    borderActive: "border-cyan-500",
    logLines: [
      "→ NLP intent: purchase_inquiry (0.94)",
      "→ Lead score: 82 / 100  [HIGH]",
      "→ Language: English  |  Sentiment: positive",
    ],
  },
  {
    id: "3",
    label: "Auto Booking",
    sub: "Calendar slot reserved",
    icon: Calendar,
    color: "text-purple-400",
    glow: "rgba(168,85,247,0.35)",
    borderActive: "border-purple-500",
    logLines: [
      "→ Available slot: Thu 29 May · 10:00 AM",
      "→ Google Calendar event created",
      "→ Confirmation sent via WhatsApp ✓",
    ],
  },
  {
    id: "4",
    label: "Assign Sales Rep",
    sub: "CRM routing by territory",
    icon: UserCheck,
    color: "text-amber-400",
    glow: "rgba(245,158,11,0.35)",
    borderActive: "border-amber-500",
    logLines: [
      "→ Territory match: North-East region",
      "→ Assigned to: Sarah K. (load: 12 deals)",
      "→ CRM deal #4821 created  [stage: Qualified]",
    ],
  },
  {
    id: "5",
    label: "Follow-up & Pay",
    sub: "Payment link dispatched",
    icon: DollarSign,
    color: "text-emerald-400",
    glow: "rgba(16,185,129,0.35)",
    borderActive: "border-emerald-500",
    logLines: [
      "→ Proposal template: Enterprise-v3 sent",
      "→ Payment link: $2,400 · Stripe checkout",
      "→ Read receipt confirmed · 14:32 UTC",
    ],
  },
  {
    id: "6",
    label: "Closed Won",
    sub: "Deal converted 🎉",
    icon: PartyPopper,
    color: "text-pink-400",
    glow: "rgba(236,72,153,0.35)",
    borderActive: "border-pink-500",
    logLines: [
      "→ Payment received: $2,400 ✓",
      "→ CRM stage updated: Closed Won",
      "→ Automation complete · 4m 12s total",
    ],
  },
];

const STEP_DURATION = 2600; // ms per step

export function WorkflowVisualizer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Advance step on interval
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STEPS.length);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, []);

  // Stream log lines whenever active step changes
  useEffect(() => {
    setVisibleLines([]);
    const lines = STEPS[activeIndex].logLines;
    lines.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
      }, i * 320);
    });
  }, [activeIndex]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const activeStep = STEPS[activeIndex];

  return (
    <div className="w-full rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] backdrop-blur-md overflow-hidden shadow-[var(--m-shadow-card)]">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/60">
        <Zap className="size-3.5 text-cyan-400" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--m-text-muted)]">
          Automation Engine · Live Run
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">Running</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--m-border-primary)]">
        {/* LEFT — step list */}
        <div className="p-5 space-y-1">
          {STEPS.map((step, i) => {
            const isActive = i === activeIndex;
            const isDone = i < activeIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                animate={{ opacity: isActive ? 1 : isDone ? 0.7 : 0.35 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-300",
                  isActive && "bg-[var(--m-bg-secondary)]"
                )}
              >
                {/* Status icon */}
                <div className="shrink-0 relative">
                  {isDone ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    >
                      <Loader2 className={cn("size-4", step.color)} />
                    </motion.div>
                  ) : (
                    <Circle className="size-4 text-[var(--m-text-muted)]" />
                  )}
                </div>

                {/* Node icon box */}
                <motion.div
                  animate={{
                    boxShadow: isActive
                      ? `0 0 14px ${step.glow}`
                      : "0 0 0px transparent",
                  }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                    isActive
                      ? `bg-[var(--m-bg-tertiary)] ${step.borderActive}`
                      : isDone
                      ? "bg-[var(--m-bg-secondary)] border-emerald-600/30"
                      : "bg-[var(--m-bg-primary)] border-[var(--m-border-glass)]"
                  )}
                >
                  <Icon className={cn("size-3.5", isActive ? step.color : isDone ? "text-emerald-500/60" : "text-[var(--m-text-muted)]")} />
                </motion.div>

                {/* Labels */}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-xs font-semibold leading-none transition-colors duration-300",
                    isActive ? "text-[var(--m-text-primary)]" : isDone ? "text-[var(--m-text-secondary)]" : "text-[var(--m-text-muted)]"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[10px] mt-1 text-[var(--m-text-muted)] truncate">{step.sub}</p>
                </div>

                {/* Step number */}
                <span className={cn(
                  "shrink-0 text-[10px] font-mono font-bold transition-colors duration-300",
                  isActive ? step.color : "text-[var(--m-text-muted)]"
                )}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* RIGHT — execution log terminal */}
        <div className="flex flex-col">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/40">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-[10px] font-mono text-[var(--m-text-muted)] ml-1">
              execution.log
            </span>
          </div>

          {/* Log body */}
          <div
            ref={logRef}
            className="flex-1 min-h-[220px] max-h-[280px] overflow-y-auto p-4 font-mono text-[11px] space-y-3 bg-[var(--m-bg-primary)]"
          >
            {/* Active step header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.id + "-header"}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <span className={cn("font-bold", activeStep.color)}>
                  [{String(activeIndex + 1).padStart(2, "0")}]
                </span>
                <span className="text-[var(--m-text-secondary)] font-semibold">
                  {activeStep.label}
                </span>
                <ArrowRight className="size-3 text-[var(--m-text-muted)]" />
                <span className="text-[var(--m-text-muted)]">{activeStep.sub}</span>
              </motion.div>
            </AnimatePresence>

            {/* Streamed log lines */}
            <AnimatePresence>
              {visibleLines.map((line, i) => (
                <motion.p
                  key={activeStep.id + "-" + i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[var(--m-text-muted)] pl-4 leading-relaxed"
                >
                  {line}
                </motion.p>
              ))}
            </AnimatePresence>

            {/* Blinking cursor */}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className={cn("inline-block w-1.5 h-3 rounded-sm ml-4", activeStep.color.replace("text-", "bg-"))}
            />
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-[var(--m-border-primary)]">
            <motion.div
              key={activeIndex}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: STEP_DURATION / 1000, ease: "linear" }}
              className={cn("h-full", activeStep.color.replace("text-", "bg-"))}
            />
          </div>

          {/* Step counter footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--m-bg-secondary)]/40">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === activeIndex
                      ? cn("w-4", activeStep.color.replace("text-", "bg-"))
                      : i < activeIndex
                      ? "w-1 bg-emerald-500/50"
                      : "w-1 bg-[var(--m-border-primary)]"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-[var(--m-text-muted)]">
              step {activeIndex + 1} / {STEPS.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
