"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  History,
  Search,
  Eye,
  Trash2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function WhatsAppAILogs() {
  const db = createClient();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<string>("all");

  // Details Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadLogs = async (cId: string) => {
    const { data, error } = await db
      .from("ai_chat_logs")
      .select(`
        id,
        user_message,
        ai_response,
        detected_intent,
        confidence_score,
        created_at,
        contacts ( name, phone )
      `)
      .eq("clinic_id", cId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setLogs(data || []);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: clinic } = await db.from("clinics").select("id").maybeSingle();
        if (clinic) {
          setClinicId(clinic.id);
          await loadLogs(clinic.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenDetails = (log: any) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const handleClearLogs = async () => {
    if (!clinicId) return;
    if (!confirm("Are you sure you want to delete ALL AI chat logs for this clinic? This cannot be undone.")) return;

    try {
      const { error } = await db.from("ai_chat_logs").delete().eq("clinic_id", clinicId);
      if (error) throw error;
      toast.success("AI logs cleared successfully!");
      await loadLogs(clinicId);
    } catch (err: any) {
      toast.error(`Error clearing logs: ${err.message}`);
    }
  };

  const handleDeleteSingleLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this log entry?")) return;

    try {
      const { error } = await db.from("ai_chat_logs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Log entry deleted successfully!");
      if (clinicId) await loadLogs(clinicId);
    } catch (err: any) {
      toast.error(`Error deleting log: ${err.message}`);
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ai_response?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.contacts?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.contacts?.phone?.includes(searchQuery);

    const matchesIntent = selectedIntent === "all" || log.detected_intent === selectedIntent;

    return matchesSearch && matchesIntent;
  });

  // Extract unique intents for filter dropdown
  const uniqueIntents = Array.from(new Set(logs.map((log) => log.detected_intent).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading automation audit logs...</p>
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
            You must set up your clinic information before checking AI logs.
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
            <History className="h-8 w-8 text-primary" />
            WhatsApp AI Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit history of AI automated conversations, intents detected, and LLM replies.
          </p>
        </div>
        {logs.length > 0 && (
          <Button onClick={handleClearLogs} variant="outline" className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 h-9">
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear All Logs
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center justify-between">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, query keywords, or AI answers..."
            className="pl-9 bg-slate-900 border-slate-800 text-white h-10"
          />
        </div>
        <div>
          <Select value={selectedIntent} onValueChange={(val) => setSelectedIntent(val || "all")}>
            <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-10">
              <SelectValue placeholder="Filter by intent" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white border-slate-800">
              <SelectItem value="all">All Intents</SelectItem>
              {uniqueIntents.map((intent: any) => (
                <SelectItem key={intent} value={intent}>
                  {intent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-right text-xs text-slate-500 font-medium">
          Showing {filteredLogs.length} logs
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center">
              <History className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No automation logs recorded.</p>
              <p className="text-xs text-slate-600 mt-1">Logs populate here once patient messages are processed by the AI.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-950/20">
                    <th className="p-4 font-medium">Patient</th>
                    <th className="p-4 font-medium">User Query</th>
                    <th className="p-4 font-medium">AI response</th>
                    <th className="p-4 font-medium">Intent</th>
                    <th className="p-4 font-medium">Confidence</th>
                    <th className="p-4 font-medium">Time</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => handleOpenDetails(log)}
                      className="hover:bg-slate-800/10 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {log.contacts?.name || "Patient"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {log.contacts?.phone || ""}
                        </div>
                      </td>
                      <td className="p-4 max-w-[200px] truncate text-slate-400">
                        {log.user_message}
                      </td>
                      <td className="p-4 max-w-[250px] truncate text-slate-300">
                        {log.ai_response}
                      </td>
                      <td className="p-4">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider">
                          {log.detected_intent || "fallback"}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono font-medium">
                        {log.confidence_score !== null && log.confidence_score !== undefined ? (
                          <span
                            className={
                              log.confidence_score >= 0.8
                                ? "text-emerald-400"
                                : log.confidence_score >= 0.7
                                ? "text-amber-400"
                                : "text-rose-400"
                            }
                          >
                            {(log.confidence_score * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(log);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-450 hover:text-white hover:bg-slate-800/40"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={(e) => handleDeleteSingleLog(log.id, e)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-450 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-200">
          {selectedLog && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-white text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                  AI Transaction Details
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Detailed inspection of incoming metadata and generated automated responses.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-slate-800 py-3 mt-2">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider mb-0.5">Patient Name</span>
                  <span className="text-slate-300 font-semibold text-sm">{selectedLog.contacts?.name || "Patient"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider mb-0.5">Patient Phone</span>
                  <span className="text-slate-300 font-semibold text-sm">{selectedLog.contacts?.phone || ""}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider mb-0.5">Detected Intent</span>
                  <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider mt-1">
                    {selectedLog.detected_intent || "fallback"}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider mb-0.5">Confidence Level</span>
                  <span className="text-slate-300 font-semibold text-sm font-mono">
                    {selectedLog.confidence_score !== null && selectedLog.confidence_score !== undefined
                      ? `${(selectedLog.confidence_score * 100).toFixed(0)}%`
                      : "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">User Message</Label>
                  <p className="text-sm text-slate-300 bg-slate-950/40 border border-slate-850 p-3 rounded-lg leading-relaxed whitespace-pre-wrap italic">
                    "{selectedLog.user_message}"
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">AI Automated Reply</Label>
                  <p className="text-sm text-slate-200 bg-slate-800/40 border border-slate-800 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {selectedLog.ai_response}
                  </p>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-650">
                Log generated at: {new Date(selectedLog.created_at).toLocaleString()}
              </div>

              <DialogFooter className="border-t border-slate-800 pt-4 mt-2">
                <Button type="button" onClick={() => setIsDetailsOpen(false)} className="bg-primary text-primary-foreground hover:bg-primary/95">
                  Close Details
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
