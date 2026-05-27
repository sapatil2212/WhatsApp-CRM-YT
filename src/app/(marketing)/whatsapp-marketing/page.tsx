"use client";

import React, { useState } from "react";
import { MessageSquare, Sparkles, Send, CheckCheck, Play, ArrowRight, BarChart2 } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

export default function WhatsAppMarketingPage() {
  const [broadcastName, setBroadcastName] = useState("Acme Flash Sale 2026");
  const [templateText, setTemplateText] = useState(
    "Hi {{1}}! 🌟 Our annual flash sale is active. Use promo code {{2}} to redeem 20% off at check-out."
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/25 bg-purple-950/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
            <MessageSquare className="size-3.5" /> Campaign Broadcasts
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.08]">
            Broadcasting that <br />
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Actually Gets Read.
            </span>
          </h1>
          <p className="text-sm text-[var(--m-text-tertiary)] leading-relaxed">
            Emails end up in spam folders. WhatsApp broadcasts reach screens instantly, generating an average 98% open rate. Send templates, personalization variables, and quick-reply buttons with compliance safety.
          </p>
        </div>

        {/* Visual Broadcast Simulator card */}
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/5 blur-[95px] pointer-events-none" />
          <div className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur flex flex-col justify-between h-[360px] shadow-2xl relative z-10">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-[var(--m-border-primary)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Send className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--m-text-secondary)]">Send Template Broadcast</h4>
                  <p className="text-[9px] text-[var(--m-text-muted)]">Cloud API Send Engine</p>
                </div>
              </div>
              <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded px-1.5 font-bold">META APPROVED</span>
            </div>

            {/* Inputs inside Simulator */}
            <div className="flex-1 space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--m-text-muted)]">Campaign Name</label>
                <input
                  type="text"
                  value={broadcastName}
                  onChange={(e) => setBroadcastName(e.target.value)}
                  className="w-full bg-[var(--m-input-bg)] border border-[var(--m-input-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--m-text-primary)] focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--m-text-muted)]">Personalized Body Text</label>
                <textarea
                  rows={3}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="w-full bg-[var(--m-input-bg)] border border-[var(--m-input-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--m-text-primary)] focus:outline-none focus:border-purple-500/50 resize-none font-sans"
                />
              </div>
            </div>

            {/* Simulated actions */}
            <div className="flex items-center justify-between border-t border-[var(--m-border-primary)] pt-4 mt-2">
              <span className="text-[9px] text-[var(--m-text-muted)]">Est. 12,500 recipients</span>
              <button className="bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                <Play className="size-3" /> Dispatch Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard>
          <CheckCheck className="size-5 text-purple-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Delivery Receipts</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Monitor delivery status in real-time. View exact statistics for sent, delivered, read, and reply rates across lists.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(168, 85, 247, 0.12)">
          <Sparkles className="size-5 text-purple-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Personalized Variables</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Map variables dynamically using CRM metadata (e.g. client first name, cart checkout URL, account manager name).
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(6, 182, 212, 0.12)">
          <BarChart2 className="size-5 text-cyan-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Opt-out Compliance</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Automatically include opt-out quick reply buttons. Keep quality scores high and protect sending status limits.
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
