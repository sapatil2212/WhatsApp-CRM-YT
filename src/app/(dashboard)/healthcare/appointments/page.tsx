"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  UserRound,
  Stethoscope,
  Filter,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
  Users,
  Activity,
  MessageSquare,
  Sparkles,
  Send,
  MoreVertical,
  Check,
  Eye,
  Phone,
  Bookmark,
  CalendarRange,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useTheme } from "@/hooks/use-theme";

function formatDocName(name: string): string {
  if (!name) return "";
  return name.toLowerCase().startsWith("dr") ? name : `Dr. ${name}`;
}

export default function AppointmentsManagement() {
  const db = createClient();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");

  // View modes
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Patient detail drawer states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);
  const [patientTab, setPatientTab] = useState<"history" | "intakes" | "feedback">("history");
  const [patientIntakes, setPatientIntakes] = useState<any[]>([]);
  const [patientFeedbacks, setPatientFeedbacks] = useState<any[]>([]);
  const [loadingPatientTabs, setLoadingPatientTabs] = useState(false);

  // Appointment detail modal states
  const [selectedApptDetails, setSelectedApptDetails] = useState<any | null>(null);
  const [apptDetailsOpen, setApptDetailsOpen] = useState(false);

  // Intake & AI Triage states
  const [apptIntake, setApptIntake] = useState<any | null>(null);
  const [loadingIntake, setLoadingIntake] = useState(false);
  const [savingIntake, setSavingIntake] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    symptoms: "",
    allergies: "",
    current_medications: "",
    medical_history: "",
  });

  // Messaging loading states
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [sendingMessageType, setSendingMessageType] = useState<"confirm" | "reminder" | "feedback" | "followup" | null>(null);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    contact_id: "",
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    status: "scheduled",
    patient_name: "",
    patient_age: "",
    reason_for_visit: "",
  });

  // Deletion confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [apptIdToDelete, setApptIdToDelete] = useState<string | null>(null);

  const loadAppointments = async (cId: string) => {
    const { data, error } = await db
      .from("appointments")
      .select(`
        *,
        contact:contacts(id, name, phone),
        doctor:doctors(id, doctor_name, specialization)
      `)
      .eq("clinic_id", cId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (error) {
      console.error("Error loading appointments:", error);
      toast.error("Failed to load appointments list.");
    } else {
      setAppointments(data || []);
    }
  };

  const loadDropdownData = async (cId: string) => {
    const [contactsRes, doctorsRes] = await Promise.all([
      db.from("contacts").select("id, name, phone").order("name"),
      db.from("doctors").select("id, doctor_name, specialization").eq("clinic_id", cId).order("doctor_name"),
    ]);

    if (contactsRes.error) console.error("Error loading contacts:", contactsRes.error);
    if (doctorsRes.error) console.error("Error loading doctors:", doctorsRes.error);

    setContacts(contactsRes.data || []);
    setDoctors(doctorsRes.data || []);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: clinic } = await db.from("clinics").select("id").maybeSingle();
        if (clinic) {
          setClinicId(clinic.id);
          await Promise.all([
            loadAppointments(clinic.id),
            loadDropdownData(clinic.id),
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingAppt(null);
    setForm({
      contact_id: "",
      doctor_id: "",
      appointment_date: new Date().toISOString().split("T")[0],
      appointment_time: "10:00",
      status: "scheduled",
      patient_name: "",
      patient_age: "",
      reason_for_visit: "",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (appt: any) => {
    setEditingAppt(appt);
    setForm({
      contact_id: appt.contact_id || "",
      doctor_id: appt.doctor_id || "",
      appointment_date: appt.appointment_date || "",
      appointment_time: appt.appointment_time || "",
      status: appt.status || "scheduled",
      patient_name: appt.patient_name || "",
      patient_age: appt.patient_age || "",
      reason_for_visit: appt.reason_for_visit || "",
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!form.contact_id) {
      toast.error("Please select a patient.");
      return;
    }
    if (!form.doctor_id) {
      toast.error("Please select a doctor.");
      return;
    }
    if (!form.appointment_date) {
      toast.error("Please select an appointment date.");
      return;
    }
    if (!form.appointment_time) {
      toast.error("Please select an appointment time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clinic_id: clinicId,
        contact_id: form.contact_id,
        doctor_id: form.doctor_id,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        status: form.status,
        patient_name: form.patient_name.trim() || null,
        patient_age: form.patient_age.trim() || null,
        reason_for_visit: form.reason_for_visit.trim() || null,
      };

      let error;
      let apptData = null;
      if (editingAppt) {
        const { data, error: err } = await db
          .from("appointments")
          .update(payload)
          .eq("id", editingAppt.id)
          .select()
          .single();
        error = err;
        apptData = data;
      } else {
        const { data, error: err } = await db
          .from("appointments")
          .insert(payload)
          .select()
          .single();
        error = err;
        apptData = data;
      }

      if (error) throw error;

      toast.success(editingAppt ? "Appointment updated successfully!" : "Appointment booked successfully!");
      setIsOpen(false);

      if (apptData) {
        fetch("/api/healthcare/appointments/status-notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ appointmentId: apptData.id }),
        }).catch((err) => {
          console.error("Error triggering appointment status notification WhatsApp message:", err);
        });
      }

      await loadAppointments(clinicId);
    } catch (err: any) {
      toast.error(`Error saving appointment: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (apptId: string, newStatus: "scheduled" | "completed" | "cancelled") => {
    if (!clinicId) return;
    try {
      const { error } = await db
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", apptId);

      if (error) throw error;

      toast.success(`Appointment status updated to ${newStatus}!`);

      fetch("/api/healthcare/appointments/status-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId: apptId }),
      }).catch((err) => {
        console.error("Error triggering appointment status notification WhatsApp message:", err);
      });

      await loadAppointments(clinicId);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const handleDelete = (apptId: string) => {
    setApptIdToDelete(apptId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!apptIdToDelete) return;
    try {
      const { error } = await db.from("appointments").delete().eq("id", apptIdToDelete);
      if (error) throw error;
      toast.success("Appointment record deleted successfully!");
      if (clinicId) await loadAppointments(clinicId);
      // Close patient details if deleted
      if (selectedPatientId) {
        const remaining = appointments.filter(a => a.id !== apptIdToDelete && a.contact_id === selectedPatientId);
        if (remaining.length === 0) setPatientDrawerOpen(false);
      }
    } catch (err: any) {
      toast.error(`Failed to delete record: ${err.message}`);
    } finally {
      setApptIdToDelete(null);
    }
  };

  // WhatsApp manual triggers
  const triggerManualConfirmation = async (apptId: string) => {
    setSendingMessageId(apptId);
    setSendingMessageType("confirm");
    try {
      const res = await fetch("/api/healthcare/appointments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to trigger confirmation");
      }
      toast.success("WhatsApp confirmation sent successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`WhatsApp confirmation failed: ${err.message}`);
    } finally {
      setSendingMessageId(null);
      setSendingMessageType(null);
    }
  };

  const triggerManualReminder = async (apptId: string) => {
    setSendingMessageId(apptId);
    setSendingMessageType("reminder");
    try {
      const res = await fetch("/api/healthcare/appointments/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to trigger reminder");
      }
      toast.success("WhatsApp reminder sent successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`WhatsApp reminder failed: ${err.message}`);
    } finally {
      setSendingMessageId(null);
      setSendingMessageType(null);
    }
  };

  // Statistics Dashboard calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const apptsToday = appointments.filter((a) => a.appointment_date === todayStr);

    const scheduledToday = apptsToday.filter((a) => a.status === "scheduled").length;
    const completedToday = apptsToday.filter((a) => a.status === "completed").length;
    const cancelledToday = apptsToday.filter((a) => a.status === "cancelled").length;

    const uniquePatients = new Set(appointments.map((a) => a.contact_id)).size;
    const totalApptsCount = appointments.length;
    const cancellationRate = totalApptsCount
      ? Math.round((appointments.filter((a) => a.status === "cancelled").length / totalApptsCount) * 100)
      : 0;

    return {
      todayCount: apptsToday.length,
      scheduledToday,
      completedToday,
      cancelledToday,
      uniquePatients,
      cancellationRate,
    };
  }, [appointments]);

  // Calendar View month grid generator
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();

    // Pad starting days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDate - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let i = 1; i <= lastDate; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Pad ending days from next month to fill grid row
    const totalCells = Math.ceil(days.length / 7) * 7;
    const daysNeeded = totalCells - days.length;
    for (let i = 1; i <= daysNeeded; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // Cache mapped appointments by date
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    appointments.forEach((appt) => {
      const dStr = appt.appointment_date;
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(appt);
    });
    return map;
  }, [appointments]);

  // Filtered appointments list
  const filteredAppts = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesSearch =
        appt.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appt.reason_for_visit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appt.contact?.phone?.includes(searchQuery) ||
        appt.doctor?.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || appt.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchQuery, statusFilter]);

  // Patient detail view info
  const selectedPatientData = useMemo(() => {
    if (!selectedPatientId) return null;
    const contact = contacts.find((c) => c.id === selectedPatientId);
    if (!contact) return null;
    const patientAppts = appointments.filter((a) => a.contact_id === selectedPatientId);
    return {
      contact,
      appointments: patientAppts,
    };
  }, [selectedPatientId, contacts, appointments]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const triggerManualFeedback = async (apptId: string) => {
    setSendingMessageId(apptId);
    setSendingMessageType("feedback");
    try {
      const res = await fetch("/api/healthcare/appointments/followup-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apptId, type: "feedback" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to trigger feedback");
      }
      toast.success("WhatsApp feedback request sent successfully!");
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, feedback_sent: true } : a));
      if (selectedApptDetails?.id === apptId) {
        setSelectedApptDetails((prev: any) => ({ ...prev, feedback_sent: true }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`WhatsApp feedback trigger failed: ${err.message}`);
    } finally {
      setSendingMessageId(null);
      setSendingMessageType(null);
    }
  };

  const triggerManualFollowup = async (apptId: string) => {
    setSendingMessageId(apptId);
    setSendingMessageType("followup");
    try {
      const res = await fetch("/api/healthcare/appointments/followup-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apptId, type: "followup" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to trigger follow-up");
      }
      toast.success("WhatsApp post-visit check-in sent successfully!");
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, followup_sent: true } : a));
      if (selectedApptDetails?.id === apptId) {
        setSelectedApptDetails((prev: any) => ({ ...prev, followup_sent: true }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`WhatsApp follow-up trigger failed: ${err.message}`);
    } finally {
      setSendingMessageId(null);
      setSendingMessageType(null);
    }
  };

  const handleOpenPatientDrawer = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setPatientDrawerOpen(true);
    setPatientTab("history");
    setPatientIntakes([]);
    setPatientFeedbacks([]);
    setLoadingPatientTabs(true);

    try {
      const [intakeRes, feedbackRes] = await Promise.all([
        db
          .from("patient_intake")
          .select("*")
          .eq("contact_id", patientId)
          .order("created_at", { ascending: false }),
        db
          .from("patient_feedback")
          .select("*")
          .eq("contact_id", patientId)
          .order("created_at", { ascending: false }),
      ]);

      setPatientIntakes(intakeRes.data || []);
      setPatientFeedbacks(feedbackRes.data || []);
    } catch (err) {
      console.error("Error loading patient drawer tabs data:", err);
    } finally {
      setLoadingPatientTabs(false);
    }
  };

  const handleOpenApptDetails = async (appt: any) => {
    setSelectedApptDetails(appt);
    setApptDetailsOpen(true);
    setApptIntake(null);
    setShowIntakeForm(false);
    setIntakeForm({
      symptoms: "",
      allergies: "",
      current_medications: "",
      medical_history: "",
    });

    if (appt.id) {
      setLoadingIntake(true);
      try {
        const { data, error } = await db
          .from("patient_intake")
          .select("*")
          .eq("appointment_id", appt.id)
          .maybeSingle();

        if (data) {
          setApptIntake(data);
        } else {
          const { data: latestIntake } = await db
            .from("patient_intake")
            .select("*")
            .eq("contact_id", appt.contact_id)
            .is("appointment_id", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestIntake) {
            const { data: linkedData } = await db
              .from("patient_intake")
              .update({ appointment_id: appt.id })
              .eq("id", latestIntake.id)
              .select()
              .single();
            setApptIntake(linkedData || latestIntake);
          }
        }
      } catch (err) {
        console.error("Error loading intake:", err);
      } finally {
        setLoadingIntake(false);
      }
    }
  };

  const handleSaveIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptDetails || !clinicId) return;

    setSavingIntake(true);
    try {
      const { data, error } = await db
        .from("patient_intake")
        .insert({
          clinic_id: clinicId,
          contact_id: selectedApptDetails.contact_id,
          appointment_id: selectedApptDetails.id,
          symptoms: intakeForm.symptoms,
          allergies: intakeForm.allergies || null,
          current_medications: intakeForm.current_medications || null,
          medical_history: intakeForm.medical_history || null,
          urgency_level: "routine",
          collected_via: "dashboard",
        })
        .select()
        .single();

      if (error) throw error;
      setApptIntake(data);
      setShowIntakeForm(false);
      toast.success("Intake record created successfully!");
    } catch (err: any) {
      toast.error(`Error saving intake: ${err.message}`);
    } finally {
      setSavingIntake(false);
    }
  };

  const handleRunAIUsageTriage = async () => {
    if (!apptIntake || !clinicId) return;

    setTriaging(true);
    try {
      const response = await fetch("/api/healthcare/symptom-triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: apptIntake.symptoms,
          clinicId: clinicId,
          userId: apptIntake.contact_id,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const triageResult = await response.json();

      const { data: updatedIntake, error: updateErr } = await db
        .from("patient_intake")
        .update({
          urgency_level: triageResult.urgency,
          triage_result: triageResult,
        })
        .eq("id", apptIntake.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      setApptIntake(updatedIntake);
      toast.success("AI symptom triage completed!");
    } catch (err: any) {
      toast.error(`Triage failed: ${err.message}`);
      console.error(err);
    } finally {
      setTriaging(false);
    }
  };

  const handleCalendarDayClick = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
  };

  const handleBookOnDate = (dateStr: string) => {
    setEditingAppt(null);
    setForm({
      contact_id: "",
      doctor_id: "",
      appointment_date: dateStr,
      appointment_time: "09:00",
      status: "scheduled",
      patient_name: "",
      patient_age: "",
      reason_for_visit: "",
    });
    setIsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading appointments directory...</p>
        </div>
      </div>
    );
  }

  if (!clinicId) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 max-w-lg mx-auto mt-12 text-center p-6 shadow-xl rounded-2xl">
        <CardHeader className="flex flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4 animate-bounce" />
          <CardTitle className="text-slate-900 dark:text-white">Clinic Onboarding Required</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 mt-2">
            You must set up your clinic information before managing schedules and appointments.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Link
            href="/healthcare/setup"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Launch Clinic Setup Wizard
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            Appointments Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track patients, schedule consultations, send automated notifications, and coordinate clinic queues.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20 rounded-xl h-11 px-5">
          <Plus className="h-4 w-4 mr-1.5" /> Book Appointment
        </Button>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Calendar className="size-28 text-slate-900 dark:text-white" />
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CalendarRange className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Today</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.scheduledToday}</span>
                <span className="text-[10px] text-slate-500">out of {stats.todayCount} total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <CheckCircle2 className="size-28 text-slate-900 dark:text-white" />
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Today</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.completedToday}</span>
                <span className="text-[10px] text-slate-500">visitations done</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Users className="size-28 text-slate-900 dark:text-white" />
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.uniquePatients}</span>
                <span className="text-[10px] text-slate-500">distinct records</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Activity className="size-28 text-slate-900 dark:text-white" />
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`size-11 rounded-xl flex items-center justify-center border ${
              stats.cancellationRate > 15
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancellation Rate</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.cancellationRate}%</span>
                <span className="text-[10px] text-slate-500">all-time records</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation, Search & Toggle Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pt-2">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, phone, doctor..."
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-10 placeholder:text-slate-500"
            />
          </div>

          {/* List vs Calendar Toggles */}
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl gap-0.5 w-fit">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Filter className="size-3.5" />
              List Grid
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Calendar className="size-3.5" />
              Calendar view
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-0.5 rounded-xl overflow-x-auto gap-0.5 w-full lg:w-auto">
          {(["all", "scheduled", "completed", "cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all w-full sm:w-auto text-center ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "list" ? (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 backdrop-blur-md overflow-hidden rounded-2xl shadow-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/40">
                    <th className="px-6 py-4">Patient Profile</th>
                    <th className="px-6 py-4">Doctor assigned</th>
                    <th className="px-6 py-4">Schedule Date/Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Quick WhatsApp Actions</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-sm text-slate-650 dark:text-slate-300">
                  {filteredAppts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                        <Calendar className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-700 mb-3 animate-pulse" />
                        <p className="font-semibold text-slate-650 dark:text-slate-400">No appointments cataloged.</p>
                        <p className="text-xs text-slate-550 dark:text-slate-600 mt-1">Book a new appointment or modify your filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAppts.map((appt) => {
                      const patientName = appt.patient_name || appt.contact?.name || "Unnamed";
                      const initial = patientName.charAt(0).toUpperCase() || "U";
                      const phone = appt.contact?.phone || "N/A";
                      const doctorName = appt.doctor ? formatDocName(appt.doctor.doctor_name) : "N/A";
                      const specialization = appt.doctor?.specialization || "General";

                      // Simple consistent color avatar hash
                      const colors = [
                        "bg-teal-500/10 text-teal-400 border-teal-500/20",
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        "bg-teal-600/10 text-teal-500 border-teal-600/20",
                        "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        "bg-emerald-600/10 text-emerald-500 border-emerald-600/20",
                        "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      ];
                      const colorIndex = patientName.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
                      const avatarColor = colors[colorIndex];

                      return (
                        <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center font-bold text-sm shadow-sm ${avatarColor}`}>
                                {initial}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenPatientDrawer(appt.contact_id)}
                                    className="hover:text-primary hover:underline transition-all text-left font-semibold text-slate-900 dark:text-white"
                                  >
                                    {patientName}
                                  </button>
                                  {appt.patient_age && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40 px-1.5 py-0.5 rounded-md font-normal">
                                      Age: {appt.patient_age}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span>{phone}</span>
                                </div>
                                {appt.reason_for_visit && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 italic">
                                    <Bookmark className="size-3 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                                    <span className="line-clamp-1">"{appt.reason_for_visit}"</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{doctorName}</div>
                              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 mt-0.5">
                                {specialization}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                <span>{appt.appointment_date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                <span>{appt.appointment_time}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={appt.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as "scheduled" | "completed" | "cancelled";
                                handleStatusChange(appt.id, newStatus);
                              }}
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary status-select-${appt.status}`}
                            >
                              <option value="scheduled" className="bg-white dark:bg-slate-900 text-emerald-500 font-semibold">Scheduled</option>
                              <option value="completed" className="bg-white dark:bg-slate-900 text-teal-500 font-semibold">Completed</option>
                              <option value="cancelled" className="bg-white dark:bg-slate-900 text-rose-500 font-semibold">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingMessageId !== null}
                                onClick={() => triggerManualConfirmation(appt.id)}
                                className="h-8 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 gap-1"
                              >
                                {sendingMessageId === appt.id && sendingMessageType === "confirm" ? (
                                  <>
                                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="size-3" />
                                    Confirm
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingMessageId !== null || appt.status !== "scheduled"}
                                onClick={() => triggerManualReminder(appt.id)}
                                className="h-8 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 gap-1"
                              >
                                {sendingMessageId === appt.id && sendingMessageType === "reminder" ? (
                                  <>
                                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="size-3" />
                                    Reminder
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                onClick={() => handleOpenApptDetails(appt)}
                                variant="ghost"
                                size="icon"
                                title="View Appointment Details"
                                className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {appt.status === "scheduled" && (
                                <>
                                  <Button
                                    onClick={() => handleStatusChange(appt.id, "completed")}
                                    variant="ghost"
                                    size="icon"
                                    title="Mark as Completed"
                                    className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusChange(appt.id, "cancelled")}
                                    variant="ghost"
                                    size="icon"
                                    title="Cancel Appointment"
                                    className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                onClick={() => handleOpenEdit(appt)}
                                variant="ghost"
                                size="icon"
                                title="Edit Appointment"
                                className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(appt.id)}
                                variant="ghost"
                                size="icon"
                                title="Delete Appointment"
                                className="h-8 w-8 text-slate-500 hover:text-rose-550 hover:bg-rose-500/10 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Calendar Monthly Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Box */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 backdrop-blur-md overflow-hidden rounded-2xl shadow-xl lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800/50 pb-4 bg-slate-50 dark:bg-slate-950/20">
              <div>
                <CardTitle className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
                  <Calendar className="size-5 text-teal-600" />
                  {monthNames[currentMonth]} {currentYear}
                </CardTitle>
                <CardDescription className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
                  Click a cell to view day schedule or reserve an appointment slot.
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentMonth(new Date().getMonth());
                    setCurrentYear(new Date().getFullYear());
                  }}
                  className="h-8 rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Today
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleNextMonth}
                  className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((dayCell, index) => {
                  const dayAppts = appointmentsByDate[dayCell.dateStr] || [];
                  const isToday = dayCell.dateStr === new Date().toISOString().split("T")[0];
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleCalendarDayClick(dayCell.dateStr)}
                      className={`min-h-[100px] border p-2 rounded-xl transition-all flex flex-col justify-between cursor-pointer select-none relative ${
                        dayCell.isCurrentMonth
                          ? "bg-white dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/80 hover:border-teal-600/50 hover:bg-slate-50 dark:hover:bg-slate-800/10"
                          : "bg-slate-50 dark:bg-slate-950/5 border-slate-100 dark:border-slate-900/60 opacity-40 hover:opacity-60"
                      } ${isToday ? "ring-1.5 ring-teal-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 border-teal-600" : ""} ${
                        selectedCalendarDate === dayCell.dateStr ? "bg-teal-600/5 border-teal-600/60 shadow-inner" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          isToday 
                            ? "bg-teal-600 text-white size-5 rounded-full flex items-center justify-center" 
                            : dayCell.isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"
                        }`}>
                          {dayCell.date.getDate()}
                        </span>
                        
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            {dayAppts.length}
                          </span>
                        )}
                      </div>

                      {/* Display first 2 appointments */}
                      <div className="space-y-1 mt-2 flex-grow overflow-hidden">
                        {dayAppts.slice(0, 2).map((appt) => {
                          const patientName = appt.patient_name || appt.contact?.name || "Unnamed";
                          return (
                            <div
                              key={appt.id}
                              className={`text-[10px] font-medium truncate px-1.5 py-0.5 rounded border ${
                                appt.status === "scheduled"
                                  ? "bg-emerald-500/5 text-emerald-500 dark:text-emerald-400 border-emerald-500/15"
                                  : appt.status === "completed"
                                  ? "bg-teal-500/5 text-teal-500 dark:text-teal-400 border-teal-500/15"
                                  : "bg-rose-500/5 text-rose-500 dark:text-rose-400 border-rose-500/15"
                              }`}
                            >
                              {appt.appointment_time} {patientName}
                            </div>
                          );
                        })}
                        
                        {dayAppts.length > 2 && (
                          <div className="text-[9px] font-semibold text-slate-500 text-center">
                            + {dayAppts.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Quick Hover Add Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookOnDate(dayCell.dateStr);
                        }}
                        className="absolute right-1 bottom-1 opacity-0 hover:opacity-100 focus:opacity-100 bg-teal-600/20 hover:bg-teal-600 text-white size-5 rounded flex items-center justify-center transition-all"
                        title="Book slot on this day"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day Schedule Panel */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 backdrop-blur-md overflow-hidden rounded-2xl shadow-xl flex flex-col h-full">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800/50 pb-4 bg-slate-55 dark:bg-slate-950/20">
              <CardTitle className="text-slate-900 dark:text-white text-base font-bold flex items-center gap-1.5">
                <Clock className="size-4.5 text-teal-600" />
                Schedule for {selectedCalendarDate || new Date().toISOString().split("T")[0]}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-4 overflow-y-auto space-y-3">
              {(() => {
                const targetDate = selectedCalendarDate || new Date().toISOString().split("T")[0];
                const dayAppts = appointmentsByDate[targetDate] || [];

                if (dayAppts.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                      <CalendarDays className="size-10 text-slate-400 dark:text-slate-700 mb-2 animate-bounce" />
                      <p className="font-semibold text-slate-650 dark:text-slate-400">No events booked</p>
                      <Button
                        size="sm"
                        onClick={() => handleBookOnDate(targetDate)}
                        className="mt-3 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-xs"
                      >
                        <Plus className="size-3 mr-1" /> Reserve Slot
                      </Button>
                    </div>
                  );
                }

                // Sort by time ascending
                const sortedAppts = [...dayAppts].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800/40">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{dayAppts.length} appointments</span>
                      <Button
                        size="sm"
                        onClick={() => handleBookOnDate(targetDate)}
                        className="h-7 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-[10px]"
                      >
                        <Plus className="size-3 mr-1" /> Add Slot
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {sortedAppts.map((appt) => {
                        const name = appt.patient_name || appt.contact?.name || "Unnamed";
                        const doc = appt.doctor ? formatDocName(appt.doctor.doctor_name) : "N/A";
                        
                        return (
                          <div
                            key={appt.id}
                            className="bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 space-y-2 hover:border-slate-350 dark:hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-white">
                                <Clock className="size-3.5 text-teal-600" />
                                {appt.appointment_time}
                              </div>
                              <select
                                value={appt.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as "scheduled" | "completed" | "cancelled";
                                  handleStatusChange(appt.id, newStatus);
                                }}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary status-select-${appt.status}`}
                              >
                                <option value="scheduled" className="bg-white dark:bg-slate-900 text-emerald-500 font-semibold">Scheduled</option>
                                <option value="completed" className="bg-white dark:bg-slate-900 text-teal-500 font-semibold">Completed</option>
                                <option value="cancelled" className="bg-white dark:bg-slate-900 text-rose-500 font-semibold">Cancelled</option>
                              </select>
                            </div>

                            <div>
                              <button
                                onClick={() => handleOpenPatientDrawer(appt.contact_id)}
                                className="font-bold text-slate-900 dark:text-white hover:underline text-sm hover:text-teal-600 text-left"
                              >
                                {name}
                              </button>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Stethoscope className="size-3 text-slate-400 dark:text-slate-600" />
                                <span>{doc}</span>
                              </div>
                            </div>

                            {appt.reason_for_visit && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-1.5 border border-slate-200 dark:border-slate-800/60 rounded-lg italic">
                                "{appt.reason_for_visit}"
                              </p>
                            )}

                            <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800/40">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenApptDetails(appt)}
                                className="h-7 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(appt)}
                                className="h-7 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(appt.id)}
                                className="h-7 px-2 hover:bg-rose-500/10 text-xs text-slate-500 hover:text-rose-500"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Detailed Drawer Dialog */}
      <Dialog open={patientDrawerOpen} onOpenChange={setPatientDrawerOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-hidden">
          {selectedPatientData ? (
            <div className="space-y-5">
              <DialogHeader className="border-b border-slate-200 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-teal-600/10 border border-teal-600/20 text-teal-600 flex items-center justify-center font-black text-2xl shadow-sm">
                    {(selectedPatientData.contact.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="text-slate-900 dark:text-white text-2xl font-black">
                      {selectedPatientData.contact.name || "Unnamed Patient"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="size-3 text-slate-400 dark:text-slate-500" />
                      <span>{selectedPatientData.contact.phone || "No phone record"}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Patient details body */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Appointments</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{selectedPatientData.appointments.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">First Visit Date</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                    {selectedPatientData.appointments.length > 0 
                      ? [...selectedPatientData.appointments].sort((a,b)=>a.appointment_date.localeCompare(b.appointment_date))[0].appointment_date
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Next Scheduled</span>
                  <span className="text-sm font-semibold text-emerald-500 dark:text-emerald-400 mt-1">
                    {(() => {
                      const scheduled = selectedPatientData.appointments
                        .filter(a => a.status === "scheduled" && new Date(a.appointment_date) >= new Date(new Date().setHours(0,0,0,0)))
                        .sort((a,b)=>a.appointment_date.localeCompare(b.appointment_date));
                      return scheduled.length > 0 ? `${scheduled[0].appointment_date} at ${scheduled[0].appointment_time}` : "None";
                    })()}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setPatientTab("history")}
                  className={`pb-3 text-xs font-bold transition-all px-1 flex items-center gap-1.5 ${
                    patientTab === "history"
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent"
                  }`}
                >
                  <Activity className="size-3.5" />
                  Visit History ({selectedPatientData.appointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPatientTab("intakes")}
                  className={`pb-3 text-xs font-bold transition-all px-1 flex items-center gap-1.5 ${
                    patientTab === "intakes"
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent"
                  }`}
                >
                  <Stethoscope className="size-3.5" />
                  Clinical Intakes ({patientIntakes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPatientTab("feedback")}
                  className={`pb-3 text-xs font-bold transition-all px-1 flex items-center gap-1.5 ${
                    patientTab === "feedback"
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent"
                  }`}
                >
                  <MessageSquare className="size-3.5" />
                  Patient Feedback ({patientFeedbacks.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="max-h-[260px] overflow-y-auto pr-1 min-h-[160px]">
                {loadingPatientTabs ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                    <Loader2 className="size-6 animate-spin text-teal-600" />
                    <span className="text-xs">Loading clinical records...</span>
                  </div>
                ) : patientTab === "history" ? (
                  selectedPatientData.appointments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-10 text-center italic">No appointment sessions cataloged.</p>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {selectedPatientData.appointments.map((appt) => {
                        const doc = appt.doctor ? formatDocName(appt.doctor.doctor_name) : "N/A";
                        return (
                          <div 
                            key={appt.id} 
                            className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-350 dark:hover:border-slate-800 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-800 dark:text-white font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                                  {appt.appointment_date} at {appt.appointment_time}
                                </span>
                                <select
                                  value={appt.status}
                                  onChange={async (e) => {
                                    const newStatus = e.target.value as "scheduled" | "completed" | "cancelled";
                                    await handleStatusChange(appt.id, newStatus);
                                    if (selectedPatientId) {
                                      await handleOpenPatientDrawer(selectedPatientId);
                                    }
                                  }}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary status-select-${appt.status}`}
                                >
                                  <option value="scheduled" className="bg-white dark:bg-slate-900 text-emerald-500 font-semibold">Scheduled</option>
                                  <option value="completed" className="bg-white dark:bg-slate-900 text-teal-500 font-semibold">Completed</option>
                                  <option value="cancelled" className="bg-white dark:bg-slate-900 text-rose-500 font-semibold">Cancelled</option>
                                </select>
                              </div>

                              <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1 font-semibold">
                                <Stethoscope className="size-3.5 text-slate-400 dark:text-slate-500" />
                                <span>Consultant: {doc} ({appt.doctor?.specialization || "General"})</span>
                              </div>
                              
                              {appt.reason_for_visit && (
                                <p className="text-xs text-slate-550 dark:text-slate-400 italic bg-white dark:bg-slate-950/40 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-900/60 mt-1 max-w-md">
                                  Visit reason: "{appt.reason_for_visit}"
                                </p>
                              )}
                            </div>

                            {/* Action inside timeline */}
                            <div className="flex sm:flex-col justify-end gap-1.5 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingMessageId !== null}
                                type="button"
                                onClick={() => triggerManualConfirmation(appt.id)}
                                className="h-7 text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingMessageId !== null || appt.status !== "scheduled"}
                                type="button"
                                onClick={() => triggerManualReminder(appt.id)}
                                className="h-7 text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Reminder
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : patientTab === "intakes" ? (
                  patientIntakes.length === 0 ? (
                    <p className="text-xs text-slate-500 py-10 text-center italic">No pre-visit intake records logged.</p>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {patientIntakes.map((intake) => (
                        <div
                          key={intake.id}
                          className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/60 rounded-xl p-3.5 space-y-2.5 hover:border-slate-350 dark:hover:border-slate-800 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                              Intake Date: {new Date(intake.created_at).toLocaleDateString()}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                              intake.urgency_level === 'emergency' ? 'bg-red-500/10 text-red-505 border border-red-500/20 animate-pulse' :
                              intake.urgency_level === 'urgent' ? 'bg-orange-500/10 text-orange-505 border border-orange-500/20' :
                              intake.urgency_level === 'routine' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {intake.urgency_level || 'Routine'}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Symptoms / Complaints</span>
                              <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 p-2 rounded-lg">{intake.symptoms}</p>
                            </div>

                            {(intake.allergies || intake.current_medications || intake.medical_history) && (
                              <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-900/60 text-[11px] mt-1">
                                {intake.allergies && (
                                  <div>
                                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Allergies</span>
                                    <p className="text-slate-700 dark:text-slate-350 font-semibold">{intake.allergies}</p>
                                  </div>
                                )}
                                {intake.current_medications && (
                                  <div>
                                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Medications</span>
                                    <p className="text-slate-700 dark:text-slate-355 font-semibold">{intake.current_medications}</p>
                                  </div>
                                )}
                                {intake.medical_history && (
                                  <div className="col-span-2 border-t border-slate-100 dark:border-slate-900 pt-1 mt-1">
                                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Medical History</span>
                                    <p className="text-slate-700 dark:text-slate-350 font-semibold">{intake.medical_history}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {intake.triage_result && intake.triage_result.suggested_action && (
                              <div className="bg-primary/5 p-2.5 rounded-lg border border-primary/10 space-y-1 text-[11px]">
                                <span className="text-[10px] text-primary uppercase font-black tracking-wider flex items-center gap-1">
                                  <Sparkles className="size-3" /> AI Triage Assessment
                                </span>
                                <div>
                                  <span className="text-slate-400">Action:</span>
                                  <span className="text-slate-755 dark:text-slate-250 font-semibold ml-1">{intake.triage_result.suggested_action}</span>
                                </div>
                                {intake.triage_result.care_advice && (
                                  <div>
                                    <p className="text-slate-650 dark:text-slate-355 italic leading-relaxed">"{intake.triage_result.care_advice}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Feedback Tab */
                  patientFeedbacks.length === 0 ? (
                    <p className="text-xs text-slate-500 py-10 text-center italic">No patient feedback submitted yet.</p>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {patientFeedbacks.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="bg-slate-50 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800/60 rounded-xl p-3.5 space-y-2.5 hover:border-slate-350 dark:hover:border-slate-800 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                              Feedback: {new Date(feedback.created_at).toLocaleDateString()}
                            </span>
                            {/* Stars rating */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-base leading-none ${
                                    star <= Number(feedback.rating || 0)
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-slate-300 dark:text-slate-700"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          {feedback.feedback_text ? (
                            <p className="text-xs text-slate-755 dark:text-slate-300 italic bg-white dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-900/60">
                              "{feedback.feedback_text}"
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No comments provided.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 italic">
                  Database ID: {selectedPatientData.contact.id}
                </p>
                <Button 
                  onClick={() => setPatientDrawerOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg h-9 text-xs"
                >
                  Close Record
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">Loading patient details...</div>
          )}
        </DialogContent>
      </Dialog>      {/* Appointment Details Dialog */}
      <Dialog open={apptDetailsOpen} onOpenChange={setApptDetailsOpen}>
        <DialogContent className="md:max-w-3xl lg:max-w-4xl sm:max-w-xl w-[95vw] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
          {selectedApptDetails ? (
            <div className="flex flex-col h-full overflow-hidden space-y-4">
              <DialogHeader className="border-b border-slate-200 dark:border-slate-800/60 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-slate-900 dark:text-white text-xl font-bold flex items-center gap-2">
                    <Bookmark className="size-5 text-primary" />
                    Appointment Details
                  </DialogTitle>
                  <select
                    value={selectedApptDetails.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value as "scheduled" | "completed" | "cancelled";
                      await handleStatusChange(selectedApptDetails.id, newStatus);
                      setSelectedApptDetails((prev: any) => prev ? { ...prev, status: newStatus } : null);
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary status-select-${selectedApptDetails.status}`}
                  >
                    <option value="scheduled" className="bg-white dark:bg-slate-900 text-emerald-500 font-semibold">Scheduled</option>
                    <option value="completed" className="bg-white dark:bg-slate-900 text-teal-500 font-semibold">Completed</option>
                    <option value="cancelled" className="bg-white dark:bg-slate-900 text-rose-500 font-semibold">Cancelled</option>
                  </select>
                </div>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Full registration card for this scheduled session.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-1 py-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column (Patient & Consultation Details) */}
                  <div className="space-y-4">
                    {/* Patient section */}
                    <div className="bg-slate-50 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-800/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-lg">
                          {(selectedApptDetails.patient_name || selectedApptDetails.contact?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {selectedApptDetails.patient_name || selectedApptDetails.contact?.name || "Unnamed"}
                          </h4>
                          <p className="text-xs text-slate-500">{selectedApptDetails.contact?.phone || "No Phone number"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800/40 pt-3">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Age</span>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                            {selectedApptDetails.patient_age ? `${selectedApptDetails.patient_age} Years` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Patient Drawer</span>
                          <button
                            type="button"
                            onClick={() => {
                              setApptDetailsOpen(false);
                              handleOpenPatientDrawer(selectedApptDetails.contact_id);
                            }}
                            className="text-xs text-primary hover:underline font-semibold block mt-0.5 text-left"
                          >
                            View Full History
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Consultation Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-55 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/40 rounded-xl p-3.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Assigned Clinician</span>
                        <span className="font-semibold text-slate-850 dark:text-slate-200 text-sm block">
                          {selectedApptDetails.doctor ? formatDocName(selectedApptDetails.doctor.doctor_name) : "N/A"}
                        </span>
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider font-bold">
                          {selectedApptDetails.doctor?.specialization || "General Medicine"}
                        </span>
                      </div>

                      <div className="bg-slate-55 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/40 rounded-xl p-3.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Time & Date Slot</span>
                        <span className="font-semibold text-slate-850 dark:text-slate-200 text-sm block">
                          {selectedApptDetails.appointment_date}
                        </span>
                        <span className="font-medium text-slate-500 dark:text-slate-400 text-xs block mt-0.5">
                          at {selectedApptDetails.appointment_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Reason, Intake & WhatsApp Notifications) */}
                  <div className="space-y-4">
                    {/* Reason for visit */}
                    <div className="bg-slate-55 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/40 rounded-xl p-3.5 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Chief Complaint / Reason</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        {selectedApptDetails.reason_for_visit ? `"${selectedApptDetails.reason_for_visit}"` : "No description provided."}
                      </p>
                    </div>

                    {/* Pre-visit Intake & AI Triage */}
                    <div className="bg-slate-50 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800/40 rounded-xl p-4 space-y-3">
                      <h5 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-between">
                        <span className="flex items-center gap-1.5">
                          <Activity className="size-3.5 text-primary" />
                          Clinical Intake & Triage
                        </span>
                        {apptIntake && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                            apptIntake.urgency_level === 'emergency' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                            apptIntake.urgency_level === 'urgent' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            apptIntake.urgency_level === 'routine' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {apptIntake.urgency_level || 'Routine'}
                          </span>
                        )}
                      </h5>

                      {loadingIntake ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="size-5 animate-spin text-primary" />
                        </div>
                      ) : apptIntake ? (
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Symptoms:</span>
                            <p className="text-slate-700 dark:text-slate-200 font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 p-2 rounded mt-0.5 max-h-24 overflow-y-auto">
                              {apptIntake.symptoms}
                            </p>
                          </div>

                          {(apptIntake.allergies || apptIntake.current_medications || apptIntake.medical_history) && (
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800/40 pt-2 text-[11px]">
                              {apptIntake.allergies && (
                                <div>
                                  <span className="text-slate-400">Allergies:</span>
                                  <p className="text-slate-700 dark:text-slate-350 truncate font-semibold">{apptIntake.allergies}</p>
                                </div>
                              )}
                              {apptIntake.current_medications && (
                                <div>
                                  <span className="text-slate-400">Medications:</span>
                                  <p className="text-slate-700 dark:text-slate-350 truncate font-semibold">{apptIntake.current_medications}</p>
                                </div>
                              )}
                              {apptIntake.medical_history && (
                                <div className="col-span-2">
                                  <span className="text-slate-400">Medical History:</span>
                                  <p className="text-slate-700 dark:text-slate-350 truncate font-semibold">{apptIntake.medical_history}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Triage result */}
                          {apptIntake.triage_result && apptIntake.triage_result.suggested_action ? (
                            <div className="border-t border-slate-200 dark:border-slate-800/40 pt-2 space-y-1.5 bg-primary/5 p-2 rounded-lg border border-primary/10">
                              <span className="text-[10px] text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                                <Sparkles className="size-3" /> AI Triage Assessment
                              </span>
                              <div>
                                <span className="text-[10px] text-slate-400 font-medium">Suggested Action:</span>
                                <p className="text-[11px] text-slate-700 dark:text-slate-250 font-semibold">{apptIntake.triage_result.suggested_action}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-medium">Care Advice:</span>
                                <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed italic">"{apptIntake.triage_result.care_advice}"</p>
                              </div>
                              {apptIntake.triage_result.should_escalate && (
                                <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold bg-red-500/10 p-1.5 rounded border border-red-500/20">
                                  <AlertCircle className="size-3.5 animate-bounce shrink-0" />
                                  <span>Critical: Escalate to practitioner immediately!</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800/40">
                              <Button
                                size="sm"
                                type="button"
                                disabled={triaging}
                                onClick={handleRunAIUsageTriage}
                                className="w-full h-8 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                              >
                                {triaging ? (
                                  <>
                                    <Loader2 className="size-3.5 animate-spin" /> Triaging Symptoms...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="size-3.5" /> Run AI Symptom Triage
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : showIntakeForm ? (
                        <form onSubmit={handleSaveIntake} className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="intake_symptoms" className="text-[10px] text-slate-400 font-semibold">Symptoms / Complaints *</Label>
                            <Input
                              id="intake_symptoms"
                              required
                              value={intakeForm.symptoms}
                              onChange={(e) => setIntakeForm({ ...intakeForm, symptoms: e.target.value })}
                              placeholder="e.g. Sharp lower back pain radiating to leg"
                              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-8 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="intake_allergies" className="text-[10px] text-slate-400">Allergies</Label>
                              <Input
                                id="intake_allergies"
                                value={intakeForm.allergies}
                                onChange={(e) => setIntakeForm({ ...intakeForm, allergies: e.target.value })}
                                placeholder="e.g. Penicillin"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-8 rounded-lg text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="intake_meds" className="text-[10px] text-slate-400">Active Meds</Label>
                              <Input
                                id="intake_meds"
                                value={intakeForm.current_medications}
                                onChange={(e) => setIntakeForm({ ...intakeForm, current_medications: e.target.value })}
                                placeholder="e.g. Aspirin 81mg"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-8 rounded-lg text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="intake_history" className="text-[10px] text-slate-400">Medical History</Label>
                            <Input
                              id="intake_history"
                              value={intakeForm.medical_history}
                              onChange={(e) => setIntakeForm({ ...intakeForm, medical_history: e.target.value })}
                              placeholder="e.g. Hypertension, diabetes type 2"
                              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-8 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <Button
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={() => setShowIntakeForm(false)}
                              className="h-7 text-[10px] px-2.5 rounded-lg text-slate-700 dark:text-slate-300"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              type="submit"
                              disabled={savingIntake}
                              className="h-7 text-[10px] px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                            >
                              {savingIntake ? "Saving..." : "Save Intake"}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="text-center py-1.5">
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => setShowIntakeForm(true)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 h-8 rounded-lg text-xs font-semibold w-full"
                          >
                            <Plus className="size-3.5 mr-1" /> Log Pre-visit Intake Form
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Dispatch status */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 space-y-3">
                      <h5 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="size-3.5 text-primary" />
                        WhatsApp CRM Notifications
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedApptDetails.status !== "completed" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendingMessageId !== null}
                              type="button"
                              onClick={() => triggerManualConfirmation(selectedApptDetails.id)}
                              className="h-8 rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            >
                              {sendingMessageId === selectedApptDetails.id && sendingMessageType === "confirm" ? "Sending..." : "Send Confirm SMS"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendingMessageId !== null || selectedApptDetails.status !== "scheduled"}
                              type="button"
                              onClick={() => triggerManualReminder(selectedApptDetails.id)}
                              className="h-8 rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            >
                              {sendingMessageId === selectedApptDetails.id && sendingMessageType === "reminder" ? "Sending..." : "Send Reminder SMS"}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendingMessageId !== null}
                              type="button"
                              onClick={() => triggerManualFeedback(selectedApptDetails.id)}
                              className="h-8 rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            >
                              {sendingMessageId === selectedApptDetails.id && sendingMessageType === "feedback" ? "Sending..." : selectedApptDetails.feedback_sent ? "Feedback Sent ✓" : "Send Feedback SMS"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendingMessageId !== null}
                              type="button"
                              onClick={() => triggerManualFollowup(selectedApptDetails.id)}
                              className="h-8 rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            >
                              {sendingMessageId === selectedApptDetails.id && sendingMessageType === "followup" ? "Sending..." : selectedApptDetails.followup_sent ? "Follow-Up Sent ✓" : "Send Follow-Up SMS"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800/60 pt-4 flex items-center justify-between shrink-0">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setApptDetailsOpen(false);
                      handleOpenEdit(selectedApptDetails);
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg h-9 text-xs px-3.5 font-semibold"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setApptDetailsOpen(false);
                      handleDelete(selectedApptDetails.id);
                    }}
                    variant="outline"
                    className="border-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg h-9 text-xs px-3.5 font-semibold"
                  >
                    Delete
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={() => setApptDetailsOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg h-9 text-xs px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">Loading details...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Book / Edit Appointment Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="md:max-w-3xl lg:max-w-4xl sm:max-w-xl w-[95vw] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-2xl shadow-xl p-6 max-h-[90vh] flex flex-col">
          <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden space-y-4">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-slate-900 dark:text-white text-xl font-bold">
                {editingAppt ? "Edit Appointment Record" : "Book New Appointment"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Provide patient, doctor, and slot details to reserve an appointment.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1 py-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column (Who: Patient & Doctor Selection) */}
                <div className="space-y-4">
                  {/* Patient Selection */}
                  <div className="space-y-1">
                    <Label htmlFor="patient" className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Select Patient *</Label>
                    <select
                      id="patient"
                      value={form.contact_id}
                      onChange={(e) => {
                        const selectedContactId = e.target.value;
                        const contact = contacts.find((c) => c.id === selectedContactId);
                        setForm((prev) => ({
                          ...prev,
                          contact_id: selectedContactId,
                          patient_name: contact ? (contact.name || "") : prev.patient_name,
                        }));
                      }}
                      className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-sm h-10 text-slate-900 dark:text-white px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">-- Choose Patient --</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                          {c.name || "Unnamed"} ({c.phone})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Patient not in the list? Please add them as a <Link href="/contacts" className="text-primary hover:underline">Contact</Link> first.
                    </p>
                  </div>

                  {/* Patient Name Override */}
                  <div className="space-y-1">
                    <Label htmlFor="patient_name" className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Patient Name (Custom/Override)</Label>
                    <Input
                      id="patient_name"
                      type="text"
                      placeholder="Defaults to contact's name if empty"
                      value={form.patient_name}
                      onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm h-10 rounded-xl"
                    />
                  </div>

                  {/* Doctor Selection */}
                  <div className="space-y-1">
                    <Label htmlFor="doctor" className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Select Doctor *</Label>
                    <select
                      id="doctor"
                      value={form.doctor_id}
                      onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                      className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-sm h-10 text-slate-900 dark:text-white px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">-- Choose Doctor --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                          {formatDocName(d.doctor_name)} ({d.specialization || "General"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column (Details: Age, Reason, Date/Time & Status) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Patient Age */}
                    <div className="space-y-1">
                      <Label htmlFor="patient_age" className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Patient Age</Label>
                      <Input
                        id="patient_age"
                        type="text"
                        placeholder="e.g. 28, 45"
                        value={form.patient_age}
                        onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm h-10 rounded-xl"
                      />
                    </div>

                    {/* Reason for Visit */}
                    <div className="space-y-1">
                      <Label htmlFor="reason_for_visit" className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Reason for Visit</Label>
                      <Input
                        id="reason_for_visit"
                        type="text"
                        placeholder="e.g. Toothache, Checkup"
                        value={form.reason_for_visit}
                        onChange={(e) => setForm({ ...form, reason_for_visit: e.target.value })}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Date Picker */}
                    <div className="space-y-1">
                      <Label htmlFor="date" className="text-xs text-slate-550 dark:text-slate-400 font-semibold">Appointment Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={form.appointment_date}
                        onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm h-10 rounded-xl"
                      />
                    </div>

                    {/* Time Picker */}
                    <div className="space-y-1">
                      <Label htmlFor="time" className="text-xs text-slate-550 dark:text-slate-400 font-semibold">Appointment Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={form.appointment_time}
                        onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                        className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Status Picker (Only shown when editing) */}
                  {editingAppt && (
                    <div className="space-y-1 border-t border-slate-200 dark:border-slate-800/60 pt-3">
                      <Label htmlFor="status" className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Status</Label>
                      <select
                        id="status"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-sm h-10 text-slate-900 dark:text-white px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="scheduled" className="bg-white dark:bg-slate-955 text-slate-900 dark:text-white">Scheduled</option>
                        <option value="completed" className="bg-white dark:bg-slate-955 text-slate-900 dark:text-white">Completed</option>
                        <option value="cancelled" className="bg-white dark:bg-slate-955 text-slate-900 dark:text-white">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-200 dark:border-slate-850 pt-4 mt-2 shrink-0">
              <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-10 px-4">
                Cancel
              </Button>
              <Button disabled={saving} type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px] rounded-xl h-10 px-4">
                {saving ? "Saving..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Appointment Record"
        description="Are you sure you want to permanently delete this appointment record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
}
