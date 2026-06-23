"use client";

import React from "react";
import { Landmark } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-20 space-y-10">
      <div className="space-y-4 border-b border-[var(--m-border-primary)] pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-950/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <Landmark className="size-3" /> Refund Policy
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--m-text-heading)] tracking-tight">
          Subscription & Refund Policy
        </h1>
        <p className="text-xs text-[var(--m-text-muted)]">Last updated: March 10, 2026</p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-[var(--m-text-secondary)] leading-relaxed">
        <p>
          At ChatNexGen Ai, we provide WhatsApp automation services through a subscription-based model. Our policy reflects the unique nature of automation services and the resources required to maintain them.
        </p>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">Non-Refundable Subscriptions</h3>
          <ul className="list-disc pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li>Once a subscription period has started, it cannot be refunded.</li>
            <li>Subscription services are provided on an as-is basis.</li>
            <li>All subscription payments are non-refundable.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">Service Understanding</h3>
          <ul className="list-disc pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li>Results may vary based on your use case and WhatsApp&#39;s terms.</li>
            <li>Service performance may be affected by third-party platform changes (e.g., WhatsApp policies).</li>
            <li>By purchasing a subscription, you acknowledge that automation technology has inherent limitations.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">Policy Overview</h3>
          <ul className="list-disc pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li>You may cancel your subscription at any time to prevent future billing.</li>
            <li>Users are advised to carefully consider their needs before subscribing.</li>
            <li>Unused subscription time cannot be exchanged for cash.</li>
            <li>Subscriptions are final sale and cannot be partially refunded.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">Cancellation</h3>
          <p>
            You may cancel your subscription at any time through your account dashboard. Cancellation will stop future billing but will not generate any refund for the current billing period. Your service will remain active until the end of the current billing period.
          </p>
        </section>

        <section className="space-y-3 text-center pt-8 border-t border-[var(--m-border-primary)]/50">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">Contact</h3>
          <p>
            For any questions about our policy, please contact us at <a href="mailto:chatnexgenai@gmail.com" className="text-emerald-400 hover:underline">chatnexgenai@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
