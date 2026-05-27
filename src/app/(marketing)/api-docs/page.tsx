"use client";

import React, { useState } from "react";
import { Terminal, Sparkles, Send, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

export default function APIDocsLanding() {
  const [lang, setLang] = useState<"curl" | "node" | "python">("curl");

  const codes = {
    curl: `curl -X POST https://api.wacrm.co/v1/messages \\
  -H "Authorization: Bearer wacrm_sec_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+15550199",
    "template_name": "welcome_alert",
    "language": "en",
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Acme Partner" }
        ]
      }
    ]
  }'`,
    node: `const client = require('@wacrm/sdk')('wacrm_sec_live_...');

await client.messages.sendTemplate({
  to: '+15550199',
  templateName: 'welcome_alert',
  languageCode: 'en',
  bodyParameters: ['Acme Partner']
});`,
    python: `import wacrm

client = wacrm.Client(api_key='wacrm_sec_live_...')

client.messages.send_template(
    to='+15550199',
    template_name='welcome_alert',
    language_code='en',
    body_parameters=['Acme Partner']
)`,
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      {/* Documentation Info column */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/25 bg-purple-950/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
          <Terminal className="size-3.5" /> developer API
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.08]">
          Trigger Messages <br />
          <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            with a Single POST.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] leading-relaxed">
          Send transaction updates, shipping notifications, and custom alerts. Connect your webhook listeners to subscribe to delivery receipts and user responses in real-time.
        </p>

        {/* Bullet details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex gap-2">
            <span className="text-purple-450 font-bold font-mono">✓</span>
            <div>
              <h4 className="text-xs font-bold text-[var(--m-text-secondary)]">Bearer Token Auth</h4>
              <p className="text-[10px] text-[var(--m-text-tertiary)] mt-0.5">Authorize all triggers with secure HTTPS headers.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-450 font-bold font-mono">✓</span>
            <div>
              <h4 className="text-xs font-bold text-[var(--m-text-secondary)]">Webhook Listeners</h4>
              <p className="text-[10px] text-[var(--m-text-tertiary)] mt-0.5">Subscribe to JSON payloads for read/delivered receipts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal IDE Code Block column */}
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/5 blur-[95px] pointer-events-none" />
        
        <div className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-primary)] p-4 shadow-2xl relative z-10 flex flex-col h-[380px] justify-between">
          {/* Header IDE controls */}
          <div className="flex items-center justify-between border-b border-[var(--m-border-primary)] pb-3 mb-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--m-bg-tertiary)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--m-bg-secondary)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500/30" />
            </div>

            {/* Lang switch tabs */}
            <div className="flex gap-2">
              {(["curl", "node", "python"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLang(t)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer uppercase ${
                    lang === t ? "bg-purple-500/10 border border-purple-500/30 text-purple-450" : "text-[var(--m-text-muted)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Code text */}
          <div className="flex-1 bg-[var(--m-bg-secondary)]/40 border border-[var(--m-border-glass)]/80 rounded-lg p-4 font-mono text-[11px] text-[var(--m-text-secondary)] leading-relaxed overflow-x-auto whitespace-pre">
            {codes[lang]}
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between border-t border-[var(--m-border-primary)] pt-4 mt-3">
            <span className="text-[9px] text-[var(--m-text-muted)]">200 OK — Delivered in 240ms</span>
            <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded px-1.5 py-0.5 font-bold">API ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
