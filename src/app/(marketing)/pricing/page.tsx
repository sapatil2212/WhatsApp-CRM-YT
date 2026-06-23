"use client";

import React from "react";
import Link from "next/link";
import { Check, HelpCircle, Sparkles, X } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { MagneticButton } from "@/components/marketing/magnetic-button";
import { BookDemoTrigger } from "@/components/marketing/book-demo-trigger";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      tagline: "Full control. You run it.",
      price: "₹2,999",
      subtext: "/WABA/month",
      setupFee: "No setup fee",
      ctaText: "Get Started",
      ctaLink: "/login",
      ctaType: "link",
      popular: false,
      footerText: "Access provisioned within 24 hours of payment."
    },
    {
      name: "Growth",
      tagline: "We launch you. You own it.",
      price: "₹9,999",
      subtext: "for first month",
      setupFee: "₹2,999 /WABA/month after",
      ctaText: "Book a Call",
      ctaType: "trigger",
      popular: true,
      badge: "Recommended • Done For You",
      footerText: "Onboarding begins within 48 hours. Setup complete within 7 days."
    },
    {
      name: "Managed",
      tagline: "We run it. You check results.",
      price: "₹29,999",
      subtext: "for first month",
      setupFee: "₹2,999 /WABA/month after",
      ctaText: "Book a Call",
      ctaType: "trigger",
      popular: false,
      badge: "Done For You",
      footerText: "Application required. Pilot month available — ask us."
    }
  ];

  const features = {
    platform: {
      title: "The Platform",
      rows: [
        { name: "No-Code Automation Builder", starter: "check", growth: "check", managed: "check" },
        { name: "AI Assistant (trained on your docs)", starter: "DIY", growth: "DIY", managed: "We configure it" },
        { name: "Shared Team Inbox", starter: "check", growth: "check", managed: "check" },
        { name: "27+ Integrations", starter: "check", growth: "check", managed: "check" },
        { name: "0% Message Markup", starter: "check", growth: "check", managed: "check" },
        { name: "Click-to-WhatsApp Ads (CTWA)", starter: "check", growth: "check", managed: "check" }
      ]
    },
    setup: {
      title: "Setup & Onboarding",
      rows: [
        { name: "Meta Business Verification", starter: "DIY", growth: "DIY", managed: "check" },
        { name: "WhatsApp Number Connection", starter: "DIY", growth: "check", managed: "check" },
        { name: "WhatsApp Co-existence Setup", starter: "DIY", growth: "check", managed: "check" },
        { name: "Platform Configuration & Team Access", starter: "DIY", growth: "check", managed: "check" },
        { name: "Kickoff Meeting", starter: "DIY", growth: "check", managed: "check" },
        { name: "Automations Built For You", starter: "DIY", growth: "DIY", managed: "2–3 core automations" },
        { name: "Message Templates Written & Submitted", starter: "DIY", growth: "DIY", managed: "check" },
        { name: "Integrations Wired In", starter: "DIY", growth: "DIY", managed: "check" }
      ]
    },
    support: {
      title: "Support & Strategy",
      rows: [
        { name: "Priority WhatsApp Support Group", starter: "check", growth: "check", managed: "check" },
        { name: "Monthly Group Q&A with Lakshit", starter: "check", growth: "check", managed: "check" },
        { name: "1-on-1 Strategy Call", starter: "DIY", growth: "Onboarding call included", managed: "Monthly deep-dive (60 min)" },
        { name: "Meta Template Fast-Track Approvals", starter: "DIY", growth: "DIY", managed: "check" },
        { name: "Dedicated Account Manager", starter: "DIY", growth: "DIY", managed: "check" }
      ]
    }
  };

  const renderValue = (val: string) => {
    if (val === "check") {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400">
          <Check className="size-3.5" />
        </span>
      );
    }
    if (val === "DIY") {
      return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[var(--m-text-tertiary)]">DIY</span>;
    }
    return <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{val}</span>;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-24">
      {/* Page Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="size-3" /> pricing
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.1]">
          Pricing <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            One platform. Three ways to get started.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] max-w-xl mx-auto">
          After setup, every plan is ₹2,999/WABA/month — flat. The difference is how much help you get on day one. You choose your level of support.
        </p>
      </div>

      {/* Plan Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <SpotlightCard
            key={plan.name}
            interactive={true}
            className={plan.popular ? "border-emerald-500/50 shadow-lg shadow-emerald-950/5 relative" : "border-[var(--m-border-primary)]/85"}
            glowColor={plan.popular ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.08)"}
          >
            {plan.badge && (
              <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                {plan.badge}
              </div>
            )}
            <div className="space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <span className="text-xs font-bold text-[var(--m-text-tertiary)] uppercase tracking-widest">{plan.name}</span>
                <h4 className="text-sm text-[var(--m-text-secondary)] font-semibold min-h-[20px]">{plan.tagline}</h4>
                
                <div className="flex items-baseline gap-1 py-2 border-y border-[var(--m-border-primary)]/50">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[var(--m-text-heading)]">{plan.price}</span>
                  <span className="text-xs text-[var(--m-text-muted)]">{plan.subtext}</span>
                </div>
                <div className="text-xs font-medium text-emerald-400/90">{plan.setupFee}</div>
              </div>

              <div className="space-y-4 pt-4">
                {plan.ctaType === "link" ? (
                  <Link
                    href={plan.ctaLink || "#"}
                    className="w-full py-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  >
                    {plan.ctaText}
                  </Link>
                ) : (
                  <BookDemoTrigger className="w-full py-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] hover:bg-[var(--m-bg-tertiary)] text-[var(--m-text-secondary)]">
                    {plan.ctaText}
                  </BookDemoTrigger>
                )}
                <div className="text-[10px] text-[var(--m-text-muted)] text-center leading-relaxed">{plan.footerText}</div>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-[var(--m-text-muted)] font-medium">*Pricing exclusive of GST</p>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="space-y-8 pt-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--m-text-heading)]">Compare Plan Features</h2>
          <p className="text-xs text-[var(--m-text-tertiary)]">Detailed capability matrix across all setup tiers</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/10 backdrop-blur-md">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/40 text-[var(--m-text-secondary)] font-bold text-xs">
                <th className="p-4 w-[40%]">All plans · per WABA/month</th>
                <th className="p-4 text-center w-[20%]">Starter</th>
                <th className="p-4 text-center w-[20%]">Growth</th>
                <th className="p-4 text-center w-[20%]">Managed</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(features).map(([key, section]) => (
                <React.Fragment key={key}>
                  <tr className="bg-[var(--m-bg-secondary)]/20 border-b border-[var(--m-border-primary)]">
                    <td colSpan={4} className="px-4 py-3 text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                      {section.title}
                    </td>
                  </tr>
                  {section.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      className="border-b border-[var(--m-border-primary)]/50 hover:bg-[var(--m-bg-secondary)]/15 transition-colors duration-150"
                    >
                      <td className="p-4 text-xs font-semibold text-[var(--m-text-secondary)]">{row.name}</td>
                      <td className="p-4 text-center">{renderValue(row.starter)}</td>
                      <td className="p-4 text-center">{renderValue(row.growth)}</td>
                      <td className="p-4 text-center">{renderValue(row.managed)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Callout */}
      <div className="text-center space-y-4">
        <BookDemoTrigger className="inline-flex items-center gap-1 text-sm font-semibold transition-colors text-emerald-500 hover:text-emerald-400">
          Not sure which plan? Talk to us →
        </BookDemoTrigger>
      </div>
    </div>
  );
}
