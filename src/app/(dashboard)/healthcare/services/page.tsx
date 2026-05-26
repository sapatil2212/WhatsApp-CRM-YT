"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Stethoscope,
  Plus,
  Trash2,
  Edit,
  Search,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function ServicesManagement() {
  const db = createClient();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    service_name: "",
    description: "",
    starting_price: 30,
    duration: 30,
    is_active: true,
  });

  const loadServices = async (cId: string) => {
    const { data, error } = await db
      .from("clinic_services")
      .select("*")
      .eq("clinic_id", cId)
      .order("service_name");
    if (error) {
      console.error(error);
    } else {
      setServices(data || []);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: clinic } = await db.from("clinics").select("id").maybeSingle();
        if (clinic) {
          setClinicId(clinic.id);
          await loadServices(clinic.id);
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
    setEditingSvc(null);
    setForm({
      service_name: "",
      description: "",
      starting_price: 30,
      duration: 30,
      is_active: true,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (svc: any) => {
    setEditingSvc(svc);
    setForm({
      service_name: svc.service_name || "",
      description: svc.description || "",
      starting_price: svc.starting_price || 30,
      duration: svc.duration || 30,
      is_active: svc.is_active ?? true,
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!form.service_name) {
      toast.error("Service Name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clinic_id: clinicId,
        ...form,
      };

      let error;
      if (editingSvc) {
        const { error: err } = await db
          .from("clinic_services")
          .update(payload)
          .eq("id", editingSvc.id);
        error = err;
      } else {
        const { error: err } = await db.from("clinic_services").insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(editingSvc ? "Service updated successfully!" : "Service added successfully!");
      setIsOpen(false);
      await loadServices(clinicId);
    } catch (err: any) {
      toast.error(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const { error } = await db.from("clinic_services").delete().eq("id", id);
      if (error) throw error;
      toast.success("Service deleted successfully!");
      if (clinicId) await loadServices(clinicId);
    } catch (err: any) {
      toast.error(`Error deleting: ${err.message}`);
    }
  };

  const handleToggleActive = async (svc: any, active: boolean) => {
    try {
      const { error } = await db
        .from("clinic_services")
        .update({ is_active: active })
        .eq("id", svc.id);
      if (error) throw error;
      toast.success(`${svc.service_name} is now ${active ? "active" : "inactive"}.`);
      if (clinicId) await loadServices(clinicId);
    } catch (err: any) {
      toast.error(`Error toggling status: ${err.message}`);
    }
  };

  const filteredServices = services.filter((svc) =>
    svc.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    svc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading service list...</p>
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
            You must set up your clinic information before managing clinical services.
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
            <Stethoscope className="h-8 w-8 text-primary" />
            Manage Services
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure clinic healthcare services, session durations, and baseline pricing.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground hover:bg-primary/95">
          <Plus className="h-4 w-4 mr-1.5" /> Add Service
        </Button>
      </div>

      {/* Search & Statistics */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by name or description..."
            className="pl-9 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredServices.length} of {services.length} services
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center">
            <Stethoscope className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No services found matching your query.</p>
            <Button onClick={handleOpenAdd} variant="outline" className="mt-4 border-slate-800 text-slate-300 hover:bg-slate-800">
              Register First Service
            </Button>
          </div>
        ) : (
          filteredServices.map((svc) => (
            <Card key={svc.id} className="border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base text-white font-bold">{svc.service_name}</CardTitle>
                    <p className="text-xs text-slate-400 line-clamp-2 pr-4">{svc.description || "No description provided."}</p>
                  </div>
                  <Badge className={`text-[10px] font-semibold tracking-wider ${svc.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500"}`}>
                    {svc.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3.5 pb-5 pt-0 text-sm border-t border-slate-800/40 mt-2">
                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-b border-slate-800/40">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span>Duration:</span>
                    <span className="text-slate-200 font-semibold">{svc.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-slate-500 font-semibold text-sm">₹</span>
                    <span>Price:</span>
                    <span className="text-emerald-400 font-bold">₹{svc.starting_price}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={svc.is_active}
                      onCheckedChange={(checked) => handleToggleActive(svc, checked)}
                    />
                    <span className="text-xs text-slate-500">Service Active</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleOpenEdit(svc)} variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white hover:bg-slate-800/50">
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button onClick={() => handleDelete(svc.id)} variant="ghost" size="sm" className="h-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
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
                {editingSvc ? `Edit Service — ${editingSvc.service_name}` : "Define New Treatment Service"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Setup treatment names, durations, baseline fees, and description fields.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="service_name" className="text-xs text-slate-400">Service Name *</Label>
                <Input
                  id="service_name"
                  value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  placeholder="E.g. Root Canal Treatment"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs text-slate-400">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white min-h-[85px]"
                  placeholder="A brief description of what this service entails..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="starting_price" className="text-xs text-slate-400">Starting Price (₹)</Label>
                  <Input
                    id="starting_price"
                    type="number"
                    value={form.starting_price}
                    onChange={(e) => setForm({ ...form, starting_price: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="duration" className="text-xs text-slate-400">Duration (Minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-lg border border-slate-850">
                <div className="space-y-0.5">
                  <Label className="text-xs text-slate-300">Set Service as Active</Label>
                  <p className="text-[10px] text-slate-500">Allow patients to view and inquire about this service.</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-800 pt-4 mt-2">
              <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button disabled={saving} type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]">
                {saving ? "Saving..." : "Save Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
