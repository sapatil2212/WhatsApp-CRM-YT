"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useMarketingTheme } from "@/components/marketing/marketing-theme-provider";

export function Footer() {
  const { resolvedTheme } = useMarketingTheme();
  const isLight = resolvedTheme === "light";

  const productLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Services", href: "/pricing" },
    { name: "How It Works", href: "/features" },
    { name: "Use Cases", href: "/" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Data Deletion", href: "/data-deletion" },
  ];

  return (
    <footer className="relative w-full border-t border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] py-16 px-4 md:px-6 overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[150px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-10 md:gap-8 relative z-10">
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Link href="/" className="inline-block">
            <img
              src={isLight ? "/images/logo/chatnexgen-logo-light.png" : "/images/logo/chatnexgen-logo.png"}
              alt="ChatNexGen Ai Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <p className="text-xs text-[var(--m-text-tertiary)] leading-relaxed max-w-sm">
            ChatNexGen Ai is the WhatsApp automation platform built for growing businesses. Automate customer conversations, run broadcast campaigns, build no-code chatbot workflows, and connect your existing tools — all powered by the official WhatsApp Business API.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-extrabold uppercase tracking-wider">
              Official Meta Business Partner
            </span>
          </div>
        </div>

        {/* Product Column */}
        <div className="col-span-1 space-y-4">
          <h6 className="text-[10px] uppercase font-bold tracking-wider text-[var(--m-text-tertiary)]">Product</h6>
          <ul className="space-y-2.5">
            {productLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-xs text-[var(--m-text-muted)] hover:text-[var(--m-text-heading)] transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Column */}
        <div className="col-span-1 space-y-4">
          <h6 className="text-[10px] uppercase font-bold tracking-wider text-[var(--m-text-tertiary)]">Legal</h6>
          <ul className="space-y-2.5">
            {legalLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-xs text-[var(--m-text-muted)] hover:text-[var(--m-text-heading)] transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Us Column */}
        <div className="col-span-1 space-y-4">
          <h6 className="text-[10px] uppercase font-bold tracking-wider text-[var(--m-text-tertiary)]">Contact Us</h6>
          <ul className="space-y-2.5">
            <li>
              <a href="mailto:chatnexgenai@gmail.com" className="text-xs text-[var(--m-text-muted)] hover:text-[var(--m-text-heading)] transition-colors">
                Email Us
              </a>
            </li>
          </ul>
        </div>

        {/* Located At Column */}
        <div className="col-span-1 space-y-4">
          <h6 className="text-[10px] uppercase font-bold tracking-wider text-[var(--m-text-tertiary)]">Located At</h6>
          <p className="text-xs text-[var(--m-text-muted)] leading-relaxed">
            Pune, Maharashtra 401107
          </p>
        </div>
      </div>

      {/* Clean bottom Copyright line */}
      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-[var(--m-border-primary)]/50 text-center relative z-10">
        <span className="text-[10px] text-[var(--m-text-muted)]">
          © {new Date().getFullYear()} ChatNexGen Ai. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
