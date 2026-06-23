"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Calendar, Clock, Video, CheckCircle, User, Mail, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookDemoModalProps {
  open: boolean;
  onClose: () => void;
}

const slots = ["10:00 AM", "11:30 AM", "2:00 PM", "3:30 PM", "5:00 PM"];

export function BookDemoModal({ open, onClose }: BookDemoModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate 6 upcoming business days dynamically
  const dates = useMemo(() => {
    const list = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const stdMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const current = new Date();
    // If it's past 5 PM, start from tomorrow
    if (current.getHours() >= 17) {
      current.setDate(current.getDate() + 1);
    }
    
    while (list.length < 6) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        const dayName = days[dayOfWeek];
        const monthName = stdMonths[current.getMonth()];
        const dateNum = current.getDate();
        const year = current.getFullYear();
        
        const label = `${dayName}, ${monthName} ${dateNum}`;
        const val = `${year}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
        list.push({ label, val });
      }
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, []);

  const handleClose = () => {
    onClose();
    // Reset form inputs after transition closes
    setTimeout(() => {
      setSelectedDate(null); 
      setSelectedTime(null);
      setName(""); 
      setEmail(""); 
      setPhone("");
      setError(null);
      setSuccess(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !name || !email || !phone) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          date: selectedDate,
          time: selectedTime,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to book walkthrough. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = cn(
    "w-full rounded-xl px-3.5 py-2.5 text-xs transition-colors focus:outline-none focus:ring-2",
    "bg-m-bg-primary border border-m-border-primary text-m-text-primary placeholder:text-m-text-muted/50 focus:border-emerald-500 focus:ring-emerald-500/20"
  );

  const isFormComplete = name && email && phone && selectedDate && selectedTime;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed top-0 left-0 w-full h-full min-h-screen z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg rounded-2xl border border-m-border-primary bg-m-bg-surface backdrop-blur-xl text-m-text-primary shadow-2xl overflow-hidden transition-colors duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-m-border-primary bg-m-bg-primary/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-m-text-heading">
                      Book a Product Demo
                    </h2>
                    <p className="text-[11px] text-m-text-muted">
                      30-min live walkthrough · Google Meet
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-m-text-muted hover:text-m-text-primary hover:bg-m-bg-tertiary transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {success ? (
                /* ── Success state ── */
                <div className="px-6 py-12 flex flex-col items-center text-center gap-4 bg-transparent">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="size-7 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-m-text-heading">
                    You're booked!
                  </h3>
                  <p className="text-xs leading-relaxed max-w-sm text-m-text-secondary">
                    A confirmation email has been sent to <span className="font-semibold text-m-text-primary">{email}</span>. We'll meet on <span className="text-emerald-500 font-semibold">{selectedDate}</span> at <span className="text-emerald-500 font-semibold">{selectedTime}</span> via Google Meet.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-[0_2px_12px_rgba(0,223,130,0.2)]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                    {error && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                        {error}
                      </div>
                    )}

                    {/* 1. Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-[11px] uppercase font-bold tracking-widest text-m-text-muted border-b border-m-border-primary pb-1.5">
                        Contact Details
                      </h3>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-m-text-muted flex items-center gap-1.5">
                          <User className="size-3.5" /> Full Name *
                        </label>
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Smith"
                          className={inputCls}
                          disabled={loading}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wide text-m-text-muted flex items-center gap-1.5">
                            <Mail className="size-3.5" /> Work Email *
                          </label>
                          <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jane@company.com"
                            className={inputCls}
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wide text-m-text-muted flex items-center gap-1.5">
                            <Phone className="size-3.5" /> Phone Number *
                          </label>
                          <input
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 012-3456"
                            className={inputCls}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Schedule Appointment */}
                    <div className="space-y-4 pt-1">
                      <h3 className="text-[11px] uppercase font-bold tracking-widest text-m-text-muted border-b border-m-border-primary pb-1.5">
                        Select Date & Time
                      </h3>

                      {/* Date Selection */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-m-text-muted flex items-center gap-1.5">
                          <Calendar className="size-3.5" /> 1. Choose Date *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {dates.map((d) => {
                            const isSelected = selectedDate === d.label;
                            return (
                              <button
                                type="button"
                                key={d.val}
                                onClick={() => setSelectedDate(d.label)}
                                disabled={loading}
                                className={cn(
                                  "px-2.5 py-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center",
                                  isSelected
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-sm"
                                    : "bg-m-bg-primary border-m-border-primary text-m-text-secondary hover:bg-m-bg-tertiary hover:text-m-text-primary"
                                )}
                              >
                                {d.label.split(", ")[1]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Time Selection */}
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-m-text-muted flex items-center gap-1.5">
                          <Clock className="size-3.5" /> 2. Choose Time *
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {slots.map((s) => {
                            const isSelected = selectedTime === s;
                            return (
                              <button
                                type="button"
                                key={s}
                                onClick={() => setSelectedTime(s)}
                                disabled={loading}
                                className={cn(
                                  "px-1 py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer text-center",
                                  isSelected
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-sm"
                                    : "bg-m-bg-primary border-m-border-primary text-m-text-secondary hover:bg-m-bg-tertiary hover:text-m-text-primary"
                                )}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Location Note */}
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-m-text-tertiary">
                        <Video className="size-3.5 text-teal-500 shrink-0" />
                        <span>30-min Google Meet slot. Calendar invite will be sent.</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-t border-m-border-primary bg-m-bg-primary/20">
                    {/* Active slot details summary */}
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {selectedDate && selectedTime ? (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>Selected: {selectedDate.split(", ")[1]} at {selectedTime}</span>
                        </div>
                      ) : (
                        <span className="text-m-text-muted text-[11px]">Select a date and time slot...</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !isFormComplete}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-[0_2px_12px_rgba(0,223,130,0.2)] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading && <Loader2 className="size-3.5 animate-spin" />}
                      Confirm Booking
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
