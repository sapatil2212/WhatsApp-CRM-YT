"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bot, Sparkles, Send } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  const columns = [
    {
      title: "Product",
      links: [
        { name: "Features Grid", href: "/features" },
        { name: "AI Automation", href: "/ai-automation" },
        { name: "Shared Inbox", href: "/shared-team-inbox" },
        { name: "CRM Engines", href: "/crm" },
        { name: "Broadcast Lists", href: "/whatsapp-marketing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "API Docs", href: "/api-docs" },
        { name: "Analytics Dashboard", href: "/analytics" },
        { name: "Integrations Catalog", href: "/integrations" },
        { name: "Pricing Tiers", href: "/pricing" },
        { name: "Uptime Status", href: "/security" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers (Hiring)", href: "/careers" },
        { name: "Customer Stories", href: "/customer-stories" },
        { name: "Our Blog", href: "/blog" },
        { name: "Book Consultation", href: "/book-demo" },
      ],
    },
    {
      title: "Security & Legal",
      links: [
        { name: "Trust Center", href: "/security" },
        { name: "GDPR Compliance", href: "/security" },
        { name: "WhatsApp Policy", href: "/security" },
        { name: "Terms of Use", href: "/security" },
        { name: "Privacy Policy", href: "/security" },
      ],
    },
  ];

  return (
    <footer className="relative w-full border-t border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] py-16 px-4 md:px-6 overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[150px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-10 md:gap-8 relative z-10">
        {/* Brand Description column */}
        <div className="col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="size-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-[var(--m-text-heading)] flex items-center gap-1.5">
              wacrm <Sparkles className="size-3 text-emerald-400" />
            </span>
          </Link>
          <p className="text-xs text-[var(--m-text-tertiary)] leading-relaxed max-w-[280px]">
            The next-generation AI WhatsApp Automation SaaS operating system. Scale customer success, automate sales pipelines, and qualify leads on WhatsApp.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3 pt-2">
            <a href="https://github.com" className="w-7 h-7 rounded-lg bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] flex items-center justify-center text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] hover:border-[var(--m-border-secondary)] transition-colors">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="https://twitter.com" className="w-7 h-7 rounded-lg bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] flex items-center justify-center text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] hover:border-[var(--m-border-secondary)] transition-colors">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com" className="w-7 h-7 rounded-lg bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] flex items-center justify-center text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] hover:border-[var(--m-border-secondary)] transition-colors">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
          </div>
        </div>

        {/* Links sitemaps */}
        {columns.map((col) => (
          <div key={col.title} className="col-span-1 space-y-3.5">
            <h6 className="text-[10px] uppercase font-bold tracking-wider text-[var(--m-text-tertiary)]">{col.title}</h6>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-xs text-[var(--m-text-muted)] hover:text-[var(--m-text-heading)] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Newsletter signup & Copyright */}
      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-[var(--m-border-primary)] flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div>
          <span className="text-[10px] text-[var(--m-text-muted)]">© 2026 wacrm Inc. All rights reserved. Built for global startups.</span>
        </div>

        {/* Newsletter subscribe form */}
        <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-sm">
          <div className="relative flex-1">
            <input
              type="email"
              placeholder="Join our newsletter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--m-bg-primary)] border border-[var(--m-border-primary)] rounded-lg px-3.5 py-2 text-xs text-[var(--m-text-secondary)] placeholder:text-[var(--m-text-muted)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            {subscribed ? "Subscribed!" : <Send className="size-3.5" />}
          </button>
        </form>
      </div>
    </footer>
  );
}
