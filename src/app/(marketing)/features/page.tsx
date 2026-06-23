"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { MagneticButton } from "@/components/marketing/magnetic-button";
import { 
  Sparkles, 
  Users, 
  RefreshCw, 
  HelpCircle, 
  Code, 
  Link2, 
  Smartphone, 
  CheckSquare, 
  FileImage, 
  Lock, 
  ArrowRight,
  ShieldAlert,
  Infinity,
  Zap,
  BarChart3,
  Bot
} from "lucide-react";

export default function FeaturesPage() {
  const capabilities = [
    {
      name: "Contact & Segment Management",
      desc: "Know exactly who your customers are. Tag, segment, and filter contacts by behavior, campaign, or attribute — then reach the right people with the right message at the right time.",
      icon: <Users className="size-5 text-emerald-400" />
    },
    {
      name: "Drip Campaigns",
      desc: "Set it once, sell forever. Automated sequences nurture leads, re-engage dormant contacts, and deliver your pitch — on schedule, without your team lifting a finger.",
      icon: <RefreshCw className="size-5 text-teal-400" />
    },
    {
      name: "FAQ Bot",
      desc: "Answer your most common questions before your team even sees them. Configure question-answer pairs once — the bot handles them around the clock, automatically.",
      icon: <HelpCircle className="size-5 text-emerald-400" />
    },
    {
      name: "API & Webhooks",
      desc: "Send WhatsApp messages directly from your server, CRM, or any low-code platform. Full API access, webhook configuration, and developer docs — connect anything that speaks HTTP.",
      icon: <Code className="size-5 text-pink-400" />
    },
    {
      name: "Unlimited Integrations",
      desc: "27+ native integrations out of the box — Shopify, Razorpay, Google Sheets, IndiaMart, JustDial, Calendly, and more. Plus open API and Webhook access to connect any tool, platform, or custom system with no limits.",
      icon: <Link2 className="size-5 text-teal-400" />
    },
    {
      name: "Click-to-WhatsApp Ads",
      desc: "Turn your Facebook and Instagram ads into WhatsApp conversations. Leads click your ad, land in WhatsApp, and get your automated reply instantly — while they're still warm.",
      icon: <Smartphone className="size-5 text-emerald-400" />
    },
    {
      name: "Projects & Tasks",
      desc: "Stay organized without switching tools. Create, assign, and track follow-up tasks inside ChatNexGen Ai — so nothing slips, no matter how fast your business moves.",
      icon: <CheckSquare className="size-5 text-amber-400" />
    },
    {
      name: "Rich Media",
      desc: "Professional conversations don't have to be plain text. Send images, videos, documents, and product catalogs. Keep every message engaging and on-brand.",
      icon: <FileImage className="size-5 text-red-400" />
    },
    {
      name: "Role-Based Access Control",
      desc: "Give your team the right access — nothing more. Assign roles and permissions so every member sees what they need, and sensitive data stays protected.",
      icon: <Lock className="size-5 text-emerald-400" />
    }
  ];

  const metaIntegrations = [
    {
      title: "Official WhatsApp Business API",
      desc: "Direct connection through Meta Business — enterprise-grade delivery, full compliance, and 99.9% message reliability. Your messages arrive, every time.",
      icon: "🔗"
    },
    {
      title: "Click-to-WhatsApp Ads",
      desc: "Your Facebook and Instagram ads drop leads straight into a WhatsApp conversation — with an automated reply waiting before they even finish reading your ad.",
      icon: "📱"
    },
    {
      title: "Build Chatbots Without Code",
      desc: "Launch sales bots, support bots, and lead qualification flows in minutes — with a drag-and-drop builder that requires zero developer involvement.",
      icon: "⚡"
    },
    {
      title: "Real-Time Campaign Analytics",
      desc: "See exactly what's driving revenue. Track delivered, read, replied, and conversion rates live — and retarget warm leads before they cool off.",
      icon: "📊"
    }
  ];

  return (
    <div className="w-full flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full py-20 px-4 md:px-6 max-w-6xl mx-auto space-y-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider"
        >
          <Sparkles className="size-3 animate-pulse" /> capabilities
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.1] max-w-3xl mx-auto"
        >
          Everything you need to <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            automate WhatsApp
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xs sm:text-sm md:text-sm max-w-2xl mx-auto text-[var(--m-text-tertiary)] leading-relaxed"
        >
          Together with the tools above — automated conversations, custom workflows, analytics, and more. Engage customers, nurture leads, and scale without writing code.
        </motion.p>
      </section>

      {/* Grid of Capabilities */}
      <section className="px-4 md:px-6 max-w-6xl mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => (
            <SpotlightCard
              key={cap.name}
              interactive={true}
              glowColor="rgba(16, 185, 129, 0.1)"
            >
              <div className="mb-4 w-10 h-10 rounded-xl bg-[var(--m-bg-secondary)] border border-[var(--m-border-glass)] flex items-center justify-center">
                {cap.icon}
              </div>
              <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">{cap.name}</h4>
              <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">{cap.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 md:px-6 border-t border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/15 max-w-6xl mx-auto space-y-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--m-text-heading)] transition-colors duration-300">
            How it works
          </h2>
          <p className="text-sm text-[var(--m-text-tertiary)] transition-colors duration-300">
            Getting started with ChatNexGen Ai takes minutes, not months.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Connecting Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute top-[20px] left-[20px] w-[calc(66.666%)] h-[1px] bg-emerald-500/20 hidden md:block z-0 origin-left"
          />

          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative flex flex-col items-center md:items-start text-center md:text-left z-10 group"
          >
            <div className="w-10 h-10 rounded-lg border border-emerald-500/30 bg-[var(--m-bg-primary)] flex items-center justify-center text-xs font-semibold text-emerald-400 mb-6 shadow-md shadow-emerald-500/5 group-hover:border-emerald-500 group-hover:text-emerald-300 transition-all duration-300">
              01
            </div>
            <div className="max-w-xs space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-[var(--m-text-heading)] leading-snug transition-colors duration-300">
                Connect and Configure — No Developer Needed
              </h3>
              <p className="text-xs md:text-sm text-[var(--m-text-tertiary)] leading-relaxed transition-colors duration-300">
                Link your WhatsApp number, define your chatbot flows, and set your automation rules — all through a simple visual builder. Most businesses are live within a single afternoon.
              </p>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative flex flex-col items-center md:items-start text-center md:text-left z-10 group"
          >
            <div className="w-10 h-10 rounded-lg border border-emerald-500/30 bg-[var(--m-bg-primary)] flex items-center justify-center text-xs font-semibold text-emerald-400 mb-6 shadow-md shadow-emerald-500/5 group-hover:border-emerald-500 group-hover:text-emerald-300 transition-all duration-300">
              02
            </div>
            <div className="max-w-xs space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-[var(--m-text-heading)] leading-snug transition-colors duration-300">
                Your Business Runs. Conversations Run on Autopilot.
              </h3>
              <p className="text-xs md:text-sm text-[var(--m-text-tertiary)] leading-relaxed transition-colors duration-300">
                Leads get instant replies. Customers get follow-ups. Automated messaging reaches your list instantly. All of it runs in the background while you focus on actually growing.
              </p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative flex flex-col items-center md:items-start text-center md:text-left z-10 group"
          >
            <div className="w-10 h-10 rounded-lg border border-emerald-500/30 bg-[var(--m-bg-primary)] flex items-center justify-center text-xs font-semibold text-emerald-400 mb-6 shadow-md shadow-emerald-500/5 group-hover:border-emerald-500 group-hover:text-emerald-300 transition-all duration-300">
              03
            </div>
            <div className="max-w-xs space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-[var(--m-text-heading)] leading-snug transition-colors duration-300">
                See Exactly What's Making You Money
              </h3>
              <p className="text-xs md:text-sm text-[var(--m-text-tertiary)] leading-relaxed transition-colors duration-300">
                Real-time dashboards show open rates, reply rates, conversions, and drop-offs. Know what's working. Double down on it. Kill what isn't. Every week gets better than the last.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meta Business Integration */}
      <section className="py-24 px-4 md:px-6 border-t border-[var(--m-border-primary)] max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-start relative">
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
            🛡️ Official Meta Partner
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-[var(--m-text-heading)]">
            Meta Business Integration
          </h2>
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[var(--m-text-muted)]">
              Built on the official WhatsApp Business API
            </h4>
            <p className="text-xs md:text-sm leading-relaxed text-[var(--m-text-tertiary)]">
              ChatNexGen Ai connects to the official WhatsApp Business API through Meta Business. Every message you send — automated chatbot replies, customer updates, and notifications — is delivered with enterprise-grade reliability and full Meta compliance. No workarounds. No grey-area tools.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              View Pricing <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {metaIntegrations.map((item) => (
            <SpotlightCard key={item.title} glowColor="rgba(20, 184, 166, 0.1)">
              <div className="text-2xl mb-4">{item.icon}</div>
              <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">{item.title}</h4>
              <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">{item.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Official Meta Business Partner footer-badge */}
      <section className="py-12 border-t border-[var(--m-border-primary)] text-center text-xs font-semibold text-[var(--m-text-muted)]">
        Official Meta Business Partner
      </section>
    </div>
  );
}
