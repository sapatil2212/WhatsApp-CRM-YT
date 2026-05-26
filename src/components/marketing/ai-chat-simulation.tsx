"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, Send, Sparkles, User, ShieldAlert, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  isNote?: boolean;
}

export function AIChatSimulation() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "user",
      text: "Hey, I'm interested in your Enterprise plan! Can I get a demo?",
      timestamp: "10:24 AM",
      status: "read",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<string[]>(["New Lead", "WhatsApp"]);

  useEffect(() => {
    // Stage 1: AI Starts typing after 1.5 seconds
    const t1 = setTimeout(() => {
      setIsTyping(true);
    }, 1500);

    // Stage 2: AI responds
    const t2 = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: "2",
          sender: "ai",
          text: "Hi there! I'd love to help you get set up. What is your company name and approximate monthly message volume?",
          timestamp: "10:25 AM",
        },
      ]);
      setStep(1);
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Continue simulation after state changes
  useEffect(() => {
    if (step === 1) {
      // Simulate User reply
      const t3 = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: "3",
            sender: "user",
            text: "Acme Corp, we send about 50,000 messages a month.",
            timestamp: "10:25 AM",
            status: "read",
          },
        ]);
        setStep(2);
      }, 5000);
      return () => clearTimeout(t3);
    }

    if (step === 2) {
      // AI starts typing to qualify & auto-assign
      const t4 = setTimeout(() => {
        setIsTyping(true);
      }, 1500);

      const t5 = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: "4",
            sender: "ai",
            text: "Perfect. Based on your volume, you qualify for our Premium Enterprise Tier! I've automatically added the 'Enterprise Lead' tag and scheduled a sales call.",
            timestamp: "10:26 AM",
          },
          {
            id: "5",
            sender: "system",
            text: "Lead classified: Enterprise. Routed to Sales Team (Sarah Adams). Call booked: May 28th, 2:00 PM.",
            timestamp: "10:26 AM",
            isNote: true,
          },
        ]);
        setTags(["Enterprise Lead", "WhatsApp", "Routed to Sarah", "Demo Booked"]);
        setStep(3);
      }, 4800);

      return () => {
        clearTimeout(t4);
        clearTimeout(t5);
      };
    }
  }, [step]);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-[var(--m-bg-secondary)] border-b border-[var(--m-border-glass)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <Bot className="size-5" />
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[var(--m-bg-primary)]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--m-text-primary)] flex items-center gap-1.5">
              Acme Concierge <Sparkles className="size-3.5 text-emerald-400 animate-pulse" />
            </h4>
            <p className="text-xs text-[var(--m-text-tertiary)]">AI Agent Active</p>
          </div>
        </div>

        {/* Lead Tags */}
        <div className="flex flex-wrap gap-1 max-w-[180px] justify-end">
          <AnimatePresence>
            {tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                  tag === "Enterprise Lead"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : tag === "Demo Booked"
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-[var(--m-bg-tertiary)] border-[var(--m-border-secondary)] text-[var(--m-text-secondary)]"
                )}
              >
                {tag}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col">
        {messages.map((msg) => {
          if (msg.isNote) {
            return (
              <div key={msg.id} className="w-full flex justify-center py-1">
                <span className="text-[11px] bg-[var(--m-bg-secondary)] border border-[var(--m-border-primary)] text-[var(--m-text-tertiary)] px-3 py-1 rounded-lg max-w-[90%] text-center leading-relaxed">
                  ⚙️ {msg.text}
                </span>
              </div>
            );
          }

          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={cn("flex max-w-[85%] flex-col", isUser ? "self-end items-end" : "self-start")}
            >
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed relative",
                  isUser
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-[var(--m-bg-secondary)] border border-[var(--m-border-glass)] text-[var(--m-text-secondary)] rounded-tl-none shadow-md"
                )}
              >
                {msg.text}

                {/* Sender badge for AI */}
                {!isUser && (
                  <span className="absolute -top-2.5 left-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-bold">
                    AI Auto-Responder
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[var(--m-text-tertiary)] px-1">
                <span>{msg.timestamp}</span>
                {isUser && (
                  <span>
                    {msg.status === "read" ? (
                      <CheckCheck className="size-3.5 text-cyan-400" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="self-start flex flex-col max-w-[85%]"
            >
              <div className="rounded-2xl rounded-tl-none bg-[var(--m-bg-secondary)] border border-[var(--m-border-glass)] px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="bg-[var(--m-bg-secondary)] border-t border-[var(--m-border-glass)] p-3.5 flex items-center gap-2">
        <div className="flex-1 bg-[var(--m-bg-primary)] border border-[var(--m-border-primary)] rounded-xl px-3 py-2 text-xs text-[var(--m-text-muted)] pointer-events-none flex items-center justify-between">
          <span>Type message...</span>
          <Send className="size-3.5 text-[var(--m-text-muted)]" />
        </div>
      </div>
    </div>
  );
}
