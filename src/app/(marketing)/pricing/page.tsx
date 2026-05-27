"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, HelpCircle, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { MagneticButton } from "@/components/marketing/magnetic-button";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [agents, setAgents] = useState(5);
  const [volume, setVolume] = useState(20000); // 20k messages

  // Price calculations
  const isYearly = billingCycle === "yearly";
  const basePrices = {
    starter: isYearly ? 39 : 49,
    pro: isYearly ? 79 : 99,
    growth: isYearly ? 159 : 199,
  };

  // ROI Calculator Calculations
  // Estimated manual hours saved: 1 hour per 50 messages handled by AI (assume 80% AI handling)
  const hoursSaved = Math.round((volume * 0.8) / 50);
  // Estimate labor cost saved (assume $25/hour average agent cost)
  const savings = hoursSaved * 25;
  // Estimate pipeline conversion increase (assume 1.5% extra closes, average ticket $150)
  const conversionIncrease = Math.round(volume * 0.015 * 150);

  const tiers = [
    {
      name: "Starter",
      desc: "For growing SMB teams testing automated chat marketing.",
      price: basePrices.starter,
      features: [
        "1 WhatsApp Business Number",
        "3 Shared Inbox Agents included",
        "Up to 5,000 Messages / month",
        "Standard AI Auto-Responder",
        "Basic Contact Segmentation",
        "Web + Mobile App Access",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      desc: "For mid-market sales teams scaling client qualification.",
      price: basePrices.pro,
      features: [
        "2 WhatsApp Business Numbers",
        "10 Shared Inbox Agents included",
        "Up to 25,000 Messages / month",
        "Advanced Intent-Based AI Agent",
        "Custom Rules & Webhooks",
        "Zapier & CRM native integrations",
        "99.9% Deliverability SLA",
      ],
      cta: "Get Professional",
      popular: true,
    },
    {
      name: "Scale & Growth",
      desc: "For enterprise brands automating heavy outbound volume.",
      price: basePrices.growth,
      features: [
        "Unlimited WhatsApp Numbers",
        "Unlimited Shared Inbox Agents",
        "Up to 100,000 Messages / month",
        "Custom Fine-tuned LLM Agents",
        "Dedicated Database / Region",
        "SAML/SSO & Audit logs",
        "Dedicated Account Manager",
      ],
      cta: "Get Growth Tier",
      popular: false,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Page Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="size-3" /> transparent pricing
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.1]">
          Flexible Pricing <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Built for Hyper-Growth.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] max-w-xl mx-auto">
          Start for free, upgrade as you grow. Fully compliant with official Meta API policies.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={billingCycle === "monthly" ? "text-[var(--m-text-secondary)] font-semibold text-xs" : "text-[var(--m-text-muted)] text-xs"}>
          Billed Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
          className="relative w-11 h-6 bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] rounded-full flex items-center p-0.5 cursor-pointer"
        >
          <div
            className={`w-4.5 h-4.5 bg-emerald-500 rounded-full transition-transform duration-300 ${
              billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className={billingCycle === "yearly" ? "text-[var(--m-text-secondary)] font-semibold text-xs flex items-center gap-1.5" : "text-[var(--m-text-muted)] text-xs flex items-center gap-1.5"}>
          Billed Annually <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">SAVE 20%</span>
        </span>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <SpotlightCard
            key={tier.name}
            interactive={true}
            className={tier.popular ? "border-emerald-500/50 shadow-lg shadow-emerald-950/5 relative" : "border-[var(--m-border-primary)]/80"}
            glowColor={tier.popular ? "rgba(16, 185, 129, 0.18)" : "rgba(148, 163, 184, 0.1)"}
          >
            {tier.popular && (
              <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                Most Popular
              </div>
            )}
            <div className="space-y-4">
              <span className="text-xs font-bold text-[var(--m-text-tertiary)] uppercase tracking-widest">{tier.name}</span>
              <p className="text-xs text-[var(--m-text-tertiary)] min-h-[36px]">{tier.desc}</p>
              
              <div className="flex items-baseline gap-1 py-2">
                <span className="text-4xl font-extrabold text-[var(--m-text-heading)]">${tier.price}</span>
                <span className="text-xs text-[var(--m-text-muted)]">/ month</span>
              </div>

              <ul className="space-y-3.5 border-t border-[var(--m-border-primary)] pt-4">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex gap-2.5 items-start text-xs text-[var(--m-text-secondary)]">
                    <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-6">
                <Link
                  href="/login"
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    tier.popular
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : "bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] hover:bg-[var(--m-bg-tertiary)] text-[var(--m-text-secondary)]"
                  }`}
                >
                  {tier.cta} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* ROI CALCULATOR SECTION */}
      <div className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/5 to-cyan-950/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--m-text-primary)] flex items-center justify-center gap-2">
              Calculate Your WhatsApp ROI <TrendingUp className="size-5 text-emerald-400" />
            </h3>
            <p className="text-xs text-[var(--m-text-tertiary)]">See how much labor cost and conversation value you recover with automation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            {/* Input Sliders */}
            <div className="space-y-6 bg-[var(--m-bg-secondary)]/30 border border-[var(--m-border-glass)]/60 p-6 rounded-xl">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--m-text-tertiary)] font-medium">Shared Inbox Agents</span>
                  <span className="text-[var(--m-text-heading)] font-bold">{agents} reps</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={agents}
                  onChange={(e) => setAgents(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-[var(--m-bg-tertiary)] h-1.5 rounded-full outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--m-text-tertiary)] font-medium">Monthly Messages</span>
                  <span className="text-[var(--m-text-heading)] font-bold">{volume.toLocaleString()} msgs</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-[var(--m-bg-tertiary)] h-1.5 rounded-full outline-none"
                />
              </div>
            </div>

            {/* Calculations Output */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--m-bg-primary)] border border-[var(--m-border-glass)] p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[var(--m-text-muted)]">Labor Saved / Mo</span>
                <h4 className="text-xl sm:text-2xl font-extrabold text-emerald-500 mt-1">${savings.toLocaleString()}</h4>
                <p className="text-[10px] text-[var(--m-text-muted)] mt-1">Based on {hoursSaved} automated response hours.</p>
              </div>

              <div className="bg-[var(--m-bg-primary)] border border-[var(--m-border-glass)] p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[var(--m-text-muted)]">Addtl Conversion / Mo</span>
                <h4 className="text-xl sm:text-2xl font-extrabold text-cyan-400 mt-1">${conversionIncrease.toLocaleString()}</h4>
                <p className="text-[10px] text-[var(--m-text-muted)] mt-1">Based on 1.5% lead recovery.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
