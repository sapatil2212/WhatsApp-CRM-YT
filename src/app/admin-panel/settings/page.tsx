"use client";

import { useState } from "react";
import { Settings, Shield, Bell, Key, Save, Eye, EyeOff } from "lucide-react";
import { AdminShell } from "../admin-shell";

const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    adminEmail: "admin@agency.com",
    adminPassword: "",
    agencyName: "ChatNexGen Ai Agency",
    supportEmail: "support@agency.com",
    notifyNewClient: true,
    notifyChurn: true,
    notifyTrial: false,
  });

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  return (
    <AdminShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="size-6 text-emerald-400" /> Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">Configure admin panel preferences and credentials.</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <p className="text-sm font-bold text-white flex items-center gap-2"><Shield className="size-4 text-emerald-400" /> Agency Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Agency Name</label><input value={form.agencyName} onChange={e=>set("agencyName",e.target.value)} className={inputCls}/></div>
            <div><label className={labelCls}>Support Email</label><input type="email" value={form.supportEmail} onChange={e=>set("supportEmail",e.target.value)} className={inputCls}/></div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <p className="text-sm font-bold text-white flex items-center gap-2"><Key className="size-4 text-emerald-400" /> Admin Credentials</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Admin Email</label><input type="email" value={form.adminEmail} onChange={e=>set("adminEmail",e.target.value)} className={inputCls}/></div>
            <div><label className={labelCls}>New Password</label>
              <div className="relative">
                <input type={showPass?"text":"password"} value={form.adminPassword} onChange={e=>set("adminPassword",e.target.value)} placeholder="Leave blank to keep current" className={inputCls+" pr-10"}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass?<EyeOff className="size-4"/>:<Eye className="size-4"/>}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">Set via env vars <code className="text-emerald-400">SUPER_ADMIN_USERNAME</code> and <code className="text-emerald-400">SUPER_ADMIN_PASSWORD</code>.</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <p className="text-sm font-bold text-white flex items-center gap-2"><Bell className="size-4 text-emerald-400" /> Notifications</p>
          {[
            { key: "notifyNewClient", label: "New client signup",     sub: "Alert when a new client is added" },
            { key: "notifyChurn",     label: "Client churn alert",    sub: "Alert when a client goes inactive" },
            { key: "notifyTrial",     label: "Trial expiry reminder", sub: "Alert 2 days before trial ends" },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{n.label}</p>
                <p className="text-xs text-slate-500">{n.sub}</p>
              </div>
              <button onClick={()=>set(n.key,!form[n.key as keyof typeof form])}
                className={`relative w-10 h-6 rounded-full transition-colors ${form[n.key as keyof typeof form]?"bg-emerald-600":"bg-slate-700"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form[n.key as keyof typeof form]?"translate-x-4":"translate-x-0"}`}/>
              </button>
            </div>
          ))}
        </div>

        <button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">
          <Save className="size-4"/>{saved?"Saved!":"Save Settings"}
        </button>
      </div>
    </AdminShell>
  );
}
