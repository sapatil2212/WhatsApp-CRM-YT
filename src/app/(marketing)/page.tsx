"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, MessageSquare, Shield, TrendingUp, Users } from "lucide-react";
import { ReferenceGrid } from "@/components/marketing/reference-grid";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { MagneticButton } from "@/components/marketing/magnetic-button";
import { AIChatSimulation } from "@/components/marketing/ai-chat-simulation";
import { CRMPreviewBoard } from "@/components/marketing/crm-preview-board";
import { ReferenceDashboard } from "@/components/marketing/reference-dashboard";
import { SocialProofMetrics } from "@/components/marketing/social-proof-metrics";
import { BookDemoTrigger } from "@/components/marketing/book-demo-trigger";

export default function HomePage() {
  return (
    <div className="w-full flex flex-col overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[88vh] flex flex-col items-center justify-start pt-20 md:pt-28 pb-0 px-4 md:px-6 overflow-hidden">
        {/* Exact Staggered Grid Background from Reference Image */}
        <ReferenceGrid gridSize={85} />
        
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10 pt-4">
          {/* Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/50 text-[var(--m-text-secondary)] text-[11px] font-semibold mb-8 shadow-lg transition-all duration-300"
          >
            🔥 Launching AI WhatsApp CRM v2.0
          </motion.div>
          
          {/* Solid Semibold Headline (Apple/OpenAI weight) */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] max-w-3xl text-[var(--m-text-heading)] transition-colors duration-300"
          >
            The AI WhatsApp CRM your product needs
          </motion.h1>
          
          {/* Centered Descriptive Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs sm:text-sm md:text-sm max-w-xl mt-5 leading-relaxed text-[var(--m-text-tertiary)] transition-colors duration-300"
          >
            Our AI CRM solution enhances your customer support with advanced artificial intelligence, streamlining sales operations and driving efficiency and conversion.
          </motion.p>
          
          {/* Solid Pill-shaped Buttons - Centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-row items-center justify-center gap-4 mt-8 w-full relative z-20"
          >
            <MagneticButton>
              <Link
                href="/login"
                className="bg-[#00DF82] hover:bg-[#00c673] text-slate-950 px-8 py-3 rounded-full text-xs font-semibold transition-all shadow-[0_4px_20px_rgba(0,223,130,0.15)] flex items-center justify-center"
              >
                Get Started
              </Link>
            </MagneticButton>
            <BookDemoTrigger className="bg-[var(--m-bg-secondary)]/85 border border-[var(--m-border-primary)] hover:bg-[var(--m-bg-tertiary)]/85 text-[var(--m-text-secondary)] px-8 py-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center">
              Learn More
            </BookDemoTrigger>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 55 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-6xl mt-10 mx-auto relative z-10"
        >
          <ReferenceDashboard />
        </motion.div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="py-24 px-4 md:px-6 max-w-6xl mx-auto space-y-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--m-text-heading)] transition-colors duration-300">
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

      {/* 3. AI CHAT EXPERIENCE STORY */}
      <section className="py-24 px-4 md:px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
            <Bot className="size-4" /> Autonomous Auto-Responder
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-[var(--m-text-heading)] transition-colors duration-300">
            An AI Assistant that Qualifies 24/7.
          </h2>
          <p className="text-sm leading-relaxed text-[var(--m-text-tertiary)] transition-colors duration-300">
            Our AI auto-responder reads inbound WhatsApp messages, detects client intent, answers queries instantly using your customized knowledgebase, and assigns appropriate CRM tags so your sales reps are queued only with high-value leads.
          </p>

          {/* Bullet points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex gap-2">
              <span className="text-emerald-400 font-bold font-mono">✓</span>
              <div>
                <h4 className="text-xs font-semibold text-[var(--m-text-secondary)] transition-colors duration-300">
                  Natural Intent Check
                </h4>
                <p className="text-[11px] mt-0.5 text-[var(--m-text-tertiary)] transition-colors duration-300">
                  Understands slang, multiple languages, and attachments.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-emerald-400 font-semibold font-mono">✓</span>
              <div>
                <h4 className="text-xs font-semibold text-[var(--m-text-secondary)] transition-colors duration-300">
                  Instant Booking Sync
                </h4>
                <p className="text-[11px] mt-0.5 text-[var(--m-text-tertiary)] transition-colors duration-300">
                  Allows leads to schedule appointments via WhatsApp directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Chat simulation visual component */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/5 blur-[90px] pointer-events-none" />
          <AIChatSimulation />
        </div>
      </section>

      {/* 4. SOCIAL PROOF / METRICS */}
      <section className="py-24 px-4 md:px-6 border-y border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/10 transition-colors duration-300 relative">
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-950/20 text-emerald-400 text-[11px] font-semibold tracking-wide uppercase">
              ✨ Social Proof
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--m-text-heading)] transition-colors duration-300">
              Trusted by 10,000+ businesses
            </h2>
            <p className="text-sm text-[var(--m-text-tertiary)] max-w-xl mx-auto transition-colors duration-300">
              See why growing businesses choose ChatNexGen Ai to automate their WhatsApp communication.
            </p>
          </motion.div>

          <SocialProofMetrics />
        </div>
      </section>

      {/* 6. CRM BOARD SHOWCASE */}
      <section className="py-24 px-4 md:px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        <div className="lg:col-span-2 relative">
          <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] pointer-events-none" />
          <CRMPreviewBoard />
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wide">
            <Users className="size-4" /> CRM Pipelines
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-[var(--m-text-heading)] transition-colors duration-300">
            A Sales Pipeline Designed for Chat.
          </h2>
          <p className="text-sm leading-relaxed text-[var(--m-text-tertiary)] transition-colors duration-300">
            Standard CRMs are built for emails and calls. WA CRM is built specifically for WhatsApp threads. Track deal values, assign conversations, trigger follow-ups, and review engagement metrics at every step of your kanban board.
          </p>
          <div className="pt-2">
            <Link
              href="/crm"
              className="text-xs font-semibold transition-colors flex items-center gap-1 text-emerald-500 hover:text-emerald-400"
            >
              Explore CRM Pipeline features <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>


      {/* 8. GIANT CTA SECTION */}
      <section className="py-24 px-4 md:px-6 relative text-center max-w-6xl mx-auto border-t border-[var(--m-border-primary)] transition-colors duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[350px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

        <div className="space-y-6 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-[var(--m-text-heading)] transition-colors duration-300">
            Ready to Automate your WhatsApp?
          </h2>
          <p className="text-sm max-w-xl mx-auto text-[var(--m-text-tertiary)] transition-colors duration-300">
            Get started in 5 minutes. Connect your Meta Business account, setup your AI agent, and watch your conversions grow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <MagneticButton>
              <Link
                href="/login"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl text-xs font-semibold transition-all shadow-[0_0_16px_rgba(16,185,129,0.2)] hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] flex items-center gap-1.5"
              >
                Start Free Trial <ArrowRight className="size-3.5" />
              </Link>
            </MagneticButton>
            <BookDemoTrigger className="px-6 py-3 rounded-xl text-xs font-semibold transition-all border bg-[var(--m-bg-secondary)] border-[var(--m-border-primary)] text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-tertiary)]">
              Contact Enterprise
            </BookDemoTrigger>
          </div>
        </div>
      </section>
    </div>
  );
}
