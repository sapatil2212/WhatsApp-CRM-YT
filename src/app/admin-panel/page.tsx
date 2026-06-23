"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, MessageSquare, CheckCircle, Activity,
  TrendingUp, ArrowUp, Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminShell } from "./admin-shell";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  confirmedUsers: number;
  totalContacts: number;
  totalConversations: number;
  openConversations: number;
  monthlySignups: { month: string; count: number }[];
}

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
  contacts: number;
  conversations: number;
  joined_at: string;
  wa_connected: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  active:   "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  inactive: "bg-slate-500/10 border-slate-500/20 text-slate-400",
};

export default function AdminOverviewPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/clients").then(r => r.json()),
    ]).then(([s, c]) => {
      setStats(s);
      setClients((c.clients ?? []).slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  const signups = stats?.monthlySignups ?? [];
  const maxSignup = Math.max(...signups.map(m => m.count), 1);

  const STAT_CARDS = stats ? [
    { label: "Total Users",        value: String(stats.totalUsers),              sub: `${stats.confirmedUsers} confirmed`,    icon: Users,        accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "WA Connected",       value: String(stats.activeUsers),             sub: "active integrations",                  icon: CheckCircle,  accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Total Contacts",     value: stats.totalContacts.toLocaleString(),  sub: "across all accounts",                  icon: Users,        accent: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
    { label: "Open Conversations", value: String(stats.openConversations),       sub: `${stats.totalConversations} total`,    icon: MessageSquare,accent: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ] : [];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="mt-1 text-sm text-slate-400">Live agency-wide metrics from the database.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-slate-400">{s.label}</p>
                    <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center", s.accent)}>
                      <s.icon className="size-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-bold tabular-nums text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Signup chart + platform stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="size-4 text-emerald-400" /> User Signups
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Last 12 months</p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    {stats?.totalUsers} total
                  </span>
                </div>
                <div className="flex items-end gap-1.5 h-28">
                  {signups.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={cn("w-full rounded-sm", i === signups.length - 1 ? "bg-emerald-500" : "bg-slate-700")}
                        style={{ height: `${Math.max((m.count / maxSignup) * 100, 4)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                  {signups.map(m => <span key={m.month}>{m.month}</span>)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="size-4 text-emerald-400" /> Platform Stats
                </p>
                <div className="space-y-4">
                  {[
                    { label: "Total Users",        value: stats?.totalUsers ?? 0,         color: "bg-emerald-500" },
                    { label: "WA Connected",       value: stats?.activeUsers ?? 0,        color: "bg-emerald-500" },
                    { label: "Email Confirmed",    value: stats?.confirmedUsers ?? 0,     color: "bg-teal-500" },
                    { label: "Total Contacts",     value: stats?.totalContacts ?? 0,      color: "bg-amber-500" },
                    { label: "Open Conversations", value: stats?.openConversations ?? 0,  color: "bg-teal-600" },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300">{s.label}</span>
                        <span className="text-slate-400 font-mono">{s.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800">
                        <div className={cn("h-full rounded-full", s.color)}
                          style={{ width: `${Math.min((s.value / Math.max(stats?.totalUsers ?? 1, 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent clients */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="size-4 text-emerald-400" /> Recent Users
                </p>
                <Link href="/admin-panel/clients" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                  View all →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                      {["User","Email","Status","Contacts","Conversations","Joined"].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                              {(c.name || c.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white truncate max-w-[120px]">{c.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-[160px]">{c.email}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", STATUS_STYLE[c.status] ?? STATUS_STYLE.inactive)}>
                            {c.wa_connected ? "Connected" : "No WA"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 tabular-nums">{c.contacts}</td>
                        <td className="px-4 py-3 text-slate-400 tabular-nums">{c.conversations}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(c.joined_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
