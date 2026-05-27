"use client";

import React from "react";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { Bot, MessageSquare, Shield, Zap, TrendingUp, Users, Smartphone, Layers, Terminal, Sparkles } from "lucide-react";

export default function FeaturesPage() {
  const categories = [
    {
      title: "Core Infrastructure",
      items: [
        {
          name: "Meta Official APIs",
          desc: "Connect to official Meta servers with absolute confidence. Safe from rate limits, compliance guidelines, and number locks.",
          icon: <Shield className="size-5 text-emerald-400" />,
        },
        {
          name: "Global Delivery Host",
          desc: "Super-fast delivery nodes around the world ensure your WhatsApp triggers reach customers under 300 milliseconds.",
          icon: <Smartphone className="size-5 text-cyan-400" />,
        },
        {
          name: "Developer SDKs",
          desc: "Integrate trigger messages into your codebase with Node.js, curl, and Python templates.",
          icon: <Terminal className="size-5 text-purple-400" />,
        },
      ],
    },
    {
      title: "AI Engagement",
      items: [
        {
          name: "Intent Auto-Responder",
          desc: "Detect language and classify lead interest autonomously. Respond in real-time using fine-tuned GPT context.",
          icon: <Bot className="size-5 text-indigo-400" />,
        },
        {
          name: "AI Appointment Booker",
          desc: "Detect if a user wants to speak to sales. Sync with Calendly or Google Calendar dynamically inside the chat.",
          icon: <Sparkles className="size-5 text-emerald-400" />,
        },
        {
          name: "Contact Segmentation",
          desc: "Automatically tag leads as 'Enterprise Lead', 'SMB', or 'Low Intent' based on AI chat qualification.",
          icon: <Layers className="size-5 text-amber-400" />,
        },
      ],
    },
    {
      title: "Sales Operations",
      items: [
        {
          name: "Shared Team Inbox",
          desc: "A collaborative shared dashboard for multiple agents. Assign chats, review statistics, and prevent client collisions.",
          icon: <Users className="size-5 text-purple-400" />,
        },
        {
          name: "Kanban Deal Board",
          desc: "Draggable deals mapped specifically to chat engagement. Adjust stage, update pipeline values, and view tasks.",
          icon: <TrendingUp className="size-5 text-cyan-400" />,
        },
        {
          name: "Campaign Broadcasts",
          desc: "Schedule template broadcasts to segmented contacts. Set variables, upload media headers, and view read receipts.",
          icon: <MessageSquare className="size-5 text-emerald-400" />,
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 space-y-20">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="size-3 animate-pulse" /> capabilities
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.1]">
          Engineered for Sales <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Automated for Operations.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] max-w-xl mx-auto">
          Explore the tools powering customer success, pipeline management, and autonomous follow-ups.
        </p>
      </div>

      {/* Grid of categories */}
      <div className="space-y-16">
        {categories.map((cat, catIndex) => (
          <div key={cat.title} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px bg-[var(--m-border-primary)] flex-1" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--m-text-muted)]">{cat.title}</span>
              <div className="h-px bg-[var(--m-border-primary)] flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cat.items.map((item, itemIndex) => (
                <SpotlightCard
                  key={item.name}
                  interactive={true}
                  glowColor={
                    catIndex === 0
                      ? "rgba(16, 185, 129, 0.12)"
                      : catIndex === 1
                      ? "rgba(6, 182, 212, 0.12)"
                      : "rgba(168, 85, 247, 0.12)"
                  }
                >
                  <div className="mb-4 w-10 h-10 rounded-xl bg-[var(--m-bg-secondary)] border border-[var(--m-border-glass)] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h4 className="text-sm font-bold text-[var(--m-text-secondary)]">{item.name}</h4>
                  <p className="text-xs text-[var(--m-text-tertiary)] mt-2 leading-relaxed">{item.desc}</p>
                </SpotlightCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
