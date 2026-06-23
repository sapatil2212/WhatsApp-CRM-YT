"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronDown, Menu, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMarketingTheme } from "@/components/marketing/marketing-theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { MagneticButton } from "./magnetic-button";
import { BookDemoTrigger } from "./book-demo-trigger";
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
            <img
              src={isLight ? "/images/logo/chatnexgen-logo-light.png" : "/images/logo/chatnexgen-logo.png"}
              alt="ChatNexGen Ai Logo"
              className="h-8 w-auto object-contain group-hover:scale-110 transition-transform"
            />
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
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <BookDemoTrigger
              className={cn("text-[11px] font-semibold transition-colors px-3 py-1.5 whitespace-nowrap cursor-pointer", linkCls)}
            >
              Book Demo
            </BookDemoTrigger>
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
            <BookDemoTrigger className="w-full text-center text-xs font-bold py-3 rounded-full border transition-colors border-[var(--m-border-primary)] bg-[var(--m-bg-tertiary)] text-[var(--m-text-primary)]">
              Book Demo
            </BookDemoTrigger>
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
