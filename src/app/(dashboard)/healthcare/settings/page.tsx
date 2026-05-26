"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Brain,
  Save,
  Languages,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function AISettingsPage() {
  const db = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState({
    ai_enabled: true,
    ai_tone: "polite and professional",
    supported_languages: "English",
    greeting_message: "",
    after_hours_message: "",
    escalation_keywords: "",
    emergency_keywords: "",
    human_handover_enabled: true,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: clinic } = await db.from("clinics").select("id").maybeSingle();
        if (clinic) {
          setClinicId(clinic.id);

          // Fetch AI Settings
          const { data: aiSettings } = await db
            .from("ai_settings")
            .select("*")
            .eq("clinic_id", clinic.id)
            .maybeSingle();

          if (aiSettings) {
            setForm({
              ai_enabled: aiSettings.ai_enabled ?? true,
              ai_tone: aiSettings.ai_tone || "polite and professional",
              supported_languages: aiSettings.supported_languages?.join(", ") || "English",
              greeting_message: aiSettings.greeting_message || "",
              after_hours_message: aiSettings.after_hours_message || "",
              escalation_keywords: aiSettings.escalation_keywords?.join(", ") || "",
              emergency_keywords: aiSettings.emergency_keywords?.join(", ") || "",
              human_handover_enabled: aiSettings.human_handover_enabled ?? true,
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;

    setSaving(true);
    try {
      const languages = form.supported_languages
        .split(",")
        .map((lang) => lang.trim())
        .filter(Boolean);
      const escalationKws = form.escalation_keywords
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean);
      const emergencyKws = form.emergency_keywords
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean);

      const payload = {
        clinic_id: clinicId,
        ai_enabled: form.ai_enabled,
        ai_tone: form.ai_tone,
        supported_languages: languages,
        greeting_message: form.greeting_message,
        after_hours_message: form.after_hours_message,
        escalation_keywords: escalationKws,
        emergency_keywords: emergencyKws,
        human_handover_enabled: form.human_handover_enabled,
      };

      const { error } = await db.from("ai_settings").upsert(payload, {
        onConflict: "clinic_id",
      });

      if (error) throw error;
      toast.success("AI Settings updated successfully!");
    } catch (err: any) {
      toast.error(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading AI settings...</p>
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
            You must set up your clinic information before customizing AI settings.
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary animate-pulse" />
          AI Automation Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Customize intent detection rules, emergency triggers, prompt instructions, and response behavior.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardContent className="p-6 space-y-6">
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-white">Enable AI Automated Replies</Label>
                <p className="text-xs text-slate-500">
                  When enabled, patient queries received via WhatsApp will be answered by AI.
                </p>
              </div>
              <Switch
                checked={form.ai_enabled}
                onCheckedChange={(checked) => setForm({ ...form, ai_enabled: checked })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai_tone" className="text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  AI Agent Tone / Personality
                </Label>
                <Input
                  id="ai_tone"
                  value={form.ai_tone}
                  onChange={(e) => setForm({ ...form, ai_tone: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. polite and professional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supported_languages" className="text-slate-300 flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-slate-500" />
                  Supported Languages
                </Label>
                <Input
                  id="supported_languages"
                  value={form.supported_languages}
                  onChange={(e) => setForm({ ...form, supported_languages: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. English, Spanish, Hindi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting_message" className="text-slate-300">Greeting Message</Label>
              <Textarea
                id="greeting_message"
                value={form.greeting_message}
                onChange={(e) => setForm({ ...form, greeting_message: e.target.value })}
                className="bg-slate-950 border-slate-800 text-white min-h-[80px]"
                placeholder="Message sent automatically to new conversations..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="after_hours_message" className="text-slate-300">After Hours / Closed Message</Label>
              <Textarea
                id="after_hours_message"
                value={form.after_hours_message}
                onChange={(e) => setForm({ ...form, after_hours_message: e.target.value })}
                className="bg-slate-950 border-slate-800 text-white min-h-[80px]"
                placeholder="Fallback response when messages arrive outside working hours..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
              <div className="space-y-2">
                <Label htmlFor="escalation_keywords" className="text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-slate-500" />
                  Human Handover Keywords (Comma Separated)
                </Label>
                <Input
                  id="escalation_keywords"
                  value={form.escalation_keywords}
                  onChange={(e) => setForm({ ...form, escalation_keywords: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. human, agent, representative"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_keywords" className="text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  Emergency Stop Keywords (Comma Separated)
                </Label>
                <Input
                  id="emergency_keywords"
                  value={form.emergency_keywords}
                  onChange={(e) => setForm({ ...form, emergency_keywords: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. emergency, bleeding, pain, dying"
                />
              </div>
            </div>

            {/* Handover Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-white">Enable Human Handover Notification</Label>
                <p className="text-xs text-slate-500">
                  When a handover keyword is matched or AI is uncertain, flag in CRM and pause automated messages.
                </p>
              </div>
              <Switch
                checked={form.human_handover_enabled}
                onCheckedChange={(checked) => setForm({ ...form, human_handover_enabled: checked })}
              />
            </div>
          </CardContent>
          <div className="flex justify-end p-6 border-t border-slate-800 bg-slate-900/30 rounded-b-xl">
            <Button disabled={saving} type="submit" className="bg-primary text-primary-foreground hover:bg-primary/95 min-w-[120px]">
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
