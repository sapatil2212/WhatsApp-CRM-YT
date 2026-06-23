"use client";

import React from "react";
import { Trash2 } from "lucide-react";

export default function DataDeletionPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-20 space-y-10">
      <div className="space-y-4 border-b border-[var(--m-border-primary)] pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/25 bg-red-950/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
          <Trash2 className="size-3" /> Data Deletion
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--m-text-heading)] tracking-tight">
          User Data Deletion Instructions
        </h1>
        <p className="text-xs text-[var(--m-text-muted)]">ChatNexGen Ai Platform Guidelines</p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-[var(--m-text-secondary)] leading-relaxed">
        <p>
          If you want to delete your personal data from the ChatNexGen Ai platform, you can request data deletion using the steps below.
        </p>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">How to request data deletion</h3>
          <ol className="list-decimal pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li>Log in to your account on the ChatNexGen Ai platform.</li>
            <li>Go to your Account Settings.</li>
            <li>Click on Delete Account or request account deletion.</li>
            <li>You can also contact our support team to request deletion of your data.</li>
          </ol>
        </section>

        <section className="space-y-4 pt-8 border-t border-[var(--m-border-primary)]/50">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)] text-center">Contact Support</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto pt-2">
            <div className="bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] rounded-xl p-4 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--m-text-muted)]">Support Email</span>
              <p className="font-semibold text-[var(--m-text-primary)]">
                <a href="mailto:chatnexgenai@gmail.com" className="text-emerald-400 hover:underline">
                  chatnexgenai@gmail.com
                </a>
              </p>
            </div>
            <div className="bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] rounded-xl p-4 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--m-text-muted)]">WhatsApp Support</span>
              <p className="font-semibold text-emerald-400">
                +91 9326268231
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--m-text-muted)] text-center pt-4">
            Once we receive your request, your data will be permanently deleted from our system within 7 working days.
          </p>
        </section>
      </div>
    </div>
  );
}
