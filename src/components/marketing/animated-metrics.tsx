"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCheck, Zap, Sparkles } from "lucide-react";

interface MetricProps {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

function Counter({ value, suffix = "", decimals = 0, duration = 2 }: MetricProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const totalSteps = 60;
    const stepTime = (duration * 1000) / totalSteps;
    const increment = (end - start) / totalSteps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      start += increment;
      if (step >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Number(start.toFixed(decimals)));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value, decimals, duration]);

  return (
    <span ref={ref} className="font-mono">
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function AnimatedMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto py-10">
      {/* Metric 1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase font-bold text-[var(--m-text-tertiary)]">Deliverability</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCheck className="size-4" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--m-text-primary)] flex items-baseline gap-0.5">
            <Counter value={99.8} suffix="%" decimals={1} />
          </h3>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2">Guaranteed throughput via WhatsApp Meta Business API Cloud hosts.</p>
        </div>
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl" />
      </motion.div>

      {/* Metric 2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase font-bold text-[var(--m-text-tertiary)]">Broadcast Capacity</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Zap className="size-4" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--m-text-primary)] flex items-baseline gap-0.5">
            <Counter value={24.2} suffix="M+" decimals={1} />
          </h3>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2">Millions of monthly triggered follow-ups, payment confirmations, & templates.</p>
        </div>
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl" />
      </motion.div>

      {/* Metric 3 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase font-bold text-[var(--m-text-tertiary)]">AI Automation Rate</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="size-4" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--m-text-primary)] flex items-baseline gap-0.5">
            <Counter value={86.4} suffix="%" decimals={1} />
          </h3>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2">Chat conversations handled completely autonomously without human intervention.</p>
        </div>
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-purple-500/5 blur-2xl" />
      </motion.div>
    </div>
  );
}
