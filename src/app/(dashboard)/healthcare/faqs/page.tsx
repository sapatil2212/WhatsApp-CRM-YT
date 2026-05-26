"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  Search,
  Key,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function FAQsManagement() {
  const db = createClient();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    question: "",
    answer: "",
    keywords: "",
  });

  const loadFaqs = async (cId: string) => {
    const { data, error } = await db
      .from("clinic_faqs")
      .select("*")
      .eq("clinic_id", cId)
      .order("question");
    if (error) {
      console.error(error);
    } else {
      setFaqs(data || []);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: clinic } = await db.from("clinics").select("id").maybeSingle();
        if (clinic) {
          setClinicId(clinic.id);
          await loadFaqs(clinic.id);
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
    setEditingFaq(null);
    setForm({
      question: "",
      answer: "",
      keywords: "",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (faq: any) => {
    setEditingFaq(faq);
    setForm({
      question: faq.question || "",
      answer: faq.answer || "",
      keywords: faq.keywords || "",
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!form.question || !form.answer) {
      toast.error("Both Question and Answer are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clinic_id: clinicId,
        ...form,
      };

      let error;
      if (editingFaq) {
        const { error: err } = await db
          .from("clinic_faqs")
          .update(payload)
          .eq("id", editingFaq.id);
        error = err;
      } else {
        const { error: err } = await db.from("clinic_faqs").insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(editingFaq ? "FAQ updated successfully!" : "FAQ added successfully!");
      setIsOpen(false);
      await loadFaqs(clinicId);
    } catch (err: any) {
      toast.error(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const { error } = await db.from("clinic_faqs").delete().eq("id", id);
      if (error) throw error;
      toast.success("FAQ deleted successfully!");
      if (clinicId) await loadFaqs(clinicId);
    } catch (err: any) {
      toast.error(`Error deleting: ${err.message}`);
    }
  };

  const filteredFaqs = faqs.filter((faq) =>
    faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.keywords?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading FAQs...</p>
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
            You must set up your clinic information before managing FAQs.
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
            <HelpCircle className="h-8 w-8 text-primary" />
            Manage FAQs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure dynamic Q&A pairs for the AI to instantly respond to recurring patient queries.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground hover:bg-primary/95">
          <Plus className="h-4 w-4 mr-1.5" /> Add FAQ
        </Button>
      </div>

      {/* Search & Statistics */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by question or keywords..."
            className="pl-9 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredFaqs.length} of {faqs.length} FAQs
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center">
            <HelpCircle className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No FAQs found matching your query.</p>
            <Button onClick={handleOpenAdd} variant="outline" className="mt-4 border-slate-800 text-slate-300 hover:bg-slate-800">
              Create First FAQ
            </Button>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <Card key={faq.id} className="border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700 transition-all duration-300">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Question</span>
                  <CardTitle className="text-base text-white font-bold leading-snug">{faq.question}</CardTitle>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button onClick={() => handleOpenEdit(faq)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(faq.id)} variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-450 hover:bg-rose-500/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm border-t border-slate-800/40 mt-1 pb-4">
                <div className="pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">AI Answer</span>
                  <p className="text-slate-300 bg-slate-950/30 border border-slate-850 p-3 rounded-lg leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
                {faq.keywords && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Key className="h-3 w-3 text-slate-650" />
                      Trigger Keywords:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {faq.keywords.split(",").map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-750 text-[10px]">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                {editingFaq ? "Edit FAQ Details" : "Create Q&A FAQ Template"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure patient query patterns and corresponding AI automated responses.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="question" className="text-xs text-slate-400">Question Pattern *</Label>
                <Input
                  id="question"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. Is Dr. Patil available today?"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="answer" className="text-xs text-slate-400">AI Response Answer *</Label>
                <Textarea
                  id="answer"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white min-h-[100px]"
                  placeholder="E.g. Yes, Dr Patil is available today from 10am to 6pm. Would you like to book an appointment?"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="keywords" className="text-xs text-slate-400">Keywords (Comma Separated)</Label>
                <Input
                  id="keywords"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. patil, available, doctor, slot"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-800 pt-4 mt-2">
              <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button disabled={saving} type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]">
                {saving ? "Saving..." : "Save FAQ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
