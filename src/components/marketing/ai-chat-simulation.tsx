"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Check, Phone, Video, MoreVertical, ArrowLeft, Sparkles, Smile, Paperclip, Mic, Signal, Wifi, BatteryFull } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

const CONVERSATION: Omit<Message, "id">[] = [
  { sender: "user", text: "Hey! I'm interested in your Enterprise plan. Can I get a demo?", time: "10:24", status: "read" },
  { sender: "ai",   text: "Hi there! 👋 I'd love to help. What's your company name and monthly message volume?", time: "10:24" },
  { sender: "user", text: "Acme Corp — we send about 50,000 messages a month.", time: "10:25", status: "read" },
  { sender: "ai",   text: "Perfect! Based on your volume you qualify for our Premium Enterprise tier 🎉\n\nI've tagged you as *Enterprise Lead* and booked a call with Sarah Adams for May 28th at 2:00 PM.", time: "10:26" },
  { sender: "system", text: "⚙️ Lead tagged: Enterprise · Routed → Sarah Adams · Demo booked", time: "10:26" },
];

const DELAYS       = [0, 2000, 5000, 7000, 10500];
const TYPING_AT    = new Set([1, 3]);

export function AIChatSimulation() {
  const [visible, setVisible] = useState<Message[]>([]);
  const [typing,  setTyping]  = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    CONVERSATION.forEach((msg, i) => {
      if (TYPING_AT.has(i)) {
        timers.push(setTimeout(() => setTyping(true),  DELAYS[i]));
        timers.push(setTimeout(() => {
          setTyping(false);
          setVisible(p => [...p, { ...msg, id: String(i) }]);
        }, DELAYS[i] + 1400));
      } else {
        timers.push(setTimeout(() =>
          setVisible(p => [...p, { ...msg, id: String(i) }]),
        DELAYS[i]));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visible, typing]);

  return (
    <div className="relative mx-auto select-none" style={{ width: 295 }}>

      {/* ── Outer chassis ── */}
      <div
        className="relative"
        style={{
          width: 295,
          borderRadius: 36,
          background: "linear-gradient(160deg, #2a2a2e 0%, #1a1a1e 40%, #111114 100%)",
          padding: "3px",
          boxShadow: [
            "0 0 0 1px rgba(255,255,255,0.10)",
            "0 2px 0 1px rgba(255,255,255,0.06)",
            "inset 0 1px 0 rgba(255,255,255,0.12)",
            "0 40px 100px rgba(0,0,0,0.7)",
            "0 16px 40px rgba(0,0,0,0.5)",
          ].join(","),
        }}
      >
        {/* Left — silent switch */}
        <div style={{
          position: "absolute", left: -5, top: 96,
          width: 4, height: 28, borderRadius: "2px 0 0 2px",
          background: "linear-gradient(180deg,#3a3a3e,#252528)",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08), -1px 0 2px rgba(0,0,0,0.6)",
        }} />
        {/* Left — vol up */}
        <div style={{
          position: "absolute", left: -5, top: 140,
          width: 4, height: 44, borderRadius: "2px 0 0 2px",
          background: "linear-gradient(180deg,#3a3a3e,#252528)",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08), -1px 0 2px rgba(0,0,0,0.6)",
        }} />
        {/* Left — vol down */}
        <div style={{
          position: "absolute", left: -5, top: 196,
          width: 4, height: 44, borderRadius: "2px 0 0 2px",
          background: "linear-gradient(180deg,#3a3a3e,#252528)",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08), -1px 0 2px rgba(0,0,0,0.6)",
        }} />
        {/* Right — power */}
        <div style={{
          position: "absolute", right: -5, top: 160,
          width: 4, height: 60, borderRadius: "0 2px 2px 0",
          background: "linear-gradient(180deg,#3a3a3e,#252528)",
          boxShadow: "inset -1px 0 0 rgba(255,255,255,0.08), 1px 0 2px rgba(0,0,0,0.6)",
        }} />

        {/* ── Screen bezel ── */}
        <div style={{
          borderRadius: 34,
          overflow: "hidden",
          background: "#000",
          position: "relative",
        }}>

          {/* Screen glare — top-left diagonal highlight */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 50, pointerEvents: "none",
            borderRadius: 34,
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 45%)",
          }} />

          {/* ── Status bar ── */}
          <div style={{
            background: "#075E54",
            paddingTop: 14,
            paddingBottom: 4,
            paddingLeft: 20,
            paddingRight: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}>
            {/* Dynamic island */}
            <div style={{
              position: "absolute",
              top: 8, left: "50%",
              transform: "translateX(-50%)",
              width: 88, height: 22,
              background: "#000",
              borderRadius: 12,
              zIndex: 10,
            }} />

            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: 0.2 }}>
              9:41
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {/* Signal bars */}
              <svg width="14" height="11" viewBox="0 0 14 11" fill="white">
                <rect x="0" y="7" width="2.5" height="4" rx="0.5" opacity="1"/>
                <rect x="3.5" y="5" width="2.5" height="6" rx="0.5" opacity="1"/>
                <rect x="7" y="3" width="2.5" height="8" rx="0.5" opacity="1"/>
                <rect x="10.5" y="0" width="2.5" height="11" rx="0.5" opacity="1"/>
              </svg>
              {/* Wifi */}
              <svg width="14" height="11" viewBox="0 0 24 24" fill="white">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
              {/* Battery */}
              <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
                <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="white" strokeOpacity="0.9"/>
                <rect x="2" y="2" width="14" height="7" rx="1.5" fill="white"/>
                <path d="M19.5 3.5v4a1.5 1.5 0 000-4z" fill="white" fillOpacity="0.6"/>
              </svg>
            </div>
          </div>

          {/* ── WhatsApp chat header ── */}
          <div style={{
            background: "#075E54",
            padding: "8px 12px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <ArrowLeft size={18} color="rgba(255,255,255,0.85)" />
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg,#25D366,#128C7E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}>
              <Sparkles size={16} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.2, margin: 0 }}>
                Acme Concierge
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", margin: 0, marginTop: 1 }}>
                AI Agent · online
              </p>
            </div>
            <div style={{ display: "flex", gap: 14, color: "rgba(255,255,255,0.85)" }}>
              <Video size={17} />
              <Phone size={17} />
              <MoreVertical size={17} />
            </div>
          </div>

          {/* ── Chat body ── */}
          <div
            ref={scrollRef}
            style={{
              height: 400,
              overflowY: "auto",
              padding: "10px 10px 6px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              scrollbarWidth: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23128C7E' fill-opacity='0.055'%3E%3Cpath d='M50 50v-6h-3v6h-6v3h6v6h3v-6h6v-3h-6zm0-40V4h-3v6h-6v3h6v6h3v-6h6V4h-6zM10 50v-6H7v6H1v3h6v6h3v-6h6v-3h-6zM10 10V4H7v6H1v3h6v6h3v-6h6v-3h-6z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: "#E5DDD5",
            }}
          >
            {/* Date chip */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <span style={{
                fontSize: 9, background: "rgba(255,255,255,0.75)",
                color: "#555", padding: "2px 10px", borderRadius: 10,
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)", fontWeight: 500,
              }}>TODAY</span>
            </div>

            <AnimatePresence initial={false}>
              {visible.map((msg) => {
                if (msg.sender === "system") {
                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}
                    >
                      <span style={{
                        fontSize: 9, background: "rgba(255,243,205,0.92)",
                        color: "#7a5c00", padding: "4px 10px", borderRadius: 8,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        maxWidth: "90%", textAlign: "center", lineHeight: 1.5,
                      }}>{msg.text}</span>
                    </motion.div>
                  );
                }

                const isUser = msg.sender === "user";
                return (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
                  >
                    <div style={{
                      maxWidth: "80%",
                      background: isUser ? "#DCF8C6" : "#fff",
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      padding: "7px 10px 5px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                      position: "relative",
                    }}>
                      {/* Tail */}
                      {isUser ? (
                        <div style={{
                          position: "absolute", bottom: 0, right: -6,
                          width: 0, height: 0,
                          borderLeft: "7px solid #DCF8C6",
                          borderBottom: "7px solid transparent",
                        }} />
                      ) : (
                        <div style={{
                          position: "absolute", bottom: 0, left: -6,
                          width: 0, height: 0,
                          borderRight: "7px solid #fff",
                          borderBottom: "7px solid transparent",
                        }} />
                      )}

                      {!isUser && (
                        <p style={{ fontSize: 8, fontWeight: 700, color: "#25D366", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.4 }}>
                          AI Auto-Responder
                        </p>
                      )}

                      <p style={{ fontSize: 10.5, color: "#111", margin: 0, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                        {msg.text.split(/(\*[^*]+\*)/).map((part, i) =>
                          part.startsWith("*") && part.endsWith("*")
                            ? <strong key={i}>{part.slice(1, -1)}</strong>
                            : part
                        )}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 }}>
                        <span style={{ fontSize: 8, color: "#999" }}>{msg.time}</span>
                        {isUser && (
                          msg.status === "read"
                            ? <CheckCheck size={12} color="#53BDEB" />
                            : <Check size={12} color="#999" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  <div style={{
                    background: "#fff",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "10px 14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                    display: "flex", gap: 4, alignItems: "center",
                  }}>
                    {[0, 160, 320].map((d) => (
                      <span key={d} style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "#aaa", display: "inline-block",
                        animation: "bounce 1s infinite",
                        animationDelay: `${d}ms`,
                      }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Input bar ── */}
          <div style={{
            background: "#F0F0F0",
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{
              flex: 1, background: "#fff", borderRadius: 24,
              padding: "7px 12px", display: "flex", alignItems: "center",
              gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }}>
              <Smile size={16} color="#8696A0" />
              <span style={{ fontSize: 10, color: "#8696A0", flex: 1 }}>Message</span>
              <Paperclip size={15} color="#8696A0" />
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#25D366",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(37,211,102,0.4)",
              flexShrink: 0,
            }}>
              <Mic size={16} color="#fff" />
            </div>
          </div>

          {/* Home indicator */}
          <div style={{
            background: "#F0F0F0",
            display: "flex", justifyContent: "center",
            paddingBottom: 8, paddingTop: 4,
          }}>
            <div style={{
              width: 100, height: 4, borderRadius: 2,
              background: "rgba(0,0,0,0.2)",
            }} />
          </div>
        </div>
      </div>

      {/* Bounce keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position: "absolute", bottom: -20, left: "50%",
        transform: "translateX(-50%)",
        width: 200, height: 40,
        background: "rgba(37,211,102,0.18)",
        filter: "blur(24px)",
        borderRadius: "50%",
        pointerEvents: "none",
      }} />
    </div>
  );
}
