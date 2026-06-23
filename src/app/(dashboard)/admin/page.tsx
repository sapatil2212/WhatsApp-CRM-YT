"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Filter, MoreVertical, Edit2, Trash2,
  CheckCircle, XCircle, Clock, TrendingUp, DollarSign,
  Building2, Mail, Phone, Globe, Calendar, Shield, X,
  ChevronUp, ChevronDown, Download, RefreshCw, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────
type Status = "active" | "inactive" | "trial" | "suspended";
type Plan   = "starter" | "professional" | "growth" | "enterprise";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  plan: Plan;
  status: Status;
  mrr: number;
  messages: number;
  agents: number;
  joinedAt: string;
  lastActive: string;
  country: string;
  notes: string;
}

// ── Seed data ──────────────────────────────────────────────────────────
const SEED: Client[] = [
  { id:"1", name:"Sarah Jenkins", company:"LeadLoop Inc", email:"sarah@leadloop.io", phone:"+1 415 555 0101", website:"leadloop.io", plan:"enterprise", status:"active", mrr:1200, messages:48200, agents:12, joinedAt:"2025-01-15", lastActive:"2026-05-27", country:"USA", notes:"High-value client. Quarterly review scheduled." },
  { id:"2", name:"Marcus Vance", company:"Pulse Store", email:"marcus@pulseshop.co", phone:"+44 20 7946 0102", website:"pulseshop.co", plan:"growth", status:"active", mrr:480, messages:22100, agents:5, joinedAt:"2025-03-08", lastActive:"2026-05-26", country:"UK", notes:"E-commerce. Cart recovery use case." },
  { id:"3", name:"Priya Sharma", company:"HealthFirst Clinic", email:"priya@healthfirst.in", phone:"+91 98765 43210", website:"healthfirst.in", plan:"professional", status:"trial", mrr:0, messages:3400, agents:2, joinedAt:"2026-05-01", lastActive:"2026-05-25", country:"India", notes:"14-day trial. Follow up on day 10." },
  { id:"4", name:"Carlos Mendez", company:"AutoSales MX", email:"carlos@autosalesmx.com", phone:"+52 55 1234 5678", website:"autosalesmx.com", plan:"starter", status:"active", mrr:120, messages:5800, agents:2, joinedAt:"2025-07-20", lastActive:"2026-05-24", country:"Mexico", notes:"" },
  { id:"5", name:"Aiko Tanaka", company:"Zen Retail JP", email:"aiko@zenretail.jp", phone:"+81 3 1234 5678", website:"zenretail.jp", plan:"growth", status:"inactive", mrr:480, messages:0, agents:4, joinedAt:"2025-02-11", lastActive:"2026-03-10", country:"Japan", notes:"Churned — budget freeze. Re-engage Q3." },
  { id:"6", name:"Fatima Al-Hassan", company:"Gulf Logistics", email:"fatima@gulflogi.ae", phone:"+971 4 555 0106", website:"gulflogi.ae", plan:"enterprise", status:"active", mrr:1800, messages:91000, agents:20, joinedAt:"2024-11-01", lastActive:"2026-05-27", country:"UAE", notes:"Largest account. Dedicated AM assigned." },
];

const PLAN_META: Record<Plan, { label: string; color: string; bg: string }> = {
  starter:      { label:"Starter",      color:"text-slate-400",  bg:"bg-slate-500/10 border-slate-500/20" },
  professional: { label:"Professional", color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20" },
  growth:       { label:"Growth",       color:"text-teal-400", bg:"bg-teal-500/10 border-teal-500/20" },
  enterprise:   { label:"Enterprise",   color:"text-amber-400",  bg:"bg-amber-500/10 border-amber-500/20" },
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  active:    { label:"Active",    color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20", icon:CheckCircle },
  inactive:  { label:"Inactive",  color:"text-slate-400",   bg:"bg-slate-500/10 border-slate-500/20",    icon:XCircle },
  trial:     { label:"Trial",     color:"text-teal-400",    bg:"bg-teal-500/10 border-teal-500/20",      icon:Clock },
  suspended: { label:"Suspended", color:"text-red-400",     bg:"bg-red-500/10 border-red-500/20",        icon:XCircle },
};

const EMPTY: Omit<Client,"id"> = {
  name:"", company:"", email:"", phone:"", website:"",
  plan:"starter", status:"active", mrr:0, messages:0, agents:1,
  joinedAt: new Date().toISOString().slice(0,10),
  lastActive: new Date().toISOString().slice(0,10),
  country:"", notes:"",
};

// ── Stat card ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub: string;
  icon: typeof Users; accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accent)}>
        <Icon className="size-5" />
      </div>
    </div>
  );
}

// ── Client form modal ──────────────────────────────────────────────────
function ClientModal({ client, onSave, onClose }: {
  client: Partial<Client> & { id?: string };
  onSave: (c: Client) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Client,"id">>({
    name:       client.name       ?? "",
    company:    client.company    ?? "",
    email:      client.email      ?? "",
    phone:      client.phone      ?? "",
    website:    client.website    ?? "",
    plan:       client.plan       ?? "starter",
    status:     client.status     ?? "active",
    mrr:        client.mrr        ?? 0,
    messages:   client.messages   ?? 0,
    agents:     client.agents     ?? 1,
    joinedAt:   client.joinedAt   ?? new Date().toISOString().slice(0,10),
    lastActive: client.lastActive ?? new Date().toISOString().slice(0,10),
    country:    client.country    ?? "",
    notes:      client.notes      ?? "",
  });

  const set = (k: keyof typeof form, v: string | number) =>
    setForm(p => ({ ...p, [k]: v }));

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:0.95,y:12}} transition={{type:"spring",stiffness:380,damping:30}}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {client.id ? "Edit Client" : "Add New Client"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {client.id ? `Editing ${client.name}` : "Fill in the client details below"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Users className="size-3.5" /> Contact Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Full Name *</label>
                <input required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Jane Smith" className={inputCls} /></div>
              <div><label className={labelCls}>Company *</label>
                <input required value={form.company} onChange={e=>set("company",e.target.value)} placeholder="Acme Corp" className={inputCls} /></div>
              <div><label className={labelCls}>Email *</label>
                <input required type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="jane@acme.com" className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label>
                <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 555 000 0000" className={inputCls} /></div>
              <div><label className={labelCls}>Website</label>
                <input value={form.website} onChange={e=>set("website",e.target.value)} placeholder="acme.com" className={inputCls} /></div>
              <div><label className={labelCls}>Country</label>
                <input value={form.country} onChange={e=>set("country",e.target.value)} placeholder="USA" className={inputCls} /></div>
            </div>
          </div>

          {/* Subscription */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <DollarSign className="size-3.5" /> Subscription
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Plan</label>
                <select value={form.plan} onChange={e=>set("plan",e.target.value as Plan)} className={inputCls}>
                  {(["starter","professional","growth","enterprise"] as Plan[]).map(p=>(
                    <option key={p} value={p}>{PLAN_META[p].label}</option>
                  ))}
                </select>
              </div>
              <div><label className={labelCls}>Status</label>
                <select value={form.status} onChange={e=>set("status",e.target.value as Status)} className={inputCls}>
                  {(["active","inactive","trial","suspended"] as Status[]).map(s=>(
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
              <div><label className={labelCls}>MRR ($)</label>
                <input type="number" min={0} value={form.mrr} onChange={e=>set("mrr",Number(e.target.value))} className={inputCls} /></div>
              <div><label className={labelCls}>Agents</label>
                <input type="number" min={1} value={form.agents} onChange={e=>set("agents",Number(e.target.value))} className={inputCls} /></div>
              <div><label className={labelCls}>Monthly Messages</label>
                <input type="number" min={0} value={form.messages} onChange={e=>set("messages",Number(e.target.value))} className={inputCls} /></div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Calendar className="size-3.5" /> Dates
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Joined Date</label>
                <input type="date" value={form.joinedAt} onChange={e=>set("joinedAt",e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Last Active</label>
                <input type="date" value={form.lastActive} onChange={e=>set("lastActive",e.target.value)} className={inputCls} /></div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Internal Notes</label>
            <textarea rows={3} value={form.notes} onChange={e=>set("notes",e.target.value)}
              placeholder="Add any internal notes about this client..."
              className={cn(inputCls, "resize-none")} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.name || !form.company || !form.email) return;
              onSave({ ...form, id: client.id ?? String(Date.now()) });
            }}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            {client.id ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Detail drawer ──────────────────────────────────────────────────────
function ClientDrawer({ client, onEdit, onClose }: {
  client: Client; onEdit: () => void; onClose: () => void;
}) {
  const plan   = PLAN_META[client.plan];
  const status = STATUS_META[client.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}}
        transition={{type:"spring",stiffness:320,damping:32}}
        className="relative w-full max-w-md h-full overflow-y-auto bg-card border-l border-border shadow-2xl flex flex-col"
        onClick={e=>e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-bold text-foreground">Client Details</h3>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
              <Edit2 className="size-3" /> Edit
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground">{client.name}</h4>
              <p className="text-sm text-muted-foreground">{client.company}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", status.bg, status.color)}>
                  <StatusIcon className="size-2.5" /> {status.label}
                </span>
                <span className={cn("inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border", plan.bg, plan.color)}>
                  {plan.label}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact</p>
            {[
              { icon: Mail,      val: client.email },
              { icon: Phone,     val: client.phone },
              { icon: Globe,     val: client.website },
              { icon: Building2, val: client.country },
            ].filter(r=>r.val).map(({ icon: Icon, val }) => (
              <div key={val} className="flex items-center gap-3 text-sm text-foreground">
                <Icon className="size-4 text-muted-foreground shrink-0" />
                <span className="truncate">{val}</span>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"MRR",      value:`$${client.mrr.toLocaleString()}` },
              { label:"Messages", value:client.messages.toLocaleString() },
              { label:"Agents",   value:String(client.agents) },
            ].map(m=>(
              <div key={m.label} className="rounded-xl border border-border bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                <p className="text-lg font-bold text-foreground mt-1">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium text-foreground">{new Date(client.joinedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Active</span>
              <span className="font-medium text-foreground">{new Date(client.lastActive).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-xl p-3 border border-border">{client.notes}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
type SortKey = "name" | "company" | "mrr" | "messages" | "joinedAt" | "lastActive";

export default function AdminPage() {
  const [clients, setClients]       = useState<Client[]>(SEED);
  const [search,  setSearch]        = useState("");
  const [statusF, setStatusF]       = useState<Status | "all">("all");
  const [planF,   setPlanF]         = useState<Plan   | "all">("all");
  const [sortKey, setSortKey]       = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir]       = useState<"asc"|"desc">("desc");
  const [modal,   setModal]         = useState<"add" | Client | null>(null);
  const [drawer,  setDrawer]        = useState<Client | null>(null);
  const [delId,   setDelId]         = useState<string | null>(null);
  const [openMenu,setOpenMenu]      = useState<string | null>(null);

  // ── Derived stats ──
  const totalMRR    = clients.reduce((s,c)=>s+c.mrr,0);
  const activeCount = clients.filter(c=>c.status==="active").length;
  const trialCount  = clients.filter(c=>c.status==="trial").length;

  // ── Filtered + sorted ──
  const filtered = useMemo(()=>{
    let r = clients.filter(c=>{
      const q = search.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchS = statusF==="all" || c.status===statusF;
      const matchP = planF==="all"   || c.plan===planF;
      return matchQ && matchS && matchP;
    });
    r = [...r].sort((a,b)=>{
      const av = a[sortKey]; const bv = b[sortKey];
      const cmp = typeof av==="number" && typeof bv==="number" ? av-bv : String(av).localeCompare(String(bv));
      return sortDir==="asc" ? cmp : -cmp;
    });
    return r;
  },[clients,search,statusF,planF,sortKey,sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey===k) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey===k ? (sortDir==="asc" ? <ChevronUp className="size-3"/> : <ChevronDown className="size-3"/>) : null;

  const saveClient = (c: Client) => {
    setClients(p => p.some(x=>x.id===c.id) ? p.map(x=>x.id===c.id?c:x) : [...p,c]);
    setModal(null);
  };

  const deleteClient = (id: string) => {
    setClients(p=>p.filter(c=>c.id!==id));
    setDelId(null);
    if (drawer?.id===id) setDrawer(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="size-6 text-primary" /> Super Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all agency clients, subscriptions, and account details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors">
            <Download className="size-3.5" /> Export
          </button>
          <button
            onClick={()=>setModal("add")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="size-3.5" /> Add Client
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients"   value={String(clients.length)} sub={`${activeCount} active`}  icon={Users}       accent="bg-primary/10 text-primary" />
        <StatCard label="Monthly Revenue" value={`$${totalMRR.toLocaleString()}`} sub="combined MRR"   icon={DollarSign}  accent="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Active Accounts" value={String(activeCount)}    sub="paying clients"           icon={CheckCircle} accent="bg-teal-500/10 text-teal-400" />
        <StatCard label="On Trial"        value={String(trialCount)}     sub="converting soon"          icon={Clock}       accent="bg-amber-500/10 text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value as Status|"all")}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
          <option value="all">All Statuses</option>
          {(["active","inactive","trial","suspended"] as Status[]).map(s=>(
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <select value={planF} onChange={e=>setPlanF(e.target.value as Plan|"all")}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
          <option value="all">All Plans</option>
          {(["starter","professional","growth","enterprise"] as Plan[]).map(p=>(
            <option key={p} value={p}>{PLAN_META[p].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {([
                  ["name","Client",true],["company","Company",true],
                  ["plan","Plan",false],["status","Status",false],
                  ["mrr","MRR",true],["messages","Messages",true],
                  ["joinedAt","Joined",true],["lastActive","Last Active",true],
                ] as [SortKey|string, string, boolean][]).map(([k,label,sortable])=>(
                  <th key={k} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {sortable ? (
                      <button onClick={()=>toggleSort(k as SortKey)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {label} <SortIcon k={k as SortKey} />
                      </button>
                    ) : label}
                  </th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No clients match your filters.
                  </td></tr>
                ) : filtered.map((c,i)=>{
                  const plan   = PLAN_META[c.plan];
                  const status = STATUS_META[c.status];
                  const StatusIcon = status.icon;
                  return (
                    <motion.tr key={c.id}
                      initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                      exit={{opacity:0}} transition={{delay:i*0.03}}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={()=>setDrawer(c)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{c.company}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", plan.bg, plan.color)}>
                          {plan.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", status.bg, status.color)}>
                          <StatusIcon className="size-2.5" /> {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground tabular-nums">${c.mrr.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{c.messages.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(c.joinedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(c.lastActive).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                      <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                        <div className="relative">
                          <button onClick={()=>setOpenMenu(openMenu===c.id?null:c.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <MoreVertical className="size-4" />
                          </button>
                          <AnimatePresence>
                            {openMenu===c.id && (
                              <motion.div initial={{opacity:0,scale:0.95,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
                                className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
                                <button onClick={()=>{setDrawer(c);setOpenMenu(null);}} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors">
                                  <Eye className="size-3.5" /> View
                                </button>
                                <button onClick={()=>{setModal(c);setOpenMenu(null);}} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors">
                                  <Edit2 className="size-3.5" /> Edit
                                </button>
                                <button onClick={()=>{setDelId(c.id);setOpenMenu(null);}} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
                                  <Trash2 className="size-3.5" /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {clients.length} clients</span>
          <button onClick={()=>{setSearch("");setStatusF("all");setPlanF("all");}} className="flex items-center gap-1 hover:text-foreground transition-colors">
            <RefreshCw className="size-3" /> Reset filters
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <ClientModal
            client={modal==="add" ? {} : modal}
            onSave={saveClient}
            onClose={()=>setModal(null)}
          />
        )}
        {drawer && (
          <ClientDrawer
            client={drawer}
            onEdit={()=>{setModal(drawer);setDrawer(null);}}
            onClose={()=>setDrawer(null)}
          />
        )}
        {delId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setDelId(null)} />
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="size-6 text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground">Delete Client?</h3>
                <p className="text-sm text-muted-foreground mt-1">This action cannot be undone. The client and all their data will be permanently removed.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setDelId(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button onClick={()=>deleteClient(delId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
