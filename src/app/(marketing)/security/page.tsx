"use client";

import React from "react";
import { Shield, Check, Lock, FileText, CheckCircle } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

export default function SecurityPage() {
  const compliance = [
    {
      title: "GDPR Compliant",
      desc: "Fully compliant with European data privacy rules. Request data purges, access audits, and control region storage.",
      icon: <CheckCircle className="size-4 text-emerald-400" />,
    },
    {
      title: "End-to-End Encryption",
      desc: "Data in transit is encrypted using TLS 1.3, and data at rest utilizes standard AES-256 block formats.",
      icon: <Lock className="size-4 text-cyan-400" />,
    },
    {
      title: "Uptime Auditing",
      desc: "Real-time audit log feeds register every API key update, webhook dispatch, and user console entry.",
      icon: <FileText className="size-4 text-purple-400" />,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          <Shield className="size-3.5 animate-pulse" /> security & compliance
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.1]">
          Trust & Compliance <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Built from Day One.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] max-w-xl mx-auto">
          We protect your database boundaries with bank-grade encryption layers and compliance safety.
        </p>
      </div>

      {/* Grid of compliance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {compliance.map((item) => (
          <SpotlightCard key={item.title}>
            <div className="mb-4 w-10 h-10 rounded-xl bg-[var(--m-bg-secondary)] border border-[var(--m-border-glass)] flex items-center justify-center">
              {item.icon}
            </div>
            <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">{item.title}</h4>
            <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">{item.desc}</p>
          </SpotlightCard>
        ))}
      </div>

      {/* Security Policies block */}
      <div className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-card)] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/5 to-cyan-950/5 pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-6 relative z-10 text-center">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--m-text-primary)]">Need our Security Whitepaper?</h3>
          <p className="text-xs text-[var(--m-text-tertiary)] leading-relaxed max-w-md mx-auto">
            Get access to our complete SOC2 type-II audit logs, compliance document packages, and threat model reports.
          </p>
          <div className="pt-2">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer">
              Download Security Bundle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
