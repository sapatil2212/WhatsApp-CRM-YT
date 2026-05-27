"use client";

import React, { useState } from "react";
import { Sparkles, Calendar, Clock, Video, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

export default function BookDemoPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dates = [
    { label: "Wed, May 27", val: "2026-05-27" },
    { label: "Thu, May 28", val: "2026-05-28" },
    { label: "Fri, May 29", val: "2026-05-29" },
  ];

  const slots = ["10:00 AM", "11:30 AM", "2:00 PM", "3:30 PM"];

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) return;
    setSuccess(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      {/* Description Column */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-[var(--m-badge-bg)] text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="size-3.5" /> video briefing
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--m-text-heading)] tracking-tight leading-[1.08]">
          Book a 1-on-1 <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Product Walkthrough.
          </span>
        </h1>
        <p className="text-sm text-[var(--m-text-tertiary)] leading-relaxed">
          Schedule a live screen-share with a sales solutions architect. Learn how to connect your Meta templates, configure auto-responder prompts, and track pipeline analytics.
        </p>

        {/* Video details */}
        <div className="space-y-3.5 border-t border-[var(--m-border-primary)] pt-6 mt-6">
          <div className="flex items-center gap-3.5 text-xs text-[var(--m-text-tertiary)]">
            <Clock className="size-4 text-emerald-400" />
            <span>30-minute custom briefing</span>
          </div>
          <div className="flex items-center gap-3.5 text-xs text-[var(--m-text-tertiary)]">
            <Video className="size-4 text-cyan-400" />
            <span>Live Zoom / Google Meet screen-share</span>
          </div>
        </div>
      </div>

      {/* Scheduler Widget Column */}
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[95px] pointer-events-none" />

        {success ? (
          <Card className="border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur text-center relative z-10 shadow-2xl">
            <CardContent className="pt-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--m-text-heading)]">Consultation Scheduled!</h3>
              <p className="text-xs text-[var(--m-text-tertiary)] leading-relaxed max-w-sm mx-auto">
                Calendar invite sent to your address. We will meet on {selectedDate} at {selectedTime} via Google Meet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] p-6 backdrop-blur relative z-10 shadow-2xl space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-4.5 text-emerald-400" />
              <span className="text-xs font-bold text-[var(--m-text-secondary)]">Select Date & Time</span>
            </div>

            {/* Date Select Grid */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-[var(--m-text-muted)]">Available Dates</span>
              <div className="grid grid-cols-3 gap-3">
                {dates.map((d) => (
                  <button
                    key={d.val}
                    onClick={() => setSelectedDate(d.label)}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      selectedDate === d.label
                        ? "bg-[var(--m-bg-secondary)] border-emerald-500/40 text-emerald-400"
                        : "bg-[var(--m-bg-card)] border-[var(--m-border-glass)] text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Select Grid */}
            {selectedDate && (
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-[var(--m-text-muted)]">Available Slots</span>
                <div className="grid grid-cols-2 gap-3">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedTime(s)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        selectedTime === s
                          ? "bg-[var(--m-bg-secondary)] border-emerald-500/40 text-emerald-400"
                          : "bg-[var(--m-bg-card)] border-[var(--m-border-glass)] text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm button */}
            {selectedDate && selectedTime && (
              <button
                onClick={handleBooking}
                className="w-full h-10 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center transition-colors hover:bg-emerald-400 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                Confirm Appointment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
