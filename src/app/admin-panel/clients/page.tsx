"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, MoreVertical, Trash2, CheckCircle, XCircle,
  X, Loader2, ChevronUp, ChevronDown, RefreshCw,
  Wifi, WifiOff, MessageSquare, Radio, Zap, Phone,
  Building2, MapPin, ShieldCheck, ShieldOff, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminShell } from "../admin-shell";

interface Client {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_banned: boolean;
  banned_until: string | null;
  confirmed: boolean;
  provider: string;
  joined_at: string;
  last_sign_in: string | null;
  wa_connected: boolean;
  wa_status: string;
  wa_phone_id: string | null;
  wa_waba_id: string | null;
  wa_connected_at: string | null;
  clinic_name: string | null;
  clinic_type: string | null;
  clinic_city: string | null;
  clinic_phone: string | null;
  contacts: number;
  conversations: number;
  open_conversations: number;
  broadcasts: number;
  automations: number;
}

type SortKey = "name" | "email" | "contacts" | "conversations" | "joined_at" | "last_sign_in";
type FilterStatus = "all" | "active" | "inactive" | "banned";

function fmt(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Avatar({ name, email }: { name: string; email: string }) {
  const ch = (name || email).charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold shrink-0">
      {ch}
    </div>
  );
}

export default function AdminClientsPage() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState<FilterStatus>("all");
  const [sortKey,  setSortKey]  = useState<SortKey>("joined_at");
  const [sortDir,  setSortDir]  = useState<"asc"|"desc">("desc");
  const [detail,   setDetail]   = useState<Client|null>(null);
  const [delId,    setDelId]    = useState<string|null>(null);
  const [openMenu, setOpenMenu] = useState<string|null>(null);
  const [menuPos,  setMenuPos]  = useState<{top:number;right:number}>({top:0,right:0});
  const [toggling, setToggling] = useState<string|null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/clients")
      .then(r => r.json())
      .then(d => setClients(d.clients ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let r = clients.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchS =
        statusF === "all" ? true :
        statusF === "active"   ? c.is_active && !c.is_banned :
        statusF === "inactive" ? !c.is_active && !c.is_banned :
        statusF === "banned"   ? c.is_banned : true;
      return matchQ && matchS;
    });
    return [...r].sort((a, b) => {
      const av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [clients, search, statusF, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };
  const SI = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "asc" ? <ChevronUp className="size-3"/> : <ChevronDown className="size-3"/>) : null;

  const toggleActive = async (c: Client) => {
    setToggling(c.id);
    const action = c.is_banned ? "activate" : "deactivate";
    await fetch("/api/admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, action }),
    });
    setClients(p => p.map(x => x.id === c.id
      ? { ...x, is_banned: !c.is_banned, is_active: c.is_banned }
      : x
    ));
    if (detail?.id === c.id)
      setDetail(prev => prev ? { ...prev, is_banned: !c.is_banned, is_active: c.is_banned } : null);
    setToggling(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/clients?id=${id}`, { method: "DELETE" });
    setClients(p => p.filter(c => c.id !== id));
    setDelId(null);
    if (detail?.id === id) setDetail(null);
  };

  const statusBadge = (c: Client) => {
    if (c.is_banned)   return { label: "Banned",    cls: "bg-red-500/10 border-red-500/20 text-red-400" };
    if (c.is_active)   return { label: "Active",    cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
    return               { label: "Unconfirmed", cls: "bg-slate-500/10 border-slate-500/20 text-slate-400" };
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="size-6 text-emerald-400"/> Clients
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {clients.length} registered · {clients.filter(c=>c.is_active&&!c.is_banned).length} active · {clients.filter(c=>c.wa_connected).length} WA connected
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors">
            <RefreshCw className="size-3.5"/> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"/>
          </div>
          <select value={statusF} onChange={e=>setStatusF(e.target.value as FilterStatus)}
            className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="inactive">Unconfirmed</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 text-emerald-400 animate-spin"/>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    {([
                      ["name","Client",true],["email","Email",true],
                      ["status","Status",false],["wa","WhatsApp",false],
                      ["contacts","Contacts",true],["conversations","Convos",true],
                      ["joined_at","Joined",true],["last_sign_in","Last Login",true],
                    ] as [SortKey|string,string,boolean][]).map(([k,label,sortable])=>(
                      <th key={k} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {sortable
                          ? <button onClick={()=>toggleSort(k as SortKey)} className="flex items-center gap-1 hover:text-white transition-colors">{label}<SI k={k as SortKey}/></button>
                          : label}
                      </th>
                    ))}
                    <th className="px-4 py-3 w-10"/>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">No clients found.</td></tr>
                    ) : filtered.map((c, i) => {
                      const sb = statusBadge(c);
                      return (
                        <motion.tr key={c.id}
                          initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                          transition={{delay:i*0.02}}
                          className={cn("border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors cursor-pointer", c.is_banned && "opacity-60")}
                          onClick={()=>setDetail(c)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={c.name} email={c.email}/>
                              <div>
                                <p className="font-semibold text-white">{c.name || "—"}</p>
                                {c.clinic_name && <p className="text-[10px] text-slate-500">{c.clinic_name}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 max-w-[160px] truncate">{c.email}</td>
                          <td className="px-4 py-3">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", sb.cls)}>{sb.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            {c.wa_connected
                              ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400"><Wifi className="size-2.5"/>Connected</span>
                              : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-500/10 border-slate-500/20 text-slate-400"><WifiOff className="size-2.5"/>None</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-slate-400 tabular-nums">{c.contacts}</td>
                          <td className="px-4 py-3 text-slate-400 tabular-nums">{c.conversations}</td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmt(c.joined_at)}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(c.last_sign_in)}</td>
                          <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                                setOpenMenu(openMenu === c.id ? null : c.id);
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <MoreVertical className="size-4"/>
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/60 rounded-b-xl flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filtered.length} of {clients.length} clients</span>
            <button onClick={()=>{setSearch("");setStatusF("all");}} className="flex items-center gap-1 hover:text-white transition-colors">
              <RefreshCw className="size-3"/>Reset
            </button>
          </div>
        </div>

        {/* Portal dropdown menu — renders at document.body to escape all overflow containers */}
        {openMenu && typeof document !== "undefined" && createPortal(
          <>
            {/* Backdrop to close */}
            <div className="fixed inset-0 z-[99]" onClick={() => setOpenMenu(null)} />
            <AnimatePresence>
              {(() => {
                const c = filtered.find(x => x.id === openMenu);
                if (!c) return null;
                return (
                  <motion.div
                    key="menu"
                    initial={{opacity:0,scale:0.95,y:-4}}
                    animate={{opacity:1,scale:1,y:0}}
                    exit={{opacity:0,scale:0.95}}
                    style={{ position:"fixed", top: menuPos.top, right: menuPos.right, zIndex: 100 }}
                    className="w-40 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { toggleActive(c); setOpenMenu(null); }}
                      className={cn("flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold transition-colors",
                        c.is_banned ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10")}
                    >
                      {toggling === c.id ? <Loader2 className="size-3.5 animate-spin"/> : c.is_banned ? <ShieldCheck className="size-3.5"/> : <ShieldOff className="size-3.5"/>}
                      {c.is_banned ? "Activate" : "Deactivate"}
                    </button>
                    <button
                      onClick={() => { setDelId(c.id); setOpenMenu(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="size-3.5"/> Delete
                    </button>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </>,
          document.body
        )}

        {/* Detail drawer + delete confirm */}
        <AnimatePresence>
          {detail && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setDetail(null)}/>
              <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}}
                transition={{type:"spring",stiffness:320,damping:32}}
                className="relative w-full max-w-sm h-full overflow-y-auto bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
                onClick={e=>e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                  <h3 className="font-bold text-white">Client Profile</h3>
                  <button onClick={()=>setDetail(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors">
                    <X className="size-4"/>
                  </button>
                </div>

                <div className="p-5 space-y-5 flex-1">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold">
                      {(detail.name || detail.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{detail.name || "—"}</h4>
                      <p className="text-sm text-slate-400">{detail.email}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {(() => { const sb = statusBadge(detail); return (
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", sb.cls)}>{sb.label}</span>
                        ); })()}
                        {detail.wa_connected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">WA Connected</span>
                        )}
                        {detail.clinic_name && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-500/10 border-teal-500/20 text-teal-400">Healthcare</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label:"Contacts",    value:detail.contacts,      icon:Users },
                      { label:"Convos",      value:detail.conversations, icon:MessageSquare },
                      { label:"Broadcasts",  value:detail.broadcasts,    icon:Radio },
                      { label:"Automations", value:detail.automations,   icon:Zap },
                      { label:"Open Convos", value:detail.open_conversations, icon:MessageSquare },
                    ].map(m=>(
                      <div key={m.label} className="rounded-xl border border-slate-800 bg-slate-800/50 p-2.5 text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wide">{m.label}</p>
                        <p className="text-lg font-bold text-white mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Account info */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account</p>
                    {[
                      { label:"Provider",   value:detail.provider },
                      { label:"Role",       value:detail.role },
                      { label:"Confirmed",  value:detail.confirmed ? "✓ Yes" : "✗ No" },
                      { label:"Joined",     value:fmt(detail.joined_at) },
                      { label:"Last Login", value:fmt(detail.last_sign_in) },
                    ].map(r=>(
                      <div key={r.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{r.label}</span>
                        <span className="font-medium text-white">{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* WhatsApp info */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">WhatsApp</p>
                    {[
                      { label:"Status",      value:detail.wa_status },
                      { label:"Phone ID",    value:detail.wa_phone_id ?? "—" },
                      { label:"WABA ID",     value:detail.wa_waba_id ?? "—" },
                      { label:"Connected",   value:fmt(detail.wa_connected_at) },
                    ].map(r=>(
                      <div key={r.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{r.label}</span>
                        <span className="font-medium text-white truncate max-w-[140px]">{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Healthcare clinic */}
                  {detail.clinic_name && (
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Healthcare Clinic</p>
                      {[
                        { label:"Name",  value:detail.clinic_name },
                        { label:"Type",  value:detail.clinic_type ?? "—" },
                        { label:"City",  value:detail.clinic_city ?? "—" },
                        { label:"Phone", value:detail.clinic_phone ?? "—" },
                      ].map(r=>(
                        <div key={r.label} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{r.label}</span>
                          <span className="font-medium text-white">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={()=>toggleActive(detail)}
                      disabled={toggling===detail.id}
                      className={cn(
                        "w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors",
                        detail.is_banned
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                      )}
                    >
                      {toggling===detail.id
                        ? <Loader2 className="size-3.5 animate-spin"/>
                        : detail.is_banned ? <ShieldCheck className="size-3.5"/> : <ShieldOff className="size-3.5"/>}
                      {detail.is_banned ? "Activate Client" : "Deactivate Client"}
                    </button>
                    <button onClick={()=>{setDelId(detail.id);setDetail(null);}}
                      className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                      <Trash2 className="size-3.5"/>Delete Client
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Delete confirm */}
          {delId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setDelId(null)}/>
              <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
                className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                  <Trash2 className="size-6 text-red-400"/>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-white">Delete Client?</h3>
                  <p className="text-sm text-slate-400 mt-1">Permanently removes the user and all their data from Supabase. Cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setDelId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
                  <button onClick={()=>handleDelete(delId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 transition-colors">Delete</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}
