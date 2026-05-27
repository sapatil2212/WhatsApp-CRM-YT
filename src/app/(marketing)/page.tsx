"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, MessageSquare, Shield, Zap, TrendingUp, Users } from "lucide-react";
import { ReferenceGrid } from "@/components/marketing/reference-grid";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { MagneticButton } from "@/components/marketing/magnetic-button";
import { AIChatSimulation } from "@/components/marketing/ai-chat-simulation";
import { WorkflowVisualizer } from "@/components/marketing/workflow-visualizer";
import { CRMPreviewBoard } from "@/components/marketing/crm-preview-board";
import { ReferenceDashboard } from "@/components/marketing/reference-dashboard";
import { AnimatedMetrics } from "@/components/marketing/animated-metrics";
import { InfiniteLogoMarquee } from "@/components/marketing/infinite-logo-marquee";
import { FloatingNotification } from "@/components/marketing/floating-notification";

export default function HomePage() {
  return (
    <div className="w-full flex flex-col overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[88vh] flex flex-col items-center justify-start pt-24 md:pt-32 pb-0 px-4 md:px-6 overflow-hidden">
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
            className="text-4xl sm:text-6xl md:text-7.5xl font-semibold tracking-tight leading-[1.1] max-w-4xl text-[var(--m-text-heading)] transition-colors duration-300"
          >
            The AI WhatsApp CRM your product needs
          </motion.h1>
          
          {/* Centered Descriptive Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-base max-w-2xl mt-6 leading-relaxed text-[var(--m-text-tertiary)] transition-colors duration-300"
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
            <Link
              href="/book-demo"
              className="bg-[var(--m-bg-secondary)]/85 border border-[var(--m-border-primary)] hover:bg-[var(--m-bg-tertiary)]/85 text-[var(--m-text-secondary)] px-8 py-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center"
            >
              Learn More
            </Link>
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

      {/* 2. TRUST / MARQUEE SECTION */}
      <section className="py-12 relative border-y border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/20 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest mb-6 text-[var(--m-text-muted)] transition-colors duration-300">
            TRUSTED BY THE WORLD'S BEST HYPER-GROWTH TEAMS
          </span>
          <InfiniteLogoMarquee speed="medium" />
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

      {/* 4. METRICS / NUMBERS IN VIEW */}
      <section className="py-14 border-t border-[var(--m-border-primary)] bg-[var(--m-bg-secondary)]/10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest mb-2 block text-[var(--m-text-muted)] transition-colors">
            PLATFORM CAPACITIES & METRICS
          </span>
          <AnimatedMetrics />
        </div>
      </section>

      {/* 5. WORKFLOW AUTOMATION BUILDER */}
      <section className="py-24 px-4 md:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wide">
            <Zap className="size-4" /> Trigger Workflows
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--m-text-heading)] transition-colors duration-300">
            Connect CRM Actions in Real-Time.
          </h2>
          <p className="text-sm text-[var(--m-text-tertiary)] transition-colors duration-300">
            Build custom automation rules. Define triggers (e.g. lead replies to broadcast) and map them to actions (update CRM deal, send webhook, dispatch notification, route owner).
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/5 blur-[120px] pointer-events-none" />
          <WorkflowVisualizer />
        </div>
      </section>

      {/* 6. CRM BOARD SHOWCASE */}
      <section className="py-24 px-4 md:px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        <div className="lg:col-span-2 relative">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] pointer-events-none" />
          <CRMPreviewBoard />
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wide">
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

      {/* 7. DETAILED FEATURE CARDS (HANDCRAFTED) */}
      <section className="py-24 px-4 md:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--m-text-heading)] transition-colors duration-300">
            Handcrafted for Growth.
          </h2>
          <p className="text-sm text-[var(--m-text-tertiary)] transition-colors duration-300">
            Every feature is designed to be highly reliable, visually clean, and lightning fast.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <SpotlightCard>
            <Bot className="size-6 text-emerald-400 mb-4" />
            <h4 className="text-sm font-semibold text-[var(--m-text-primary)] transition-colors duration-300">
              WhatsApp Broadcasts
            </h4>
            <p className="text-xs mt-2 leading-relaxed text-[var(--m-text-tertiary)] transition-colors duration-300">
              Send personalized template messages to segmented lists. Support media headers (images, documents) and custom quick-reply buttons.
            </p>
          </SpotlightCard>

          {/* Card 2 */}
          <SpotlightCard glowColor="rgba(59, 130, 246, 0.15)">
            <MessageSquare className="size-6 text-blue-400 mb-4" />
            <h4 className="text-sm font-semibold text-[var(--m-text-primary)] transition-colors duration-300">
              Shared Team Inbox
            </h4>
            <p className="text-xs mt-2 leading-relaxed text-[var(--m-text-tertiary)] transition-colors duration-300">
              Enable multiple agents to manage the same WhatsApp number. Assign threads, leave internal notes, and avoid customer collision.
            </p>
          </SpotlightCard>

          {/* Card 3 */}
          <SpotlightCard glowColor="rgba(168, 85, 247, 0.15)">
            <Shield className="size-6 text-purple-400 mb-4" />
            <h4 className="text-sm font-semibold text-[var(--m-text-primary)] transition-colors duration-300">
              Meta API Compliant
            </h4>
            <p className="text-xs mt-2 leading-relaxed text-[var(--m-text-tertiary)] transition-colors duration-300">
              Built on official WhatsApp Cloud API hosts. Zero risk of numbers getting banned. Secure data transport and end-to-end reliability.
            </p>
          </SpotlightCard>
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
            <Link
              href="/book-demo"
              className="px-6 py-3 rounded-xl text-xs font-semibold transition-all border bg-[var(--m-bg-secondary)] border-[var(--m-border-primary)] text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-tertiary)]"
            >
              Contact Enterprise
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
