"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

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

export function SocialProofMetrics() {
  const stats = [
    {
      value: 10000,
      suffix: "+",
      label: "Businesses Served",
      decimals: 0,
      glowColor: "var(--color-m-glow-emerald)"
    },
    {
      value: 50,
      suffix: "M+",
      label: "Messages Sent",
      decimals: 0,
      glowColor: "rgba(20, 184, 166, 0.1)" // Teal glow
    },
    {
      value: 98,
      suffix: "%",
      label: "Uptime Guarantee",
      decimals: 0,
      glowColor: "var(--color-m-glow-emerald)" // Emerald glow
    },
    {
      value: 4.9,
      suffix: "/5",
      label: "Customer Rating",
      decimals: 1,
      glowColor: "rgba(20, 184, 166, 0.1)" // Teal glow
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto py-10">
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-[var(--m-border-secondary)] transition-all duration-300"
        >
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] uppercase font-bold text-[var(--m-text-tertiary)] tracking-wider transition-colors duration-300">
              {stat.label}
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--m-text-primary)] flex items-baseline tracking-tight">
              <Counter value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
            </h3>
          </div>
          {/* Glowing backlights */}
          <div 
            className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 transition-colors duration-300" 
            style={{ backgroundColor: stat.glowColor }}
          />
        </motion.div>
      ))}
    </div>
  );
}
