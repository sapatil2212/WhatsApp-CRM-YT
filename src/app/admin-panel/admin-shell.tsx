"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Users, BarChart2, Settings, LogOut,
  Menu, X, Bell, ChevronRight, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin-panel",          label: "Overview",  icon: BarChart2  },
  { href: "/admin-panel/clients",  label: "Clients",   icon: Users      },
  { href: "/admin-panel/settings", label: "Settings",  icon: Settings   },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin-panel/login";
  };

  return (
    <>
      {/* Mobile backdrop */}
      <button
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full w-60 flex-col bg-slate-950 border-r border-slate-800 transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
        "lg:static lg:translate-x-0 lg:z-0"
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between gap-2 border-b border-slate-800 px-4">
          <Link href="/admin-panel" className="flex items-center gap-2.5">
            <img
              src="/images/logo/chatnexgen-logo.png"
              alt="ChatNexGen Ai Logo"
              className="h-8 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-bold text-white leading-none">Super Admin</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Agency Panel</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== "/admin-panel" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="size-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 p-3">
          <button onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors">
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Redirect login page away from shell
  if (pathname === "/admin-panel/login") return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="size-3.5" />
              <span>Agency</span>
              <ChevronRight className="size-3" />
              <span className="text-white font-medium capitalize">
                {pathname.split("/").pop()?.replace("-", " ") || "Overview"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <Bell className="size-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-screen-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
