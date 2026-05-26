"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  UserRound,
  Plus,
  Trash2,
  Edit,
  Search,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DoctorsManagement() {
  const db = createClient();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState<any>({
    doctor_name: "",
    specialization: "",
    qualification: "",
    experience: "",
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    available_start_time: "09:00",
    available_end_time: "17:00",
    consultation_fee: 50,
    languages_spoken: "English",
    profile_photo: "",
    weekly_slots: {},
    date_exceptions: [],
  });

  const [dialogTab, setDialogTab] = useState<"profile" | "slots" | "exceptions">("profile");
  const [activeSlotDay, setActiveSlotDay] = useState("Monday");
  const [slotDuration, setSlotDuration] = useState(30);
  const [newEx, setNewEx] = useState({ date: "", is_available: false, reason: "" });

  const generateTimeSlots = (startTime: string, endTime: string, durationMinutes: number) => {
    const slots: { start_time: string; end_time: string; is_active: boolean }[] = [];
    if (!startTime || !endTime) return slots;
    let [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    while (startMinutes + durationMinutes <= endMinutes) {
      const nextMinutes = startMinutes + durationMinutes;
      const sH = Math.floor(startMinutes / 60).toString().padStart(2, '0');
      const sM = (startMinutes % 60).toString().padStart(2, '0');
      const eH = Math.floor(nextMinutes / 60).toString().padStart(2, '0');
      const eM = (nextMinutes % 60).toString().padStart(2, '0');
      slots.push({
        start_time: `${sH}:${sM}`,
        end_time: `${eH}:${eM}`,
        is_active: true
      });
      startMinutes = nextMinutes;
    }
    return slots;
  };

  const loadDoctors = async (cId: string) => {
    const { data, error } = await db
      .from("doctors")
      .select("*")
      .eq("clinic_id", cId)
      .order("doctor_name");
    if (error) {
      console.error(error);
    } else {
      setDoctors(data || []);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: clinic } = await db.from("clinics").select("id").maybeSingle();
        if (clinic) {
          setClinicId(clinic.id);
          await loadDoctors(clinic.id);
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
    setEditingDoc(null);
    setForm({
      doctor_name: "",
      specialization: "",
      qualification: "",
      experience: "",
      available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      available_start_time: "09:00",
      available_end_time: "17:00",
      consultation_fee: 50,
      languages_spoken: "English",
      profile_photo: "",
      weekly_slots: {},
      date_exceptions: [],
    });
    setDialogTab("profile");
    setActiveSlotDay("Monday");
    setIsOpen(true);
  };

  const handleOpenEdit = (doc: any) => {
    setEditingDoc(doc);
    setForm({
      doctor_name: doc.doctor_name || "",
      specialization: doc.specialization || "",
      qualification: doc.qualification || "",
      experience: doc.experience || "",
      available_days: doc.available_days || [],
      available_start_time: doc.available_start_time || "09:00",
      available_end_time: doc.available_end_time || "17:00",
      consultation_fee: doc.consultation_fee || 50,
      languages_spoken: doc.languages_spoken || "English",
      profile_photo: doc.profile_photo || "",
      weekly_slots: doc.weekly_slots || {},
      date_exceptions: doc.date_exceptions || [],
    });
    setDialogTab("profile");
    setActiveSlotDay(doc.available_days?.[0] || "Monday");
    setIsOpen(true);
  };

  const handleAvailableDaysChange = (day: string, checked: boolean) => {
    let current: string[] = form.available_days || [];
    if (checked) {
      if (!current.includes(day)) current = [...current, day];
    } else {
      current = current.filter((d: string) => d !== day);
    }
    setForm({ ...form, available_days: current });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!form.doctor_name) {
      toast.error("Doctor Name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clinic_id: clinicId,
        ...form,
      };

      let error;
      if (editingDoc) {
        const { error: err } = await db
          .from("doctors")
          .update(payload)
          .eq("id", editingDoc.id);
        error = err;
      } else {
        const { error: err } = await db.from("doctors").insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(editingDoc ? "Doctor updated successfully!" : "Doctor added successfully!");
      setIsOpen(false);
      await loadDoctors(clinicId);
    } catch (err: any) {
      toast.error(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor? All scheduled appointments will be decoupled.")) return;
    try {
      const { error } = await db.from("doctors").delete().eq("id", id);
      if (error) throw error;
      toast.success("Doctor deleted successfully!");
      if (clinicId) await loadDoctors(clinicId);
    } catch (err: any) {
      toast.error(`Error deleting: ${err.message}`);
    }
  };

  const filteredDoctors = doctors.filter((doc) =>
    doc.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading doctor profiles...</p>
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
            You must set up your clinic information before managing doctor directories.
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
            <UserRound className="h-8 w-8 text-primary" />
            Manage Doctors
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Add, update, or remove practitioners registered with the clinic.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground hover:bg-primary/95">
          <Plus className="h-4 w-4 mr-1.5" /> Add Doctor
        </Button>
      </div>

      {/* Search & Statistics */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctors by name or specialty..."
            className="pl-9 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredDoctors.length} of {doctors.length} doctors
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center">
            <UserRound className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No doctors found matching your query.</p>
            <Button onClick={handleOpenAdd} variant="outline" className="mt-4 border-slate-800 text-slate-300 hover:bg-slate-800">
              Register First Doctor
            </Button>
          </div>
        ) : (
          filteredDoctors.map((doc) => (
            <Card key={doc.id} className="border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  {doc.profile_photo ? (
                    <img
                      src={doc.profile_photo}
                      alt={doc.doctor_name}
                      className="h-14 w-14 rounded-xl object-cover border border-slate-800 bg-slate-950"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl border border-slate-800 bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {doc.doctor_name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1">
                    <CardTitle className="text-base text-white font-bold">Dr. {doc.doctor_name}</CardTitle>
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {doc.specialization || "General Medicine"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3.5 pb-5 pt-0 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-800/60 py-3">
                  <div>
                    <span className="text-slate-500 block">Qualification</span>
                    <span className="text-slate-300 font-semibold">{doc.qualification || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Experience</span>
                    <span className="text-slate-300 font-semibold">{doc.experience || "N/A"}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      Available Days:
                    </span>
                    <span className="text-slate-300 font-medium truncate max-w-[150px]" title={doc.available_days?.join(", ")}>
                      {doc.available_days?.join(", ") || "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Search className="h-3.5 w-3.5 text-slate-600" />
                      Available Hours:
                    </span>
                    <span className="text-slate-300 font-medium">
                      {doc.available_start_time} - {doc.available_end_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <span className="text-slate-600 font-semibold">₹</span>
                      Consultation Fee:
                    </span>
                    <span className="text-emerald-400 font-bold">₹{doc.consultation_fee || 0}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800/40 pt-4 mt-2">
                  <Button onClick={() => handleOpenEdit(doc)} variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white hover:bg-slate-800/50">
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button onClick={() => handleDelete(doc.id)} variant="ghost" size="sm" className="h-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-200">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                {editingDoc ? `Edit Doctor — Dr. ${editingDoc.doctor_name}` : "Register New Doctor"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Provide credentials, active schedule hours, and consultation pricing.
              </DialogDescription>
            </DialogHeader>            {/* Dialog Tab Navigation */}
            <div className="flex gap-4 border-b border-slate-800 pb-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDialogTab("profile")}
                className={`pb-1.5 border-b-2 px-1 transition-colors ${
                  dialogTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                Profile Details
              </button>
              <button
                type="button"
                onClick={() => setDialogTab("slots")}
                className={`pb-1.5 border-b-2 px-1 transition-colors ${
                  dialogTab === "slots"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                Weekly Slots ({Object.values(form.weekly_slots || {}).flat().length} slots)
              </button>
              <button
                type="button"
                onClick={() => setDialogTab("exceptions")}
                className={`pb-1.5 border-b-2 px-1 transition-colors ${
                  dialogTab === "exceptions"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                Leaves & Exceptions ({form.date_exceptions?.length || 0})
              </button>
            </div>

            {/* Profile Tab */}
            {dialogTab === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="space-y-1">
                  <Label htmlFor="doctor_name" className="text-xs text-slate-400">Doctor Name *</Label>
                  <Input
                    id="doctor_name"
                    value={form.doctor_name}
                    onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    placeholder="E.g. Patil"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="specialization" className="text-xs text-slate-400">Specialization</Label>
                  <Input
                    id="specialization"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    placeholder="E.g. Dentist, General Surgeon"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="qualification" className="text-xs text-slate-400">Qualification</Label>
                  <Input
                    id="qualification"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    placeholder="E.g. BDS, MDS"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="experience" className="text-xs text-slate-400">Experience</Label>
                  <Input
                    id="experience"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    placeholder="E.g. 8 Years"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="consultation_fee" className="text-xs text-slate-400">Consultation Fee (₹)</Label>
                  <Input
                    id="consultation_fee"
                    type="number"
                    value={form.consultation_fee}
                    onChange={(e) => setForm({ ...form, consultation_fee: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="languages_spoken" className="text-xs text-slate-400">Languages Spoken</Label>
                  <Input
                    id="languages_spoken"
                    value={form.languages_spoken}
                    onChange={(e) => setForm({ ...form, languages_spoken: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    placeholder="E.g. English, Hindi"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="profile_photo" className="text-xs text-slate-400">Profile Photo URL</Label>
                  <Input
                    id="profile_photo"
                    value={form.profile_photo}
                    onChange={(e) => setForm({ ...form, profile_photo: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    placeholder="https://image.com/avatar.jpg"
                  />
                </div>
                <div className="md:col-span-2 space-y-2 border-t border-slate-800/60 pt-3">
                  <Label className="text-xs text-slate-400 block mb-1">Available Work Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isChecked = form.available_days?.includes(day);
                      return (
                        <label
                          key={day}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleAvailableDaysChange(day, e.target.checked)}
                            className="hidden"
                          />
                          {day}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Shift Start Time</Label>
                  <Input
                    type="time"
                    value={form.available_start_time}
                    onChange={(e) => setForm({ ...form, available_start_time: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Shift End Time</Label>
                  <Input
                    type="time"
                    value={form.available_end_time}
                    onChange={(e) => setForm({ ...form, available_end_time: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                </div>
              </div>
            )}

            {/* Slots Tab */}
            {dialogTab === "slots" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 block">Select Day to Edit Slots</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {form.available_days && form.available_days.length > 0 ? (
                      form.available_days.map((day: string) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setActiveSlotDay(day)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                            activeSlotDay === day
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {day}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-rose-400 italic">No available days configured. Select available days in Profile tab first.</p>
                    )}
                  </div>
                </div>

                {form.available_days && form.available_days.length > 0 && (
                  <div className="border border-slate-850 rounded-xl p-4 bg-slate-950/20 space-y-4">
                    <div className="flex flex-wrap gap-3 items-end p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <div className="space-y-1 w-32">
                        <Label className="text-[10px] text-slate-500 uppercase font-semibold">Slot Duration</Label>
                        <select
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(parseInt(e.target.value) || 30)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs h-8 text-white px-2 focus:border-primary focus:outline-none"
                        >
                          <option value={15}>15 Mins</option>
                          <option value={20}>20 Mins</option>
                          <option value={30}>30 Mins</option>
                          <option value={45}>45 Mins</option>
                          <option value={60}>60 Mins</option>
                        </select>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (!form.available_start_time || !form.available_end_time) {
                            toast.error("Please configure start/end times in Profile first.");
                            return;
                          }
                          const generated = generateTimeSlots(form.available_start_time, form.available_end_time, slotDuration);
                          const weekly = { ...(form.weekly_slots || {}) };
                          weekly[activeSlotDay] = generated;
                          setForm({ ...form, weekly_slots: weekly });
                          toast.success(`Generated ${generated.length} slots for ${activeSlotDay}!`);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-xs h-8 border border-slate-800 text-slate-300"
                      >
                        Auto-Generate Slots
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (!form.available_start_time || !form.available_end_time) {
                            toast.error("Please configure start/end times in Profile first.");
                            return;
                          }
                          if (!form.available_days || form.available_days.length === 0) {
                            toast.error("Please configure available days in Profile first.");
                            return;
                          }
                          const weekly = { ...(form.weekly_slots || {}) };
                          let totalGenerated = 0;
                          
                          form.available_days.forEach((day: string) => {
                            const generated = generateTimeSlots(form.available_start_time, form.available_end_time, slotDuration);
                            weekly[day] = generated;
                            totalGenerated += generated.length;
                          });
                          
                          setForm({ ...form, weekly_slots: weekly });
                          toast.success(`Generated a total of ${totalGenerated} slots in bulk for all available days (${form.available_days.join(', ')})!`);
                        }}
                        className="bg-primary/20 hover:bg-primary/30 text-xs h-8 border border-primary/30 text-primary ml-1"
                      >
                        Auto-Generate for ALL Available Days
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const weekly = { ...(form.weekly_slots || {}) };
                          const currentSlots = weekly[activeSlotDay] || [];
                          weekly[activeSlotDay] = [...currentSlots, { start_time: "09:00", end_time: "09:30", is_active: true }];
                          setForm({ ...form, weekly_slots: weekly });
                        }}
                        className="bg-primary hover:bg-primary/95 text-xs h-8 text-primary-foreground ml-auto"
                      >
                        Add Custom Slot
                      </Button>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-400 block mb-2">Active Slots on {activeSlotDay}</Label>
                      {form.weekly_slots?.[activeSlotDay] && form.weekly_slots[activeSlotDay].length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                          {form.weekly_slots[activeSlotDay].map((slot: any, slotIdx: number) => (
                            <div key={slotIdx} className="flex gap-2 items-center bg-slate-950/50 border border-slate-850 p-2 rounded-lg">
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => {
                                  const weekly = { ...form.weekly_slots };
                                  const daySlots = [...weekly[activeSlotDay]];
                                  daySlots[slotIdx] = { ...daySlots[slotIdx], start_time: e.target.value };
                                  weekly[activeSlotDay] = daySlots;
                                  setForm({ ...form, weekly_slots: weekly });
                                }}
                                className="bg-slate-950 border-slate-855 text-white text-xs h-7 px-1.5 w-20"
                              />
                              <span className="text-slate-600 text-xs">-</span>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => {
                                  const weekly = { ...form.weekly_slots };
                                  const daySlots = [...weekly[activeSlotDay]];
                                  daySlots[slotIdx] = { ...daySlots[slotIdx], end_time: e.target.value };
                                  weekly[activeSlotDay] = daySlots;
                                  setForm({ ...form, weekly_slots: weekly });
                                }}
                                className="bg-slate-950 border-slate-855 text-white text-xs h-7 px-1.5 w-20"
                              />
                              <Switch
                                checked={slot.is_active}
                                onCheckedChange={(checked: boolean) => {
                                  const weekly = { ...form.weekly_slots };
                                  const daySlots = [...weekly[activeSlotDay]];
                                  daySlots[slotIdx] = { ...daySlots[slotIdx], is_active: checked };
                                  weekly[activeSlotDay] = daySlots;
                                  setForm({ ...form, weekly_slots: weekly });
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const weekly = { ...form.weekly_slots };
                                  weekly[activeSlotDay] = weekly[activeSlotDay].filter((_: any, i: number) => i !== slotIdx);
                                  setForm({ ...form, weekly_slots: weekly });
                                }}
                                className="h-7 w-7 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">No slots defined for this day. Click "Auto-Generate Slots" to begin.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exceptions Tab */}
            {dialogTab === "exceptions" && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Exception Date</Label>
                    <Input
                      type="date"
                      value={newEx.date}
                      onChange={(e) => setNewEx({ ...newEx, date: e.target.value })}
                      className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Reason / Description</Label>
                    <Input
                      placeholder="e.g. Leave, Personal Day"
                      value={newEx.reason}
                      onChange={(e) => setNewEx({ ...newEx, reason: e.target.value })}
                      className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1 pb-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!newEx.is_available}
                        onCheckedChange={(checked: boolean) => setNewEx({ ...newEx, is_available: !checked })}
                      />
                      <span className="text-xs text-slate-300">{!newEx.is_available ? "On Leave (Unavailable)" : "Available"}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newEx.date) {
                        toast.error("Please select a date.");
                        return;
                      }
                      const currentExs = form.date_exceptions || [];
                      if (currentExs.some((e: any) => e.date === newEx.date)) {
                        toast.error("An exception already exists for this date.");
                        return;
                      }
                      setForm({
                        ...form,
                        date_exceptions: [...currentExs, { ...newEx }]
                      });
                      setNewEx({ date: "", is_available: false, reason: "" });
                      toast.success("Exception added to list!");
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs h-9"
                  >
                    Add Exception
                  </Button>
                </div>

                <div>
                  <Label className="text-xs text-slate-400 block mb-2">Registered Exceptions & Leaves</Label>
                  {form.date_exceptions && form.date_exceptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                      {form.date_exceptions.map((ex: any, exIdx: number) => (
                        <div key={exIdx} className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white block">
                              {new Date(ex.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </span>
                            <div className="flex gap-2 items-center">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${!ex.is_available ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                {!ex.is_available ? "Leave" : "Available"}
                              </span>
                              {ex.reason && <span className="text-xs text-slate-500">({ex.reason})</span>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const currentExs = (form.date_exceptions || []).filter((_: any, i: number) => i !== exIdx);
                              setForm({ ...form, date_exceptions: currentExs });
                            }}
                            className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">No leaves or exceptions configured for this doctor.</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="border-t border-slate-800 pt-4 mt-2">
              <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button disabled={saving} type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]">
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
