"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronDown, Menu, X, Sparkles, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMarketingTheme } from "@/components/marketing/marketing-theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { MagneticButton } from "./magnetic-button";
import { cn } from "@/lib/utils";

export function GlassNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { resolvedTheme } = useMarketingTheme();
  const isLight = resolvedTheme === "light";
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();

    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [supabase]);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "AI Automation", href: "/ai-automation" },
    { name: "Pricing", href: "/pricing" },
    { name: "API Docs", href: "/api-docs" },
  ];

  const dropdownLinks = [
    { name: "WhatsApp Campaigns", href: "/whatsapp-marketing" },
    { name: "Shared Inbox", href: "/shared-team-inbox" },
    { name: "CRM Engine", href: "/crm" },
    { name: "Analytics Dashboard", href: "/analytics" },
    { name: "Enterprise SaaS", href: "/enterprise" },
    { name: "Security & GDPR", href: "/security" },
    { name: "Customer Stories", href: "/customer-stories" },
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Blog Hacks", href: "/blog" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 sm:px-6 py-4",
        hasScrolled
          ? isLight
            ? "bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
            : "bg-slate-950/70 backdrop-blur-md border-b border-slate-900/80 py-3"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition-all duration-300">
            <Bot className="size-4 group-hover:scale-110 transition-transform" />
          </div>
          <span
            className={cn(
              "text-base font-extrabold tracking-tight flex items-center gap-1.5 font-sans transition-colors",
              isLight ? "text-slate-950" : "text-white"
            )}
          >
            wacrm <Sparkles className="size-3 text-emerald-400 animate-pulse" />
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-semibold tracking-wide transition-colors duration-200",
                  isActive
                    ? "text-emerald-500"
                    : isLight
                    ? "text-slate-600 hover:text-slate-950"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {link.name}
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative group/dropdown">
            <button
              className={cn(
                "flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer select-none",
                isLight ? "text-slate-600 hover:text-slate-950" : "text-slate-400 hover:text-white"
              )}
            >
              Explore <ChevronDown className="size-3 transition-transform group-hover/dropdown:rotate-180" />
            </button>
            <div
              className={cn(
                "absolute top-full right-0 mt-2 w-48 rounded-xl border p-2.5 opacity-0 translate-y-2 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:translate-y-0 group-hover/dropdown:pointer-events-auto transition-all duration-300",
                isLight ? "border-slate-200 bg-white shadow-xl" : "border-slate-800 bg-slate-950 shadow-2xl"
              )}
            >
              <div className="grid grid-cols-1 gap-1">
                {dropdownLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-colors",
                        isActive
                          ? "text-emerald-500 bg-emerald-500/5"
                          : isLight
                          ? "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          <Link
            href="/book-demo"
            className={cn(
              "text-xs font-semibold transition-colors px-3 py-1.5 duration-205",
              isLight ? "text-slate-600 hover:text-slate-950" : "text-slate-400 hover:text-white"
            )}
          >
            Book Demo
          </Link>
          <MagneticButton>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="text-xs font-semibold bg-[#00DF82] hover:bg-[#00c673] text-slate-950 px-4 py-2 rounded-lg transition-all shadow-[0_2px_12px_rgba(0,223,130,0.15)]"
            >
              {isLoggedIn ? "Dashboard" : "Sign In"}
            </Link>
          </MagneticButton>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "md:hidden w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors",
            isLight
              ? "bg-slate-100 border-slate-200 text-slate-600"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          )}
        >
          {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div
          className={cn(
            "md:hidden fixed inset-0 top-[60px] z-40 p-6 flex flex-col justify-between transition-colors duration-300",
            isLight ? "bg-white/95 border-t border-slate-100 backdrop-blur-lg" : "bg-slate-950/95 border-t border-slate-900/60 backdrop-blur-lg"
          )}
        >
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Navigation</span>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-sm font-bold transition-colors",
                    isLight ? "text-slate-800 hover:text-slate-950" : "text-slate-200 hover:text-emerald-400"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Solutions</span>
              <div className="grid grid-cols-2 gap-3">
                {dropdownLinks.slice(0, 6).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      isLight ? "text-slate-600 hover:text-slate-950" : "text-slate-400 hover:text-emerald-400"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            {/* Mobile theme toggle */}
            <div className="flex justify-center py-1 z-10 relative">
              <ThemeToggle className="w-full justify-around" />
            </div>

            <Link
              href="/book-demo"
              onClick={() => setIsOpen(false)}
              className={cn(
                "w-full text-center text-xs font-bold py-3 rounded-lg border transition-colors",
                isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-900 border-slate-800 text-slate-200"
              )}
            >
              Book Demo
            </Link>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs font-semibold bg-[#00DF82] text-slate-950 py-3 rounded-lg hover:bg-[#00c673]"
            >
              {isLoggedIn ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
