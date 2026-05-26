"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  });

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

      toast.success(editingAppt ? "Appointment updated successfully!" : "Appointment created successfully!");
      setIsOpen(false);

      if (apptData && payload.status === "scheduled") {
        fetch("/api/healthcare/appointments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ appointmentId: apptData.id }),
        }).catch((err) => {
          console.error("Error triggering appointment confirmation WhatsApp message:", err);
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

      if (newStatus === "scheduled") {
        fetch("/api/healthcare/appointments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ appointmentId: apptId }),
        }).catch((err) => {
          console.error("Error triggering appointment confirmation WhatsApp message:", err);
        });
      }

      await loadAppointments(clinicId);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const handleDelete = async (apptId: string) => {
    if (!confirm("Are you sure you want to permanently delete this appointment record?")) return;
    try {
      const { error } = await db.from("appointments").delete().eq("id", apptId);
      if (error) throw error;
      toast.success("Appointment record deleted successfully!");
      if (clinicId) await loadAppointments(clinicId);
    } catch (err: any) {
      toast.error(`Failed to delete record: ${err.message}`);
    }
  };

  const filteredAppts = appointments.filter((appt) => {
    const matchesSearch =
      appt.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.contact?.phone?.includes(searchQuery) ||
      appt.doctor?.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || appt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      <Card className="border-slate-800 bg-slate-900/60 max-w-lg mx-auto mt-12 text-center p-6">
        <CardHeader className="flex flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4 animate-bounce" />
          <CardTitle className="text-white">Clinic Onboarding Required</CardTitle>
          <CardDescription className="text-slate-400 mt-2">
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            Appointments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track patient consultations, update statuses, or schedule manual visits.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground hover:bg-primary/95">
          <Plus className="h-4 w-4 mr-1.5" /> Book Appointment
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, phone, or doctor..."
            className="pl-9 bg-slate-900 border-slate-800 text-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto gap-1">
          {(["all", "scheduled", "completed", "cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-950/20">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredAppts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Calendar className="h-10 w-10 mx-auto text-slate-700 mb-2" />
                      <p>No appointments found matching your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAppts.map((appt) => {
                    const patientName = appt.contact?.name || "Unnamed";
                    const initial = patientName.charAt(0).toUpperCase() || "U";
                    const phone = appt.contact?.phone || "N/A";
                    const doctorName = appt.doctor ? formatDocName(appt.doctor.doctor_name) : "N/A";
                    const specialization = appt.doctor?.specialization || "General";
                    
                    // Simple hash function to generate a consistent background color for patient avatar
                    const colors = [
                      "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      "bg-purple-500/10 text-purple-400 border-purple-500/20",
                      "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                      "bg-pink-500/10 text-pink-400 border-pink-500/20",
                    ];
                    const colorIndex = patientName.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
                    const avatarColor = colors[colorIndex];

                    return (
                      <tr key={appt.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center font-bold ${avatarColor}`}>
                              {initial}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{patientName}</div>
                              <div className="text-xs text-slate-500">{phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-200">{doctorName}</div>
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                              {specialization}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                              <span>{appt.appointment_date}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              <span>{appt.appointment_time}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                              appt.status === "scheduled"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : appt.status === "completed"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              appt.status === "scheduled"
                                ? "bg-emerald-400 animate-pulse"
                                : appt.status === "completed"
                                ? "bg-blue-400"
                                : "bg-rose-400"
                            }`} />
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
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
                              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(appt.id)}
                              variant="ghost"
                              size="icon"
                              title="Delete Appointment"
                              className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
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

      {/* Book / Edit Appointment Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                {editingAppt ? "Edit Appointment Record" : "Book New Appointment"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Provide patient, doctor, and slot details to reserve an appointment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Patient Selection */}
              <div className="space-y-1">
                <Label htmlFor="patient" className="text-xs text-slate-400">Select Patient *</Label>
                <select
                  id="patient"
                  value={form.contact_id}
                  onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-sm h-10 text-white px-3 focus:border-primary focus:outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || "Unnamed"} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div className="space-y-1">
                <Label htmlFor="doctor" className="text-xs text-slate-400">Select Doctor *</Label>
                <select
                  id="doctor"
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-sm h-10 text-white px-3 focus:border-primary focus:outline-none"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {formatDocName(d.doctor_name)} ({d.specialization || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className="space-y-1">
                  <Label htmlFor="date" className="text-xs text-slate-400">Appointment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-sm h-10"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-1">
                  <Label htmlFor="time" className="text-xs text-slate-400">Appointment Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={form.appointment_time}
                    onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-sm h-10"
                  />
                </div>
              </div>

              {/* Status Picker (Only shown when editing) */}
              {editingAppt && (
                <div className="space-y-1 border-t border-slate-800/60 pt-3">
                  <Label htmlFor="status" className="text-xs text-slate-400">Status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-sm h-10 text-white px-3 focus:border-primary focus:outline-none"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-slate-800 pt-4 mt-2">
              <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button disabled={saving} type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]">
                {saving ? "Saving..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
