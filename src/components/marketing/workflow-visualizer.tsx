"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Bot, UserCheck, Calendar, DollarSign, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  status: "idle" | "active" | "completed";
}

export function WorkflowVisualizer() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: "1", label: "Lead Inbound", sub: "Web form/Ad Click", icon: <MessageSquare className="size-4 text-emerald-400" />, status: "idle" },
    { id: "2", label: "AI Agent Qualifies", sub: "Analyze intent", icon: <Bot className="size-4 text-cyan-400" />, status: "idle" },
    { id: "3", label: "Auto Booking", sub: "Sync Calendar", icon: <Calendar className="size-4 text-purple-400" />, status: "idle" },
    { id: "4", label: "Assign Sales Rep", sub: "CRM routing", icon: <UserCheck className="size-4 text-amber-400" />, status: "idle" },
    { id: "5", label: "Follow-up & Pay", sub: "WhatsApp payment link", icon: <DollarSign className="size-4 text-emerald-400" />, status: "idle" },
    { id: "6", label: "Closed Won", sub: "Conversion 🎉", icon: <PartyPopper className="size-4 text-pink-400" />, status: "idle" },
  ]);

  const [activeEdge, setActiveEdge] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEdge((prev) => {
        const next = (prev + 1) % 6;
        setNodes((prevNodes) =>
          prevNodes.map((node, i) => {
            if (i < next) return { ...node, status: "completed" };
            if (i === next) return { ...node, status: "active" };
            return { ...node, status: "idle" };
          })
        );
        return next;
      });
    }, 2800);

    // Initial trigger
    setNodes((prevNodes) => [
      { ...prevNodes[0], status: "active" },
      ...prevNodes.slice(1),
    ]);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 p-8 rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] backdrop-blur-md overflow-hidden">
      {/* Background visual light effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/5 via-cyan-950/5 to-purple-950/5 pointer-events-none" />

      {nodes.map((node, index) => {
        const isActive = node.status === "active";
        const isCompleted = node.status === "completed";

        return (
          <React.Fragment key={node.id}>
            {/* Node */}
            <div className="flex flex-col items-center text-center relative z-10 w-full md:w-auto">
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.08, 1] : 1,
                  boxShadow: isActive
                    ? "0 0 20px rgba(16, 185, 129, 0.25)"
                    : "0 0 0px rgba(0,0,0,0)",
                }}
                transition={{
                  repeat: isActive ? Infinity : 0,
                  duration: 2,
                }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500",
                  isActive
                    ? "bg-[var(--m-bg-secondary)] border-emerald-500 text-emerald-400"
                    : isCompleted
                    ? "bg-[var(--m-bg-secondary)] border-emerald-600/40 text-emerald-500"
                    : "bg-[var(--m-bg-primary)] border-[var(--m-border-glass)] text-[var(--m-text-muted)]"
                )}
              >
                {node.icon}
              </motion.div>
              <h5
                className={cn(
                  "text-xs font-semibold mt-3 transition-colors duration-500",
                  isActive ? "text-[var(--m-text-primary)]" : isCompleted ? "text-[var(--m-text-secondary)]" : "text-[var(--m-text-muted)]"
                )}
              >
                {node.label}
              </h5>
              <p
                className={cn(
                  "text-[10px] mt-1 transition-colors duration-500 hidden sm:block",
                  isActive ? "text-[var(--m-text-tertiary)]" : "text-[var(--m-text-muted)]"
                )}
              >
                {node.sub}
              </p>
            </div>

            {/* Connector */}
            {index < nodes.length - 1 && (
              <div className="relative w-1 md:w-full h-10 md:h-1 flex items-center justify-center">
                {/* Horizontal line for desktop, vertical line for mobile */}
                <div className="absolute inset-0 w-[2px] md:w-full h-full md:h-[2px] bg-[var(--m-border-primary)] rounded-full" />
                <motion.div
                  initial={{ left: 0, top: 0 }}
                  animate={
                    activeEdge === index
                      ? {
                          left: ["0%", "100%"],
                          top: ["0%", "100%"],
                          opacity: [0, 1, 1, 0],
                        }
                      : { opacity: 0 }
                  }
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className={cn(
                    "absolute w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] pointer-events-none"
                  )}
                  style={{
                    display: activeEdge === index ? "block" : "none",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
