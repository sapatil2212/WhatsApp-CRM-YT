"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Building2,
  Clock,
  UserRound,
  Stethoscope,
  HelpCircle,
  Brain,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  Sparkles,
  Download,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ClinicSetupWizard() {
  const db = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // --- Step 1 State: Clinic Info ---
  const [clinicInfo, setClinicInfo] = useState({
    clinic_name: "",
    clinic_type: "",
    clinic_description: "",
    phone: "",
    whatsapp_number: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    google_map_link: "",
  });

  // --- Step 2 State: Working Hours & Exceptions ---
  const [timings, setTimings] = useState<any[]>(
    DAYS_OF_WEEK.map((day) => ({
      day_name: day,
      opening_time: "09:00",
      closing_time: "18:00",
      is_closed: day === "Sunday",
      lunch_break_start: "13:00",
      lunch_break_end: "14:00",
    }))
  );
  const [clinicExceptions, setClinicExceptions] = useState<any[]>([]);
  const [newClinicException, setNewClinicException] = useState({
    date: "",
    is_closed: true,
    opening_time: "09:00",
    closing_time: "18:00",
    reason: "",
  });

  // --- Step 3 State: Doctors ---
  const [doctors, setDoctors] = useState<any[]>([
    {
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
    },
  ]);
  const [doctorSubTabs, setDoctorSubTabs] = useState<Record<number, "profile" | "slots" | "exceptions">>({});
  const [activeSlotDays, setActiveSlotDays] = useState<Record<number, string>>({});
  const [newDocExceptions, setNewDocExceptions] = useState<Record<number, { date: string; is_available: boolean; reason: string }>>({});
  const [newCustomSlots, setNewCustomSlots] = useState<Record<number, { start_time: string; end_time: string }>>({});
  const [slotDurations, setSlotDurations] = useState<Record<number, number>>({});

  // Helper: slot generator function
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

  // --- Step 4 State: Services ---
  const [services, setServices] = useState<any[]>([
    {
      service_name: "",
      description: "",
      starting_price: 30,
      duration: 30,
      is_active: true,
    },
  ]);
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  // --- Step 5 State: FAQs ---
  const [faqs, setFaqs] = useState<any[]>([
    {
      question: "",
      answer: "",
      keywords: "",
    },
  ]);
  const [faqBulkText, setFaqBulkText] = useState("");
  const [faqImporting, setFaqImporting] = useState(false);
  const [showFaqImporter, setShowFaqImporter] = useState(false);

  // --- Step 6 State: AI Settings ---
  const [aiSettings, setAiSettings] = useState({
    ai_enabled: true,
    ai_tone: "polite and professional",
    supported_languages: ["English"],
    greeting_message: "Hello! Welcome to our clinic. How can we help you today?",
    after_hours_message: "Thank you for reaching out. Our clinic is currently closed, but a representative will get back to you during working hours.",
    escalation_keywords: "human, agent, representative, doctor, help",
    emergency_keywords: "emergency, chest pain, bleeding, accident, heart, dying",
    human_handover_enabled: true,
  });

  // Load existing clinic data on mount
  useEffect(() => {
    async function loadClinicData() {
      try {
        const { data: clinicRow } = await db.from("clinics").select("*").maybeSingle();

        if (clinicRow) {
          setClinicId(clinicRow.id);
          setClinicInfo({
            clinic_name: clinicRow.clinic_name || "",
            clinic_type: clinicRow.clinic_type || "",
            clinic_description: clinicRow.clinic_description || "",
            phone: clinicRow.phone || "",
            whatsapp_number: clinicRow.whatsapp_number || "",
            email: clinicRow.email || "",
            website: clinicRow.website || "",
            address: clinicRow.address || "",
            city: clinicRow.city || "",
            state: clinicRow.state || "",
            pincode: clinicRow.pincode || "",
            google_map_link: clinicRow.google_map_link || "",
          });
          setClinicExceptions(clinicRow.date_exceptions || []);

          // Fetch Timings
          const { data: timingRows } = await db
            .from("clinic_timings")
            .select("*")
            .eq("clinic_id", clinicRow.id);
          if (timingRows && timingRows.length > 0) {
            setTimings(
              DAYS_OF_WEEK.map((day) => {
                const match = timingRows.find((t) => t.day_name === day);
                return (
                  match || {
                    day_name: day,
                    opening_time: "09:00",
                    closing_time: "18:00",
                    is_closed: day === "Sunday",
                    lunch_break_start: "13:00",
                    lunch_break_end: "14:00",
                  }
                );
              })
            );
          }

          // Fetch Doctors
          const { data: doctorRows } = await db
            .from("doctors")
            .select("*")
            .eq("clinic_id", clinicRow.id);
          if (doctorRows && doctorRows.length > 0) {
            setDoctors(
              doctorRows.map((d) => ({
                ...d,
                weekly_slots: d.weekly_slots || {},
                date_exceptions: d.date_exceptions || [],
              }))
            );
          }

          // Fetch Services
          const { data: serviceRows } = await db
            .from("clinic_services")
            .select("*")
            .eq("clinic_id", clinicRow.id);
          if (serviceRows && serviceRows.length > 0) {
            setServices(serviceRows);
          }

          // Fetch FAQs
          const { data: faqRows } = await db
            .from("clinic_faqs")
            .select("*")
            .eq("clinic_id", clinicRow.id);
          if (faqRows && faqRows.length > 0) {
            setFaqs(faqRows);
          }

          // Fetch AI Settings
          const { data: aiSettingsRow } = await db
            .from("ai_settings")
            .select("*")
            .eq("clinic_id", clinicRow.id)
            .maybeSingle();
          if (aiSettingsRow) {
            setAiSettings({
              ai_enabled: aiSettingsRow.ai_enabled ?? true,
              ai_tone: aiSettingsRow.ai_tone || "polite and professional",
              supported_languages: aiSettingsRow.supported_languages || ["English"],
              greeting_message: aiSettingsRow.greeting_message || "",
              after_hours_message: aiSettingsRow.after_hours_message || "",
              escalation_keywords: aiSettingsRow.escalation_keywords?.join(", ") || "",
              emergency_keywords: aiSettingsRow.emergency_keywords?.join(", ") || "",
              human_handover_enabled: aiSettingsRow.human_handover_enabled ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Error loading clinic data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadClinicData();
  }, []);

  const handleClinicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClinicInfo({ ...clinicInfo, [e.target.name]: e.target.value });
  };

  const handleTimingChange = (index: number, field: string, value: any) => {
    const updated = [...timings];
    updated[index] = { ...updated[index], [field]: value };
    setTimings(updated);
  };

  // --- Doctors Handlers ---
  const handleDoctorChange = (index: number, field: string, value: any) => {
    const updated = [...doctors];
    updated[index] = { ...updated[index], [field]: value };
    setDoctors(updated);
  };

  const handleDoctorAvailableDays = (index: number, day: string, checked: boolean) => {
    const updated = [...doctors];
    let currentDays = updated[index].available_days || [];
    if (checked) {
      if (!currentDays.includes(day)) currentDays = [...currentDays, day];
    } else {
      currentDays = currentDays.filter((d: string) => d !== day);
    }
    updated[index].available_days = currentDays;
    setDoctors(updated);
  };

  const addDoctor = () => {
    setDoctors([
      ...doctors,
      {
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
      },
    ]);
  };

  const removeDoctor = (index: number) => {
    if (doctors.length === 1) {
      toast.warning("Must configure at least one doctor.");
      return;
    }
    setDoctors(doctors.filter((_, i) => i !== index));
  };

  // --- Services Handlers ---
  const handleServiceChange = (index: number, field: string, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const addService = () => {
    setServices([
      ...services,
      {
        service_name: "",
        description: "",
        starting_price: 30,
        duration: 30,
        is_active: true,
      },
    ]);
  };

  const removeService = (index: number) => {
    if (services.length === 1) {
      toast.warning("Must configure at least one service.");
      return;
    }
    setServices(services.filter((_, i) => i !== index));
  };

  const downloadSampleCSV = () => {
    const csvContent = "service_name,starting_price,duration,description\n" +
      "Teeth Cleaning,80,30,Professional scaling and polishing to remove plaque and tartar\n" +
      "Root Canal Treatment,350,60,Endodontic therapy to treat infected tooth pulp\n" +
      "Dental Crown,500,45,Custom-fitted porcelain crown to restore tooth structure and appearance\n" +
      "Consultation & X-Ray,50,15,Comprehensive oral checkup with digital dental X-rays\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_services.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleTXT = () => {
    const txtContent = "Below is our standard clinic service catalog:\n\n" +
      "1. Consultation & Diagnosis: A basic diagnostic checkup. Starts at ₹50. Duration is 15 minutes.\n" +
      "2. Teeth Whitening: Bleaching treatment to whiten teeth. Cost is ₹150 and takes 45 minutes.\n" +
      "3. Composite Filling: Repairing cavity with tooth-colored filling. Starts from ₹90. Duration: 30 mins.\n" +
      "4. Tooth Extraction: Simple extraction of damaged tooth. Price is ₹120. Takes 30 minutes.\n";
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_services.txt");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkText(text);
      toast.success(`Loaded content from ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleAIImport = async () => {
    if (!bulkText.trim()) {
      toast.error("Please paste some text or upload a file first.");
      return;
    }

    setImporting(true);
    try {
      const response = await fetch("/api/healthcare/import-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: bulkText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to analyze services.");
      }

      const data = await response.json();
      const newServices = data.services || [];

      if (newServices.length === 0) {
        toast.warning("AI did not detect any services in the text. Try adjusting your text.");
        return;
      }

      setServices((prev) => {
        const cleanPrev = prev.filter((s) => s.service_name.trim() !== "");
        return [
          ...cleanPrev,
          ...newServices.map((ns: any) => ({
            service_name: ns.service_name,
            description: ns.description || "",
            starting_price: ns.starting_price || 0,
            duration: ns.duration || 30,
            is_active: true,
          })),
        ];
      });

      toast.success(`Successfully parsed and imported ${newServices.length} services!`);
      setBulkText("");
      setShowImporter(false);
    } catch (err: any) {
      toast.error(`Import error: ${err.message || err}`);
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  // --- FAQs Handlers ---
  const handleFaqChange = (index: number, field: string, value: any) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const addFaq = () => {
    setFaqs([
      ...faqs,
      {
        question: "",
        answer: "",
        keywords: "",
      },
    ]);
  };

  const removeFaq = (index: number) => {
    if (faqs.length === 1) {
      toast.warning("Must configure at least one FAQ.");
      return;
    }
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const downloadSampleFAQCSV = () => {
    const csvContent = "question,answer,keywords\n" +
      "What are the clinic working hours?,\"Our clinic is open Monday to Saturday from 9:00 AM to 6:00 PM. We are closed on Sundays.\",hours,timings,opening,schedule\n" +
      "Do you offer root canal treatments?,\"Yes, we offer complete endodontic root canal treatments starting at ₹350 depending on the tooth.\",root canal,treatment,endodontics\n" +
      "Where are you located?,\"We are located at 123 Health Ave, Suite 10, New York, NY 10001. Check our Google Maps link for directions.\",location,address,maps,directions\n" +
      "Who is the lead doctor?,\"Our lead dentist is Dr. Patil, who specializes in Orthodontics and Oral Surgery.\",doctor,dentist,patil,staff\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_faqs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleFAQTXT = () => {
    const txtContent = "Frequently Asked Questions Guide:\n\n" +
      "Q: Do you accept insurance?\n" +
      "A: Yes, we accept major dental insurance plans including Delta, Aetna, Cigna, and MetLife. Trigger Keywords: insurance, billing, payment\n\n" +
      "Q: How can I book an appointment?\n" +
      "A: You can book an appointment directly here on WhatsApp by typing 'book appointment' or sharing preferred timings. Trigger Keywords: book, appointment, schedule, booking\n\n" +
      "Q: What is the consultation fee?\n" +
      "A: The general consultation checkup is ₹50. Trigger Keywords: fee, checkup, price, cost\n";
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_faqs.txt");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFaqFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFaqBulkText(text);
      toast.success(`Loaded FAQ content from ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleAIFAQImport = async () => {
    if (!faqBulkText.trim()) {
      toast.error("Please paste some text or upload a file first.");
      return;
    }

    setFaqImporting(true);
    try {
      const response = await fetch("/api/healthcare/import-faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: faqBulkText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to analyze FAQs.");
      }

      const data = await response.json();
      const newFaqs = data.faqs || [];

      if (newFaqs.length === 0) {
        toast.warning("AI did not detect any FAQs in the text. Try adjusting your text.");
        return;
      }

      setFaqs((prev) => {
        const cleanPrev = prev.filter((f) => f.question.trim() !== "" || f.answer.trim() !== "");
        return [
          ...cleanPrev,
          ...newFaqs.map((nf: any) => ({
            question: nf.question,
            answer: nf.answer,
            keywords: nf.keywords || "",
          })),
        ];
      });

      toast.success(`Successfully parsed and imported ${newFaqs.length} FAQs!`);
      setFaqBulkText("");
      setShowFaqImporter(false);
    } catch (err: any) {
      toast.error(`Import error: ${err.message || err}`);
      console.error(err);
    } finally {
      setFaqImporting(false);
    }
  };

  // --- AI Settings Handlers ---
  const handleAISettingsChange = (name: string, value: any) => {
    setAiSettings({ ...aiSettings, [name]: value });
  };

  // --- Save / Step submission ---
  const handleSaveStep = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await db.auth.getUser();

      if (!user) {
        toast.error("User session not found.");
        return;
      }

      if (currentStep === 1) {
        // Validation
        if (!clinicInfo.clinic_name) {
          toast.error("Clinic Name is required.");
          setSaving(false);
          return;
        }

        // Upsert Clinic
        const { data: updatedClinic, error } = await db
          .from("clinics")
          .upsert(
            {
              id: clinicId || undefined,
              user_id: user.id,
              ...clinicInfo,
            },
            { onConflict: "user_id" }
          )
          .select()
          .single();

        if (error) throw error;
        setClinicId(updatedClinic.id);
        toast.success("Clinic Information saved successfully!");
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!clinicId) return;

        // Map clinic_id into timings
        const payload = timings.map((t) => {
          const item: any = {
            clinic_id: clinicId,
            day_name: t.day_name,
            opening_time: t.opening_time,
            closing_time: t.closing_time,
            is_closed: t.is_closed,
            lunch_break_start: t.lunch_break_start,
            lunch_break_end: t.lunch_break_end,
          };
          if (t.id) item.id = t.id;
          return item;
        });

        const { error } = await db.from("clinic_timings").upsert(payload);
        if (error) throw error;

        // Update clinic exceptions in the clinics table
        const { error: clinicUpdateErr } = await db
          .from("clinics")
          .update({ date_exceptions: clinicExceptions })
          .eq("id", clinicId);
        if (clinicUpdateErr) throw clinicUpdateErr;

        toast.success("Working hours and holidays saved successfully!");
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (!clinicId) return;

        // Validate doctor names
        if (doctors.some((d) => !d.doctor_name)) {
          toast.error("All registered doctors must have a name.");
          setSaving(false);
          return;
        }

        // Map clinic_id into doctors
        const payload = doctors.map((d) => {
          const item: any = {
            clinic_id: clinicId,
            doctor_name: d.doctor_name,
            specialization: d.specialization,
            qualification: d.qualification,
            experience: d.experience,
            available_days: d.available_days,
            available_start_time: d.available_start_time,
            available_end_time: d.available_end_time,
            consultation_fee: d.consultation_fee,
            languages_spoken: d.languages_spoken,
            profile_photo: d.profile_photo || null,
            weekly_slots: d.weekly_slots || {},
            date_exceptions: d.date_exceptions || [],
          };
          if (d.id) item.id = d.id;
          return item;
        });

        const { error } = await db.from("doctors").upsert(payload);
        if (error) throw error;

        toast.success("Doctors and schedules saved successfully!");
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!clinicId) return;

        if (services.some((s) => !s.service_name)) {
          toast.error("All services must have a name.");
          setSaving(false);
          return;
        }

        const payload = services.map((s) => {
          const item: any = {
            clinic_id: clinicId,
            service_name: s.service_name,
            description: s.description,
            starting_price: s.starting_price,
            duration: s.duration,
            is_active: s.is_active,
          };
          if (s.id) item.id = s.id;
          return item;
        });

        const { error } = await db.from("clinic_services").upsert(payload);
        if (error) throw error;

        toast.success("Services registered successfully!");
        setCurrentStep(5);
      } else if (currentStep === 5) {
        if (!clinicId) return;

        if (faqs.some((f) => !f.question || !f.answer)) {
          toast.error("FAQs must have both a question and answer.");
          setSaving(false);
          return;
        }

        const payload = faqs.map((f) => {
          const item: any = {
            clinic_id: clinicId,
            question: f.question,
            answer: f.answer,
            keywords: f.keywords,
          };
          if (f.id) item.id = f.id;
          return item;
        });

        const { error } = await db.from("clinic_faqs").upsert(payload);
        if (error) throw error;

        toast.success("FAQs saved successfully!");
        setCurrentStep(6);
      } else if (currentStep === 6) {
        if (!clinicId) return;

        // Process arrays
        const escalationKws = aiSettings.escalation_keywords
          .split(",")
          .map((kw) => kw.trim())
          .filter(Boolean);
        const emergencyKws = aiSettings.emergency_keywords
          .split(",")
          .map((kw) => kw.trim())
          .filter(Boolean);

        const payload = {
          clinic_id: clinicId,
          ai_enabled: aiSettings.ai_enabled,
          ai_tone: aiSettings.ai_tone,
          supported_languages: aiSettings.supported_languages,
          greeting_message: aiSettings.greeting_message,
          after_hours_message: aiSettings.after_hours_message,
          escalation_keywords: escalationKws,
          emergency_keywords: emergencyKws,
          human_handover_enabled: aiSettings.human_handover_enabled,
        };

        const { error } = await db.from("ai_settings").upsert(payload, {
          onConflict: "clinic_id",
        });
        if (error) throw error;

        toast.success("AI Healthcare Automation onboarding setup complete!");
      }
    } catch (err: any) {
      toast.error(`Error saving setup: ${err.message}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading wizard data...</p>
        </div>
      </div>
    );
  }

  const stepsList = [
    { num: 1, label: "Clinic Info", icon: Building2 },
    { num: 2, label: "Hours", icon: Clock },
    { num: 3, label: "Doctors", icon: UserRound },
    { num: 4, label: "Services", icon: Stethoscope },
    { num: 5, label: "FAQs", icon: HelpCircle },
    { num: 6, label: "AI Settings", icon: Brain },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Clinic Onboarding Setup</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure clinic information once, and let the AI handle WhatsApp inquiries and bookings.
        </p>
      </div>

      {/* Wizard Steps Indicator */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 border-b border-slate-800 pb-4">
        {stepsList.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;
          return (
            <div
              key={step.num}
              onClick={() => {
                if (clinicId || step.num === 1) setCurrentStep(step.num);
                else toast.error("Please complete the first step (Clinic Information) first.");
              }}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 border-primary text-primary font-medium"
                  : isCompleted
                  ? "bg-slate-900 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {step.num}
              </div>
              <span className="text-xs tracking-wide">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Main Form Box */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
              {currentStep === 1 && <Building2 className="h-6 w-6" />}
              {currentStep === 2 && <Clock className="h-6 w-6" />}
              {currentStep === 3 && <UserRound className="h-6 w-6" />}
              {currentStep === 4 && <Stethoscope className="h-6 w-6" />}
              {currentStep === 5 && <HelpCircle className="h-6 w-6" />}
              {currentStep === 6 && <Brain className="h-6 w-6" />}
            </div>
            <div>
              <CardTitle className="text-white text-xl">
                Step {currentStep} — {stepsList[currentStep - 1].label}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {currentStep === 1 && "Basic details regarding location, name, and contact details."}
                {currentStep === 2 && "Weekly opening times, lunch breaks, and holidays."}
                {currentStep === 3 && "Register doctors, available times, specialization, and fees."}
                {currentStep === 4 && "Define treatment services, starting prices, and standard durations."}
                {currentStep === 5 && "Configure general FAQs to answer patient WhatsApp questions instantly."}
                {currentStep === 6 && "Instruct AI how to respond to patients, emergencies, or escalate conversations."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4 border-t border-slate-800">
          {/* STEP 1: Clinic Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic_name" className="text-slate-300">Clinic Name *</Label>
                <Input
                  id="clinic_name"
                  name="clinic_name"
                  value={clinicInfo.clinic_name}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. Dr Masal Dental Clinic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_type" className="text-slate-300">Clinic Specialty / Type</Label>
                <Input
                  id="clinic_type"
                  name="clinic_type"
                  value={clinicInfo.clinic_type}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. Dental Care, General Medicine"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clinic_description" className="text-slate-300">Clinic Description</Label>
                <Textarea
                  id="clinic_description"
                  name="clinic_description"
                  value={clinicInfo.clinic_description}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white min-h-[80px]"
                  placeholder="A short snippet explaining the clinic focus for AI prompt building..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Landline / Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={clinicInfo.phone}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="+1 555-0199"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="text-slate-300">WhatsApp Public Number</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  value={clinicInfo.whatsapp_number}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="+1 555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Clinic Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={clinicInfo.email}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="info@clinic.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-slate-300">Website URL</Label>
                <Input
                  id="website"
                  name="website"
                  value={clinicInfo.website}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="https://clinic.com"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-slate-300">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={clinicInfo.address}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="123 Health Ave, Suite 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-slate-300">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={clinicInfo.city}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-slate-300">State / Region</Label>
                <Input
                  id="state"
                  name="state"
                  value={clinicInfo.state}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-slate-300">Pincode / Postal Code</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={clinicInfo.pincode}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="10001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google_map_link" className="text-slate-300">Google Map Link</Label>
                <Input
                  id="google_map_link"
                  name="google_map_link"
                  value={clinicInfo.google_map_link}
                  onChange={handleClinicInfoChange}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="https://goo.gl/maps/..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: Working Hours */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-800">
                <div className="col-span-3">Day</div>
                <div className="col-span-2">Open Status</div>
                <div className="col-span-3">Business Hours</div>
                <div className="col-span-4">Lunch Break</div>
              </div>
              {timings.map((time, idx) => (
                <div key={time.day_name} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-800/40 last:border-0">
                  <div className="col-span-3 text-sm font-medium text-white">{time.day_name}</div>
                  <div className="col-span-2">
                    <Switch
                      checked={!time.is_closed}
                      onCheckedChange={(checked) => handleTimingChange(idx, "is_closed", !checked)}
                    />
                    <span className="text-xs text-slate-500 ml-2">{time.is_closed ? "Closed" : "Open"}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <Input
                      disabled={time.is_closed}
                      type="time"
                      value={time.opening_time || "09:00"}
                      onChange={(e) => handleTimingChange(idx, "opening_time", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white text-xs px-2 h-8"
                    />
                    <span className="text-slate-600">-</span>
                    <Input
                      disabled={time.is_closed}
                      type="time"
                      value={time.closing_time || "18:00"}
                      onChange={(e) => handleTimingChange(idx, "closing_time", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white text-xs px-2 h-8"
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-1.5">
                    <Input
                      disabled={time.is_closed}
                      type="time"
                      value={time.lunch_break_start || "13:00"}
                      onChange={(e) => handleTimingChange(idx, "lunch_break_start", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white text-xs px-2 h-8"
                    />
                    <span className="text-slate-600">-</span>
                    <Input
                      disabled={time.is_closed}
                      type="time"
                      value={time.lunch_break_end || "14:00"}
                      onChange={(e) => handleTimingChange(idx, "lunch_break_end", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white text-xs px-2 h-8"
                    />
                  </div>
                </div>
              ))}

              {/* Holidays & Date Exceptions Section */}
              <div className="border-t border-slate-800/80 pt-6 mt-6 space-y-4">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wider uppercase text-primary">Clinic Holidays & Schedule Exceptions</h3>
                  <p className="text-slate-400 text-xs mt-1">Specify custom dates when the clinic is closed or has special working hours.</p>
                </div>
                
                {/* Add exception form */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Date</Label>
                    <Input
                      type="date"
                      value={newClinicException.date}
                      onChange={(e) => setNewClinicException({ ...newClinicException, date: e.target.value })}
                      className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Label / Holiday Name</Label>
                    <Input
                      placeholder="e.g. Christmas, Staff Day"
                      value={newClinicException.reason}
                      onChange={(e) => setNewClinicException({ ...newClinicException, reason: e.target.value })}
                      className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1 pb-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newClinicException.is_closed}
                        onCheckedChange={(checked) => setNewClinicException({ ...newClinicException, is_closed: checked })}
                      />
                      <span className="text-xs text-slate-300">Closed All Day</span>
                    </div>
                  </div>
                  
                  {!newClinicException.is_closed && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Open Time</Label>
                        <Input
                          type="time"
                          value={newClinicException.opening_time}
                          onChange={(e) => setNewClinicException({ ...newClinicException, opening_time: e.target.value })}
                          className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Close Time</Label>
                        <Input
                          type="time"
                          value={newClinicException.closing_time}
                          onChange={(e) => setNewClinicException({ ...newClinicException, closing_time: e.target.value })}
                          className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                        />
                      </div>
                    </>
                  )}
                  
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newClinicException.date) {
                        toast.error("Please select a date.");
                        return;
                      }
                      if (clinicExceptions.some((e) => e.date === newClinicException.date)) {
                        toast.error("An exception already exists for this date.");
                        return;
                      }
                      setClinicExceptions([...clinicExceptions, { ...newClinicException }]);
                      setNewClinicException({
                        date: "",
                        is_closed: true,
                        opening_time: "09:00",
                        closing_time: "18:00",
                        reason: "",
                      });
                      toast.success("Exception added!");
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs h-9 md:col-span-1"
                  >
                    Add Exception
                  </Button>
                </div>
                
                {/* List exceptions */}
                {clinicExceptions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clinicExceptions.map((ex, exIdx) => (
                      <div key={ex.date} className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">{new Date(ex.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                          <div className="flex gap-2 items-center">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ex.is_closed ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                              {ex.is_closed ? "Closed" : `Open: ${ex.opening_time} - ${ex.closing_time}`}
                            </span>
                            {ex.reason && <span className="text-xs text-slate-500">({ex.reason})</span>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setClinicExceptions(clinicExceptions.filter((_, i) => i !== exIdx))}
                          className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg animate-fade-in"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">No exceptions or holidays registered yet.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Doctors List */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {doctors.map((doc, idx) => {
                const subTab = doctorSubTabs[idx] || "profile";
                const activeDay = activeSlotDays[idx] || doc.available_days?.[0] || "Monday";
                const duration = slotDurations[idx] || 30;
                const exceptionForm = newDocExceptions[idx] || { date: "", is_available: false, reason: "" };

                return (
                  <div key={idx} className="relative bg-slate-950/40 p-5 rounded-xl border border-slate-800 space-y-4">
                    <button
                      type="button"
                      onClick={() => removeDoctor(idx)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                      <div className="bg-primary/10 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-primary text-xs">
                        #{idx + 1}
                      </div>
                      <h3 className="text-white font-bold text-sm tracking-wider uppercase">
                        {doc.doctor_name ? `Dr. ${doc.doctor_name}` : `Doctor #${idx + 1}`}
                      </h3>
                    </div>

                    {/* Sub-tab navigation */}
                    <div className="flex gap-4 border-b border-slate-800 pb-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setDoctorSubTabs({ ...doctorSubTabs, [idx]: "profile" })}
                        className={`pb-1.5 border-b-2 px-1 transition-colors ${
                          subTab === "profile"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Basic Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorSubTabs({ ...doctorSubTabs, [idx]: "slots" })}
                        className={`pb-1.5 border-b-2 px-1 transition-colors ${
                          subTab === "slots"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Weekly Slots ({Object.values(doc.weekly_slots || {}).flat().length} slots)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorSubTabs({ ...doctorSubTabs, [idx]: "exceptions" })}
                        className={`pb-1.5 border-b-2 px-1 transition-colors ${
                          subTab === "exceptions"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Exceptions & Leaves ({doc.date_exceptions?.length || 0})
                      </button>
                    </div>

                    {/* Sub-tab Content: Profile */}
                    {subTab === "profile" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Doctor Name *</Label>
                          <Input
                            value={doc.doctor_name}
                            onChange={(e) => handleDoctorChange(idx, "doctor_name", e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white"
                            placeholder="Dr Patil"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Specialization</Label>
                          <Input
                            value={doc.specialization}
                            onChange={(e) => handleDoctorChange(idx, "specialization", e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white"
                            placeholder="E.g. Dentist, Orthopedist"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Qualification</Label>
                          <Input
                            value={doc.qualification}
                            onChange={(e) => handleDoctorChange(idx, "qualification", e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white"
                            placeholder="E.g. BDS, MDS"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Experience</Label>
                          <Input
                            value={doc.experience}
                            onChange={(e) => handleDoctorChange(idx, "experience", e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white"
                            placeholder="E.g. 10 Years"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Consultation Fee (₹)</Label>
                          <Input
                            type="number"
                            value={doc.consultation_fee}
                            onChange={(e) => handleDoctorChange(idx, "consultation_fee", parseFloat(e.target.value) || 0)}
                            className="bg-slate-950 border-slate-800 text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Languages Spoken</Label>
                          <Input
                            value={doc.languages_spoken}
                            onChange={(e) => handleDoctorChange(idx, "languages_spoken", e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white"
                            placeholder="English, Spanish"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1.5">
                          <Label className="text-xs text-slate-400">Profile Photo URL</Label>
                          <Input
                            value={doc.profile_photo || ""}
                            onChange={(e) => handleDoctorChange(idx, "profile_photo", e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white"
                            placeholder="https://image-link.com/avatar.jpg"
                          />
                        </div>
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/40 pt-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400 block mb-1">Available Days</Label>
                            <div className="flex flex-wrap gap-2">
                              {DAYS_OF_WEEK.map((day) => {
                                const isChecked = doc.available_days?.includes(day);
                                return (
                                  <label
                                    key={day}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => handleDoctorAvailableDays(idx, day, e.target.checked)}
                                      className="hidden"
                                    />
                                    {day.substring(0, 3)}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-400">Shift Start</Label>
                              <Input
                                type="time"
                                value={doc.available_start_time || "09:00"}
                                onChange={(e) => handleDoctorChange(idx, "available_start_time", e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-400">Shift End</Label>
                              <Input
                                type="time"
                                value={doc.available_end_time || "17:00"}
                                onChange={(e) => handleDoctorChange(idx, "available_end_time", e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab Content: Slots */}
                    {subTab === "slots" && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Selected day switcher */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400 block">Select Day to Edit Slots</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {doc.available_days && doc.available_days.length > 0 ? (
                              doc.available_days.map((day: string) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => setActiveSlotDays({ ...activeSlotDays, [idx]: day })}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                                    activeDay === day
                                      ? "bg-primary/20 border-primary text-primary"
                                      : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-700"
                                  }`}
                                >
                                  {day}
                                </button>
                              ))
                            ) : (
                              <p className="text-xs text-rose-400 italic">No available days configured. Select available days in Profile first.</p>
                            )}
                          </div>
                        </div>

                        {doc.available_days && doc.available_days.length > 0 && (
                          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/20 space-y-4">
                            {/* Slots Generator Form */}
                            <div className="flex flex-wrap gap-3 items-end p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                              <div className="space-y-1 w-32">
                                <Label className="text-[10px] text-slate-500 uppercase font-semibold">Slot Duration</Label>
                                <select
                                  value={duration}
                                  onChange={(e) => setSlotDurations({ ...slotDurations, [idx]: parseInt(e.target.value) || 30 })}
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
                                  if (!doc.available_start_time || !doc.available_end_time) {
                                    toast.error("Please configure start/end times in Profile first.");
                                    return;
                                  }
                                  const generated = generateTimeSlots(doc.available_start_time, doc.available_end_time, duration);
                                  const updated = [...doctors];
                                  const weekly = { ...(updated[idx].weekly_slots || {}) };
                                  weekly[activeDay] = generated;
                                  updated[idx].weekly_slots = weekly;
                                  setDoctors(updated);
                                  toast.success(`Generated ${generated.length} slots for ${activeDay}!`);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-xs h-8 border border-slate-800 text-slate-300"
                              >
                                Auto-Generate Slots
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  if (!doc.available_start_time || !doc.available_end_time) {
                                    toast.error("Please configure start/end times in Profile first.");
                                    return;
                                  }
                                  if (!doc.available_days || doc.available_days.length === 0) {
                                    toast.error("Please configure available days in Profile first.");
                                    return;
                                  }
                                  const updated = [...doctors];
                                  const weekly = { ...(updated[idx].weekly_slots || {}) };
                                  let totalGenerated = 0;
                                  
                                  doc.available_days.forEach((day: string) => {
                                    const generated = generateTimeSlots(doc.available_start_time, doc.available_end_time, duration);
                                    weekly[day] = generated;
                                    totalGenerated += generated.length;
                                  });
                                  
                                  updated[idx].weekly_slots = weekly;
                                  setDoctors(updated);
                                  toast.success(`Generated ${totalGenerated} slots in bulk for all available days (${doc.available_days.join(', ')})!`);
                                }}
                                className="bg-primary/20 hover:bg-primary/30 text-xs h-8 border border-primary/30 text-primary ml-1"
                              >
                                Auto-Generate for ALL Available Days
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  const updated = [...doctors];
                                  const weekly = { ...(updated[idx].weekly_slots || {}) };
                                  const currentSlots = weekly[activeDay] || [];
                                  weekly[activeDay] = [...currentSlots, { start_time: "09:00", end_time: "09:30", is_active: true }];
                                  updated[idx].weekly_slots = weekly;
                                  setDoctors(updated);
                                }}
                                className="bg-primary hover:bg-primary/95 text-xs h-8 text-primary-foreground ml-auto"
                              >
                                Add Custom Slot
                              </Button>
                            </div>

                            {/* Slots List */}
                            <div>
                              <Label className="text-xs text-slate-400 block mb-2">Active Slots on {activeDay}</Label>
                              {doc.weekly_slots?.[activeDay] && doc.weekly_slots[activeDay].length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {doc.weekly_slots[activeDay].map((slot: any, slotIdx: number) => (
                                    <div key={slotIdx} className="flex gap-2 items-center bg-slate-950/50 border border-slate-850 p-2 rounded-lg">
                                      <Input
                                        type="time"
                                        value={slot.start_time}
                                        onChange={(e) => {
                                          const updated = [...doctors];
                                          const weekly = { ...updated[idx].weekly_slots };
                                          const daySlots = [...weekly[activeDay]];
                                          daySlots[slotIdx] = { ...daySlots[slotIdx], start_time: e.target.value };
                                          weekly[activeDay] = daySlots;
                                          updated[idx].weekly_slots = weekly;
                                          setDoctors(updated);
                                        }}
                                        className="bg-slate-950 border-slate-850 text-white text-xs h-7 px-1.5 w-20"
                                      />
                                      <span className="text-slate-600 text-xs">-</span>
                                      <Input
                                        type="time"
                                        value={slot.end_time}
                                        onChange={(e) => {
                                          const updated = [...doctors];
                                          const weekly = { ...updated[idx].weekly_slots };
                                          const daySlots = [...weekly[activeDay]];
                                          daySlots[slotIdx] = { ...daySlots[slotIdx], end_time: e.target.value };
                                          weekly[activeDay] = daySlots;
                                          updated[idx].weekly_slots = weekly;
                                          setDoctors(updated);
                                        }}
                                        className="bg-slate-950 border-slate-850 text-white text-xs h-7 px-1.5 w-20"
                                      />
                                      <Switch
                                        checked={slot.is_active}
                                        onCheckedChange={(checked) => {
                                          const updated = [...doctors];
                                          const weekly = { ...updated[idx].weekly_slots };
                                          const daySlots = [...weekly[activeDay]];
                                          daySlots[slotIdx] = { ...daySlots[slotIdx], is_active: checked };
                                          weekly[activeDay] = daySlots;
                                          updated[idx].weekly_slots = weekly;
                                          setDoctors(updated);
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          const updated = [...doctors];
                                          const weekly = { ...updated[idx].weekly_slots };
                                          weekly[activeDay] = weekly[activeDay].filter((_: any, i: number) => i !== slotIdx);
                                          updated[idx].weekly_slots = weekly;
                                          setDoctors(updated);
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

                    {/* Sub-tab Content: Exceptions */}
                    {subTab === "exceptions" && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Add Exception Form */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl items-end">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">Exception Date</Label>
                            <Input
                              type="date"
                              value={exceptionForm.date}
                              onChange={(e) => {
                                const updated = { ...newDocExceptions };
                                updated[idx] = { ...(updated[idx] || { date: "", is_available: false, reason: "" }), date: e.target.value };
                                setNewDocExceptions(updated);
                              }}
                              className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">Reason / Description</Label>
                            <Input
                              placeholder="e.g. Personal Leave, Conference"
                              value={exceptionForm.reason}
                              onChange={(e) => {
                                const updated = { ...newDocExceptions };
                                updated[idx] = { ...(updated[idx] || { date: "", is_available: false, reason: "" }), reason: e.target.value };
                                setNewDocExceptions(updated);
                              }}
                              className="bg-slate-950 border-slate-850 text-white text-xs h-9"
                            />
                          </div>
                          <div className="space-y-1 pb-1">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!exceptionForm.is_available}
                                onCheckedChange={(checked) => {
                                  const updated = { ...newDocExceptions };
                                  updated[idx] = { ...(updated[idx] || { date: "", is_available: false, reason: "" }), is_available: !checked };
                                  setNewDocExceptions(updated);
                                }}
                              />
                              <span className="text-xs text-slate-300">{!exceptionForm.is_available ? "Doctor on Leave (Unavailable)" : "Doctor Available"}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!exceptionForm.date) {
                                toast.error("Please select a date.");
                                return;
                              }
                              const updated = [...doctors];
                              const currentExs = updated[idx].date_exceptions || [];
                              if (currentExs.some((e: any) => e.date === exceptionForm.date)) {
                                toast.error("An exception already exists for this date.");
                                return;
                              }
                              updated[idx].date_exceptions = [...currentExs, { ...exceptionForm }];
                              setDoctors(updated);
                              
                              const updatedForms = { ...newDocExceptions };
                              updatedForms[idx] = { date: "", is_available: false, reason: "" };
                              setNewDocExceptions(updatedForms);
                              toast.success("Doctor exception added!");
                            }}
                            className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs h-9"
                          >
                            Add Exception
                          </Button>
                        </div>

                        {/* List Exceptions */}
                        <div>
                          <Label className="text-xs text-slate-400 block mb-2">Registered Exceptions / Leaves</Label>
                          {doc.date_exceptions && doc.date_exceptions.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {doc.date_exceptions.map((ex: any, exIdx: number) => (
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
                                      const updated = [...doctors];
                                      updated[idx].date_exceptions = updated[idx].date_exceptions.filter((_: any, i: number) => i !== exIdx);
                                      setDoctors(updated);
                                    }}
                                    className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600 italic">No leaves or overrides configured for this doctor.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <Button onClick={addDoctor} type="button" variant="outline" className="border-dashed border-slate-800 text-slate-400 hover:text-white w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Doctor
              </Button>
            </div>
          )}

          {/* STEP 4: Services */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* AI Bulk Importer Accordion/Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 border border-purple-500/20">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">AI Bulk Services Importer</h4>
                      <p className="text-xs text-slate-500">
                        Paste unstructured text (PDF/Word/Excel) or upload .txt/.csv to automatically populate services.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-800 text-xs text-slate-300 hover:bg-slate-900"
                    onClick={() => setShowImporter(!showImporter)}
                  >
                    {showImporter ? "Hide AI Importer" : "Use AI Importer"}
                  </Button>
                </div>

                {showImporter && (
                  <div className="space-y-4 pt-3 border-t border-slate-900/60 animate-fade-in">
                    {/* Sample Downloads */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <AlertCircle className="h-3.5 w-3.5 text-purple-400" />
                        <span>Not sure what format to use? Guidance templates:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-900 flex items-center gap-1.5"
                          onClick={downloadSampleCSV}
                        >
                          <Download className="h-3 w-3" /> Download Sample CSV
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-900 flex items-center gap-1.5"
                          onClick={downloadSampleTXT}
                        >
                          <Download className="h-3 w-3" /> Download Sample TXT
                        </Button>
                      </div>
                    </div>

                    {/* File Upload / Paste Split */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left side: Upload card */}
                      <div className="md:col-span-1 border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-950/20 hover:bg-slate-950/40 transition-colors relative group">
                        <input
                          type="file"
                          accept=".txt,.csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="bg-slate-900 p-3 rounded-full mb-3 text-slate-400 group-hover:text-primary transition-colors border border-slate-850">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">Upload Text or CSV</span>
                        <span className="text-[10px] text-slate-500 mt-1">Drag & drop or click</span>
                      </div>

                      {/* Right side: Pasting textarea */}
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs text-slate-400">Paste Services Text below *</Label>
                        <Textarea
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          placeholder="Paste menu catalog, pricing table, or plain description of services...&#10;Example:&#10;- Teeth whitening ₹150, 45 mins. Professional cosmetic bleaching&#10;- Routine Dental scaling at ₹80 taking 30 minutes"
                          className="bg-slate-950 border-slate-850 text-white min-h-[110px] text-xs leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Analyze Action */}
                    <div className="flex justify-end pt-2 border-t border-slate-900/60">
                      <Button
                        type="button"
                        disabled={importing}
                        onClick={handleAIImport}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-9 flex items-center gap-1.5 shadow-lg shadow-purple-950/20 px-4"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            AI Analyzing Content...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                            Analyze & Import with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {services.map((svc, idx) => (
                <div key={idx} className="relative bg-slate-950/40 p-5 rounded-xl border border-slate-800 space-y-4">
                  <button
                    type="button"
                    onClick={() => removeService(idx)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <h3 className="text-white font-bold text-sm tracking-wider uppercase text-primary">Service #{idx + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs text-slate-400">Service Name *</Label>
                      <Input
                        value={svc.service_name}
                        onChange={(e) => handleServiceChange(idx, "service_name", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white"
                        placeholder="E.g. Teeth Cleaning"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">Starting Price (₹)</Label>
                      <Input
                        type="number"
                        value={svc.starting_price}
                        onChange={(e) => handleServiceChange(idx, "starting_price", parseFloat(e.target.value) || 0)}
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">Duration (Minutes)</Label>
                      <Input
                        type="number"
                        value={svc.duration}
                        onChange={(e) => handleServiceChange(idx, "duration", parseInt(e.target.value) || 30)}
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs text-slate-400">Description</Label>
                      <Input
                        value={svc.description || ""}
                        onChange={(e) => handleServiceChange(idx, "description", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white"
                        placeholder="Brief summary..."
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-7 ml-2">
                      <Switch
                        checked={svc.is_active}
                        onCheckedChange={(checked) => handleServiceChange(idx, "is_active", checked)}
                      />
                      <span className="text-xs text-slate-300">Active</span>
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addService} type="button" variant="outline" className="border-dashed border-slate-800 text-slate-400 hover:text-white w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Service
              </Button>
            </div>
          )}

          {/* STEP 5: FAQs */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* AI Bulk FAQs Importer */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 border border-purple-500/20">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">AI Bulk FAQs Importer</h4>
                      <p className="text-xs text-slate-500">
                        Paste unstructured text (PDF/Word/Excel) or upload .txt/.csv to automatically populate FAQs.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-800 text-xs text-slate-300 hover:bg-slate-900"
                    onClick={() => setShowFaqImporter(!showFaqImporter)}
                  >
                    {showFaqImporter ? "Hide AI Importer" : "Use AI Importer"}
                  </Button>
                </div>

                {showFaqImporter && (
                  <div className="space-y-4 pt-3 border-t border-slate-900/60 animate-fade-in">
                    {/* Sample Downloads */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <AlertCircle className="h-3.5 w-3.5 text-purple-400" />
                        <span>Not sure what format to use? Guidance templates:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-900 flex items-center gap-1.5"
                          onClick={downloadSampleFAQCSV}
                        >
                          <Download className="h-3 w-3" /> Download Sample CSV
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-900 flex items-center gap-1.5"
                          onClick={downloadSampleFAQTXT}
                        >
                          <Download className="h-3 w-3" /> Download Sample TXT
                        </Button>
                      </div>
                    </div>

                    {/* File Upload / Paste Split */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left side: Upload card */}
                      <div className="md:col-span-1 border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-950/20 hover:bg-slate-950/40 transition-colors relative group">
                        <input
                          type="file"
                          accept=".txt,.csv"
                          onChange={handleFaqFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="bg-slate-900 p-3 rounded-full mb-3 text-slate-400 group-hover:text-primary transition-colors border border-slate-850">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">Upload Text or CSV</span>
                        <span className="text-[10px] text-slate-500 mt-1">Drag & drop or click</span>
                      </div>

                      {/* Right side: Pasting textarea */}
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs text-slate-400">Paste FAQs Text below *</Label>
                        <Textarea
                          value={faqBulkText}
                          onChange={(e) => setFaqBulkText(e.target.value)}
                          placeholder="Paste lists of Q&As, website text, or documents...&#10;Example:&#10;Q: What are the timings?&#10;A: Open Mon-Sat 9AM-6PM.&#10;&#10;Q: Do you accept card?&#10;A: Yes, we accept all cards."
                          className="bg-slate-950 border-slate-850 text-white min-h-[110px] text-xs leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Analyze Action */}
                    <div className="flex justify-end pt-2 border-t border-slate-900/60">
                      <Button
                        type="button"
                        disabled={faqImporting}
                        onClick={handleAIFAQImport}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-9 flex items-center gap-1.5 shadow-lg shadow-purple-950/20 px-4"
                      >
                        {faqImporting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            AI Analyzing Content...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                            Analyze & Import with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {faqs.map((faq, idx) => (
                <div key={idx} className="relative bg-slate-950/40 p-5 rounded-xl border border-slate-800 space-y-4">
                  <button
                    type="button"
                    onClick={() => removeFaq(idx)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <h3 className="text-white font-bold text-sm tracking-wider uppercase text-primary">FAQ #{idx + 1}</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Question *</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white"
                        placeholder="E.g. Is Dr. Patil available today?"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Answer *</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white min-h-[60px]"
                        placeholder="E.g. Please share preferred doctor name."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Trigger Keywords (Comma Separated)</Label>
                      <Input
                        value={faq.keywords || ""}
                        onChange={(e) => handleFaqChange(idx, "keywords", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white"
                        placeholder="E.g. doctor, schedule, available, timings"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addFaq} type="button" variant="outline" className="border-dashed border-slate-800 text-slate-400 hover:text-white w-full">
                <Plus className="h-4 w-4 mr-1" /> Add FAQ
              </Button>
            </div>
          )}

          {/* STEP 6: AI Settings */}
          {currentStep === 6 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-white">Enable AI Automated Replies</Label>
                  <p className="text-xs text-slate-500">Enable AI auto-response for incoming WhatsApp messages.</p>
                </div>
                <Switch
                  checked={aiSettings.ai_enabled}
                  onCheckedChange={(checked) => handleAISettingsChange("ai_enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai_tone" className="text-slate-300">AI Personality / Tone</Label>
                <Input
                  id="ai_tone"
                  value={aiSettings.ai_tone}
                  onChange={(e) => handleAISettingsChange("ai_tone", e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. polite and professional"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Supported Languages</Label>
                <Input
                  value={aiSettings.supported_languages.join(", ")}
                  onChange={(e) => handleAISettingsChange("supported_languages", e.target.value.split(",").map(lang => lang.trim()).filter(Boolean))}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. English, Spanish"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="greeting_message" className="text-slate-300">Greeting Message</Label>
                <Textarea
                  id="greeting_message"
                  value={aiSettings.greeting_message}
                  onChange={(e) => handleAISettingsChange("greeting_message", e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white min-h-[70px]"
                  placeholder="First automated greeting sent to new patients..."
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="after_hours_message" className="text-slate-300">After Hours / Closed Message</Label>
                <Textarea
                  id="after_hours_message"
                  value={aiSettings.after_hours_message}
                  onChange={(e) => handleAISettingsChange("after_hours_message", e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white min-h-[70px]"
                  placeholder="Reply sent when patient queries during off hours..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Human Handover Keywords (Comma Separated)</Label>
                <Input
                  value={aiSettings.escalation_keywords}
                  onChange={(e) => handleAISettingsChange("escalation_keywords", e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. human, agent, operator"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Emergency Stop Keywords (Comma Separated)</Label>
                <Input
                  value={aiSettings.emergency_keywords}
                  onChange={(e) => handleAISettingsChange("emergency_keywords", e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. heart attack, bleeding, emergency"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-white">Enable Human Handover Notification</Label>
                  <p className="text-xs text-slate-500">Insert notes in CRM and notify human agents when AI detects fallback conditions.</p>
                </div>
                <Switch
                  checked={aiSettings.human_handover_enabled}
                  onCheckedChange={(checked) => handleAISettingsChange("human_handover_enabled", checked)}
                />
              </div>
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        <div className="flex justify-between items-center p-6 border-t border-slate-800 bg-slate-900/30">
          <Button
            disabled={currentStep === 1 || saving}
            onClick={() => setCurrentStep(currentStep - 1)}
            variant="outline"
            className="border-slate-800 hover:bg-slate-800 text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <Button disabled={saving} onClick={handleSaveStep} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]">
            {saving ? (
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Saving...
              </span>
            ) : currentStep === 6 ? (
              <span className="flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Complete Setup
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Save & Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
