"use client";

import React from "react";
import { Sparkles, Users, Award, ShieldAlert, Bot } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

export default function AboutPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="size-3 animate-pulse" /> our mission
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.1]">
          Humanizing Automated <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Conversational Sales.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] max-w-xl mx-auto">
          We build tools that let startups and global enterprises automate user conversations without sacrificing human warmth or client experience.
        </p>
      </div>

      {/* Core values grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard>
          <Bot className="size-5 text-emerald-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">AI Intelligence First</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            We build intent classification agents that understand natural slangs, regional languages, and details, ensuring customers get accurate replies.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(6, 182, 212, 0.12)">
          <Users className="size-5 text-cyan-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Collaborative Design</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            CRMs shouldn't be boring spreadsheets. We build clean, high-motion, visual boards that make managing relationships a joy.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(168, 85, 247, 0.12)">
          <Award className="size-5 text-purple-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Premium Standards</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            We focus on Apple-level polish, Stripe-level documentation, and rock-solid Meta API compliance.
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
