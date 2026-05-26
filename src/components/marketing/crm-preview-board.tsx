"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, MessageCircle, TrendingUp, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CRMLead {
  id: string;
  name: string;
  company: string;
  value: number;
  score: number;
  avatarColor: string;
  stage: 0 | 1 | 2 | 3;
}

export function CRMPreviewBoard() {
  const [leads, setLeads] = useState<CRMLead[]>([
    { id: "1", name: "David Kim", company: "Zeta Scale", value: 1200, score: 94, avatarColor: "bg-cyan-500", stage: 0 },
    { id: "2", name: "Elena Rostova", company: "Vostok D2C", value: 850, score: 88, avatarColor: "bg-purple-500", stage: 1 },
    { id: "3", name: "Marcus Brody", company: "Indy Tech", value: 2400, score: 99, avatarColor: "bg-emerald-500", stage: 2 },
    { id: "4", name: "Sophia Martinez", company: "Alt Co", value: 3100, score: 97, avatarColor: "bg-amber-500", stage: 3 },
  ]);

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLeads((prevLeads) => {
        // Move one lead forward to simulate dynamic updates
        return prevLeads.map((lead) => {
          if (lead.id === "1" && lead.stage === 0) {
            return { ...lead, stage: 1, score: 96 };
          }
          if (lead.id === "1" && lead.stage === 1) {
            return { ...lead, stage: 2 };
          }
          if (lead.id === "2" && lead.stage === 1) {
            return { ...lead, stage: 2 };
          }
          if (lead.id === "3" && lead.stage === 2) {
            return { ...lead, stage: 3 };
          }
          // Reset cycle
          if (lead.stage === 3 && Math.random() > 0.6) {
            return { ...lead, stage: 0 };
          }
          return lead;
        });
      });
      setCounter((prev) => prev + 1);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const columns = [
    { title: "Lead Inbound", subtitle: "Incoming WhatsApp Threads", stage: 0 },
    { title: "AI Qualified", subtitle: "Intent Verified > 80%", stage: 1 },
    { title: "Meeting Booked", subtitle: "Demo Calendly sync", stage: 2 },
    { title: "Closed Won", subtitle: "Payment Completed", stage: 3 },
  ];

  return (
    <div className="w-full rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur-md overflow-hidden">
      {/* Top metrics bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-[var(--m-border-glass)] pb-4">
        <div>
          <h4 className="text-sm font-semibold text-[var(--m-text-primary)] flex items-center gap-2">
            Active WhatsApp Sales Pipeline <TrendingUp className="size-4 text-emerald-400" />
          </h4>
          <p className="text-xs text-[var(--m-text-tertiary)] mt-0.5">Real-time status of lead conversions</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[10px] uppercase text-[var(--m-text-tertiary)] font-medium">Pipeline Value</span>
            <span className="text-xs font-bold text-[var(--m-text-primary)]">$7,550</span>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[10px] uppercase text-emerald-400 font-medium">AI Qualified</span>
            <span className="text-xs font-bold text-emerald-400">92%</span>
          </div>
        </div>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const stageLeads = leads.filter((l) => l.stage === col.stage);

          return (
            <div key={col.stage} className="flex flex-col rounded-xl bg-[var(--m-bg-card)] border border-[var(--m-border-glass)] p-3 h-[250px]">
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--m-text-secondary)]">{col.title}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.25 bg-[var(--m-bg-tertiary)] text-[var(--m-text-tertiary)] rounded-full border border-[var(--m-border-secondary)]">
                    {stageLeads.length}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--m-text-muted)] mt-0.5">{col.subtitle}</p>
              </div>

              {/* Column list */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {stageLeads.map((lead) => (
                    <motion.div
                      layout
                      key={lead.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="rounded-lg bg-[var(--m-bg-primary)] border border-[var(--m-border-primary)] p-2.5 relative shadow-md hover:border-[var(--m-border-secondary)] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white", lead.avatarColor)}>
                          {lead.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--m-text-secondary)]">{lead.name}</p>
                          <p className="text-[9px] text-[var(--m-text-muted)]">{lead.company}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--m-border-primary)]">
                        <span className="text-[10px] text-[var(--m-text-tertiary)] font-medium flex items-center gap-0.5">
                          <DollarSign className="size-3 text-[var(--m-text-muted)]" /> {lead.value}
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-1.5 py-0.5 flex items-center gap-0.5 font-bold font-mono">
                          <Sparkles className="size-2 text-emerald-400 animate-pulse" /> {lead.score}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
