"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Bot, Sparkles, UserCheck } from "lucide-react";

interface NotificationEvent {
  id: string;
  type: "ai" | "campaign" | "crm";
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export function FloatingNotification() {
  const events: NotificationEvent[] = [
    {
      id: "1",
      type: "ai",
      title: "AI Response Sent",
      desc: "Lead Acme Corp qualified as 'High Intent'",
      icon: <Bot className="size-4 text-emerald-400" />,
    },
    {
      id: "2",
      type: "crm",
      title: "Lead Routed to CRM",
      desc: "Assigned to Sarah Adams (Enterprise Sales)",
      icon: <UserCheck className="size-4 text-cyan-400" />,
    },
    {
      id: "3",
      type: "campaign",
      title: "Campaign Broadcast Complete",
      desc: "Delivered 12,450 templates (98.4% read rate)",
      icon: <MessageSquare className="size-4 text-purple-400" />,
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % events.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const current = events[index];

  return (
    <div className="w-[320px] h-[75px] relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="absolute inset-0 rounded-xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] px-4 py-3 backdrop-blur-xl shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center gap-3"
        >
          {/* Glowing indicator ring */}
          <div className="w-8 h-8 rounded-lg bg-[var(--m-bg-secondary)] border border-[var(--m-border-glass)] flex items-center justify-center relative shrink-0">
            {current.icon}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="text-[11px] font-semibold text-[var(--m-text-primary)] flex items-center gap-1">
              {current.title}{" "}
              {current.type === "ai" && <Sparkles className="size-3 text-emerald-400" />}
            </h5>
            <p className="text-[10px] text-[var(--m-text-tertiary)] truncate mt-0.5">{current.desc}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
