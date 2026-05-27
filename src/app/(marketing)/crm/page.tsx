"use client";

import React from "react";
import { Users, Sparkles, TrendingUp, ShieldAlert, BarChart2, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { CRMPreviewBoard } from "@/components/marketing/crm-preview-board";

export default function CRMPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-950/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
            <Users className="size-3.5" /> Pipeline Operations
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.08]">
            Built Specifically <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              for WhatsApp Leads.
            </span>
          </h1>
          <p className="text-sm text-[var(--m-text-tertiary)] leading-relaxed">
            E-mails and forms are static. WhatsApp conversations are live. Our CRM tracks users, tags intent levels, maps pipeline milestones, and logs interaction histories directly from chat threads.
          </p>
        </div>

        {/* Visual CRM board mockup preview */}
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[95px] pointer-events-none" />
          <CRMPreviewBoard />
        </div>
      </div>

      {/* Details list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard>
          <TrendingUp className="size-5 text-indigo-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Revenue Tracking</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Assign deal values to contacts. Track total pipeline values and forecast conversions based on historical chat milestones.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(168, 85, 247, 0.12)">
          <Sparkles className="size-5 text-purple-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Custom Contact Fields</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Log custom attributes (company domain, target volume, region) and reference them dynamically inside your automated templates.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(6, 182, 212, 0.12)">
          <BarChart2 className="size-5 text-cyan-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Audit Logs & History</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Record every webhook delivery, user text, and AI automated tag. Maintain a full audit trail of contact history for compliance.
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
