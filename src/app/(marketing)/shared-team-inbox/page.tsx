"use client";

import React, { useState } from "react";
import { Inbox, Sparkles, User, AlertTriangle, MessageSquare, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

export default function SharedInboxPage() {
  const [activeTab, setActiveTab] = useState<"collision" | "notes">("collision");

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/25 bg-cyan-950/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
            <Inbox className="size-3.5" /> Collaboration Control
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.08]">
            One Number. <br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Unlimited Agents.
            </span>
          </h1>
          <p className="text-sm text-[var(--m-text-tertiary)] leading-relaxed">
            Stop sharing physical smartphones or web logins. Enable your entire support and sales teams to work from a single unified WhatsApp Business account. Assign threads, leave private internal notes, and automate message delegation.
          </p>
        </div>

        {/* Visual mock: Shared Inbox Panel */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/5 blur-[95px] pointer-events-none" />
          <div className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur flex flex-col justify-between h-[360px] shadow-2xl relative z-10">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-[var(--m-border-primary)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Inbox className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--m-text-secondary)]">Shared Inbox Stream</h4>
                  <p className="text-[9px] text-[var(--m-text-muted)]">Live conversation routing</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("collision")}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                    activeTab === "collision" ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400" : "text-[var(--m-text-muted)]"
                  }`}
                >
                  Collision Watch
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                    activeTab === "notes" ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400" : "text-[var(--m-text-muted)]"
                  }`}
                >
                  Team Notes
                </button>
              </div>
            </div>

            {/* Interactive content based on tab choice */}
            <div className="flex-1 pt-4">
              {activeTab === "collision" ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
                    <AlertTriangle className="size-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[11px] font-bold text-[var(--m-text-secondary)]">Collision Alert: John Doe</h5>
                      <p className="text-[10px] text-[var(--m-text-tertiary)] leading-relaxed mt-0.5">
                        Sarah Adams is currently typing a response. We've locked your edit access to prevent duplicate customer messaging.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] bg-[var(--m-bg-secondary)]/40 p-2.5 rounded border border-[var(--m-border-glass)]">
                    <span className="text-[var(--m-text-tertiary)] font-medium">Assigned Agent</span>
                    <span className="text-[var(--m-text-secondary)] font-bold">Sarah Adams</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg bg-[var(--m-bg-secondary)]/60 border border-[var(--m-border-glass)] p-3">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold">Internal Note by Sarah</span>
                    <p className="text-[11px] text-[var(--m-text-secondary)] mt-1 leading-relaxed">
                      "Spoke to client. Budget verified at $5k/mo. Move to 'Proposal Sent' once they reply to the pricing template."
                    </p>
                  </div>
                  <div className="text-[10px] text-[var(--m-text-muted)] italic px-1">
                    Notes are visible only to your teammates — never sent to the customer.
                  </div>
                </div>
              )}
            </div>

            {/* Simulated actions */}
            <div className="border-t border-[var(--m-border-primary)] pt-4 mt-2 text-right">
              <span className="text-[10px] text-[var(--m-text-muted)]">Auto-routes new chats in 1.4s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard>
          <AlertTriangle className="size-5 text-cyan-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Collision Detection</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Prevent double replies. Visual locks warn teammates when someone else is viewing or drafting a message in that thread.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(6, 182, 212, 0.12)">
          <MessageSquare className="size-5 text-cyan-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Internal Mentions</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Tag teammates inside chat threads using `@` comments. Discuss details, resolve queries, and transfer ownership easily.
          </p>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(168, 85, 247, 0.12)">
          <Inbox className="size-5 text-purple-400 mb-3" />
          <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">Rule-based Assignment</h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">
            Auto-delegate inbound conversations. Set rules to route chats based on language, product keyword interest, or sales timezone.
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
