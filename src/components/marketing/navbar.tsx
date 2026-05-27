"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronDown, Menu, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMarketingTheme } from "@/components/marketing/marketing-theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { MagneticButton } from "./magnetic-button";
import { cn } from "@/lib/utils";

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(v: number) { return Math.min(1, Math.max(0, v)); }
const SCROLL_RANGE = 120;

export function GlassNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { resolvedTheme } = useMarketingTheme();
  const isLight = resolvedTheme === "light";
  const supabase = createClient();
  const rafRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setProgress(clamp01(window.scrollY / SCROLL_RANGE));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onClickOutside);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [supabase]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "AI Automation", href: "/ai-automation" },
    { name: "Pricing", href: "/pricing" },
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

  const maxWidth    = lerp(1152, 920,  progress);
  const radius      = lerp(14,   9999, progress);
  const padV        = lerp(6,    10,   progress);
  const padH        = lerp(8,    22,   progress);
  const bgAlpha     = lerp(0, isLight ? 0.92 : 0.85, progress);
  const borderAlpha = lerp(0, isLight ? 0.65 : 0.55, progress);
  const shadowAlpha = lerp(0, isLight ? 0.07 : 0.50, progress);
  const shadowBlur  = lerp(0, 28, progress);
  const topPx       = lerp(16, 12, progress);

  const pillStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: `${maxWidth}px`,
    borderRadius: `${radius}px`,
    padding: `${padV}px ${padH}px`,
    backgroundColor: isLight
      ? `rgba(255,255,255,${bgAlpha})`
      : `rgba(2,6,23,${bgAlpha})`,
    border: `1px solid ${
      isLight
        ? `rgba(203,213,225,${borderAlpha})`
        : `rgba(30,41,59,${borderAlpha})`
    }`,
    boxShadow: `0 4px ${shadowBlur}px rgba(0,0,0,${shadowAlpha})`,
    backdropFilter: progress > 0.05 ? "blur(20px)" : "none",
    WebkitBackdropFilter: progress > 0.05 ? "blur(20px)" : "none",
  };

  const linkCls = "text-[var(--m-text-secondary)] hover:text-[var(--m-text-heading)]";

  return (
    <>
      <header
        className="fixed inset-x-0 z-50 flex justify-center pointer-events-none px-4 sm:px-6"
        style={{ top: `${topPx}px` }}
      >
        <div
          className="pointer-events-auto flex items-center justify-between"
          style={pillStyle}
        >
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/60 transition-all duration-300">
              <Bot className="size-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-extrabold tracking-tight flex items-center gap-1 text-[var(--m-text-heading)]">
              wacrm <Sparkles className="size-2.5 text-emerald-400 animate-pulse" />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[11px] font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap",
                  pathname === link.href ? "text-emerald-500" : linkCls
                )}
              >
                {link.name}
              </Link>
            ))}

            {/* Explore dropdown — click-controlled */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer select-none whitespace-nowrap",
                  linkCls
                )}
              >
                Explore
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform duration-200",
                    dropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {dropdownOpen && (
                <div
                  className={cn(
                    "absolute top-full right-0 mt-3 w-52 rounded-2xl border p-2 z-50",
                    "animate-in fade-in slide-in-from-top-2 duration-150",
                    isLight
                      ? "border-slate-200 bg-white shadow-xl shadow-black/5"
                      : "border-slate-800 bg-slate-950 shadow-2xl shadow-black/50"
                  )}
                >
                  {dropdownLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDropdownOpen(false)}
                      className={cn(
                        "block text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors",
                        pathname === link.href
                          ? "text-emerald-500 bg-emerald-500/5"
                          : "text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-tertiary)] hover:text-[var(--m-text-heading)]"
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <Link
              href="/book-demo"
              className={cn("text-[11px] font-semibold transition-colors px-3 py-1.5 whitespace-nowrap", linkCls)}
            >
              Book Demo
            </Link>
            <MagneticButton>
              <Link
                href={isLoggedIn ? "/dashboard" : "/login"}
                className="text-[11px] font-semibold bg-[#00DF82] hover:bg-[#00c673] text-slate-950 px-4 py-1.5 rounded-full transition-all shadow-[0_2px_12px_rgba(0,223,130,0.2)] whitespace-nowrap"
              >
                {isLoggedIn ? "Dashboard" : "Sign In"}
              </Link>
            </MagneticButton>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="md:hidden w-8 h-8 rounded-full border flex items-center justify-center transition-colors bg-[var(--m-bg-secondary)] border-[var(--m-border-primary)] text-[var(--m-text-secondary)] hover:text-[var(--m-text-heading)]"
          >
            {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[68px] z-40 p-6 flex flex-col justify-between md:hidden bg-[var(--m-bg-secondary)] border-t border-[var(--m-border-primary)] backdrop-blur-xl">
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--m-text-muted)]">
                Navigation
              </span>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold transition-colors text-[var(--m-text-primary)] hover:text-emerald-500"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--m-text-muted)]">
                Solutions
              </span>
              <div className="grid grid-cols-2 gap-3">
                {dropdownLinks.slice(0, 6).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-semibold transition-colors text-[var(--m-text-secondary)] hover:text-emerald-500"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-8">
            <div className="flex justify-center py-1">
              <ThemeToggle className="w-full justify-around" />
            </div>
            <Link
              href="/book-demo"
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs font-bold py-3 rounded-full border transition-colors border-[var(--m-border-primary)] bg-[var(--m-bg-tertiary)] text-[var(--m-text-primary)]"
            >
              Book Demo
            </Link>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs font-semibold bg-[#00DF82] text-slate-950 py-3 rounded-full hover:bg-[#00c673] transition-colors"
            >
              {isLoggedIn ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
