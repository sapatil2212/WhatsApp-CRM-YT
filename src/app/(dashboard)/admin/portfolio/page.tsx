"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit,
  Tag as TagIcon,
  Link as LinkIcon,
  Upload,
  Globe,
  Loader2,
  X,
  PlusCircle,
  Database,
  CloudLightning,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Custom brand icons using inline SVGs to bypass Lucide version incompatibilities
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
      <path d="M12 9h3.5a3.5 3.5 0 1 1-3.5 3.5V9z" />
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
      <polygon points="10 15 15 12 10 9" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────
interface ProjectLinks {
  github?: string;
  website?: string;
  figma?: string;
  video?: string;
  other?: string;
}

interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  metadata_tags: string[];
  project_links: ProjectLinks;
  preview_media: string[];
  created_at: string;
  updated_at: string;
}

const COMMON_TAG_SUGGESTIONS = [
  "Next.js",
  "React",
  "Tailwind CSS",
  "AI Integration",
  "CRM",
  "WhatsApp API",
  "Supabase",
  "Node.js",
  "SaaS",
  "Analytics",
  "Healthcare",
  "Automation"
];

// Color mapping for tags to make them look vibrant and premium
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "next.js": { bg: "bg-black/40", text: "text-white border-white/20", border: "border-white/20" },
  react: { bg: "bg-sky-500/10", text: "text-sky-400 border-sky-500/20", border: "border-sky-500/20" },
  "tailwind css": { bg: "bg-teal-500/10", text: "text-teal-400 border-teal-500/20", border: "border-teal-500/20" },
  "ai integration": { bg: "bg-emerald-500/10", text: "text-emerald-400 border-emerald-500/20", border: "border-emerald-500/20" },
  crm: { bg: "bg-emerald-500/10", text: "text-emerald-400 border-emerald-500/20", border: "border-emerald-500/20" },
  "whatsapp api": { bg: "bg-green-500/10", text: "text-green-400 border-green-500/20", border: "border-green-500/20" },
  supabase: { bg: "bg-orange-500/10", text: "text-orange-400 border-orange-500/20", border: "border-orange-500/20" },
  "node.js": { bg: "bg-lime-500/10", text: "text-lime-400 border-lime-500/20", border: "border-lime-500/20" },
  saas: { bg: "bg-emerald-500/10", text: "text-emerald-400 border-emerald-500/20", border: "border-emerald-500/20" },
  analytics: { bg: "bg-teal-500/10", text: "text-teal-400 border-teal-500/20", border: "border-teal-500/20" },
  healthcare: { bg: "bg-rose-500/10", text: "text-rose-400 border-rose-500/20", border: "border-rose-500/20" },
  automation: { bg: "bg-amber-500/10", text: "text-amber-400 border-amber-500/20", border: "border-amber-500/20" }
};

function getTagStyle(tag: string) {
  const norm = tag.toLowerCase().trim();
  return TAG_COLORS[norm] || {
    bg: "bg-slate-500/10",
    text: "text-slate-300 border-slate-500/20",
    border: "border-slate-500/20"
  };
}

// ── Showcase Modal Component ──────────────────────────────────────────
interface ShowcaseModalProps {
  item: Partial<ShowcaseItem> | null;
  onSave: (item: any) => Promise<void>;
  onClose: () => void;
}

function ShowcaseModal({ item, onSave, onClose }: ShowcaseModalProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(item?.thumbnail_url || "");
  const [tags, setTags] = useState<string[]>(item?.metadata_tags || []);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<ProjectLinks>(item?.project_links || {});
  const [previews, setPreviews] = useState<string[]>(item?.preview_media || []);
  const [previewInput, setPreviewInput] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link helper
  const updateLink = (type: keyof ProjectLinks, value: string) => {
    setLinks(prev => ({ ...prev, [type]: value }));
  };

  // Tag helper
  const addTag = (tagText: string) => {
    const cleanTag = tagText.trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags(prev => [...prev, cleanTag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Preview helper
  const addPreview = () => {
    const cleanUrl = previewInput.trim();
    if (cleanUrl && !previews.includes(cleanUrl)) {
      setPreviews(prev => [...prev, cleanUrl]);
    }
    setPreviewInput("");
  };

  const removePreview = (urlToRemove: string) => {
    setPreviews(prev => prev.filter(p => p !== urlToRemove));
  };

  // Handle Cloudinary Upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB size limit.");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const response = await fetch("/api/admin/portfolio/upload", {
        method: "POST",
        body: fd
      });

      if (!response.ok) {
        const errText = await response.json();
        throw new Error(errText.error || "Upload failed");
      }

      const data = await response.json();
      setThumbnailUrl(data.url);
      toast.success("Thumbnail uploaded to Cloudinary!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload to Cloudinary. Make sure environment config is loaded.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: item?.id,
        title,
        description,
        thumbnail_url: thumbnailUrl,
        metadata_tags: tags,
        project_links: links,
        preview_media: previews
      };
      await onSave(payload);
    } catch (err: any) {
      toast.error(err.message || "Failed to save showcase item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-6 text-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              {item?.id ? "Edit Showcase Item" : "Create Showcase Item"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Provide project details, tags, urls, and Cloudinary uploads.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Project Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="WhatsApp CRM Dashboard"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your showcase item and key integrations..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>

            {/* Cloudinary Thumbnail Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Thumbnail Asset (Cloudinary Upload)
              </label>

              <div
                onClick={handleUploadClick}
                className={cn(
                  "relative h-[180px] rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all p-4 bg-muted/20 group hover:bg-muted/40",
                  thumbnailUrl ? "border-solid border-primary" : "border-border hover:border-primary"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <p className="text-xs text-slate-400">Uploading to Cloudinary...</p>
                  </div>
                ) : thumbnailUrl ? (
                  <>
                    <img
                      src={thumbnailUrl}
                      alt="Uploaded Thumbnail"
                      className="absolute inset-0 w-full h-full object-cover rounded-xl group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 rounded-xl transition-opacity">
                      <div className="flex items-center gap-1.5 text-white bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium">
                        <Upload className="size-3.5" />
                        Replace Image
                      </div>
                    </div>
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setThumbnailUrl("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                      <ImageIcon className="size-5 text-slate-400 group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Click to upload thumbnail</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, JPEG (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2.5">
                <label className="block text-[10px] text-slate-400 mb-1">
                  Or paste direct URL:
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border my-6" />

          {/* Tags & Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metadata Tags */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Metadata Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. ChatGPT, Node.js"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    className="px-3 rounded-lg border border-border hover:bg-accent text-foreground transition-colors"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              {/* Tag Suggestions */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TAG_SUGGESTIONS.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addTag(suggestion)}
                      disabled={tags.includes(suggestion)}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-md border transition-all",
                        tags.includes(suggestion)
                          ? "bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Tags */}
              {tags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Tags ({tags.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => {
                      const style = getTagStyle(tag);
                      return (
                        <span
                          key={tag}
                          className={cn(
                            "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold",
                            style.bg,
                            style.text
                          )}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Links Builder */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Project Links
              </label>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-sky-400" /> Website
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={links.website || ""}
                    onChange={e => updateLink("website", e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-24 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <GithubIcon className="size-3.5 text-slate-300" /> GitHub
                  </div>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={links.github || ""}
                    onChange={e => updateLink("github", e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-24 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <FigmaIcon className="size-3.5 text-teal-400" /> Figma
                  </div>
                  <input
                    type="url"
                    placeholder="https://figma.com/file/..."
                    value={links.figma || ""}
                    onChange={e => updateLink("figma", e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-24 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <YoutubeIcon className="size-3.5 text-red-400" /> Video Demo
                  </div>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={links.video || ""}
                    onChange={e => updateLink("video", e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border my-6" />

          {/* Additional Preview Gallery */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Additional Preview Media Assets (URLs)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/screenshot1.png"
                value={previewInput}
                onChange={e => setPreviewInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPreview();
                  }
                }}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={addPreview}
                className="px-3 rounded-lg border border-border hover:bg-accent text-foreground transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previews.map(url => (
                  <div key={url} className="relative aspect-video rounded-lg border border-border bg-muted overflow-hidden group">
                    <img src={url} alt="Preview screenshot" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={() => removePreview(url)}
                        className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : item?.id ? (
                "Save Changes"
              ) : (
                "Create Item"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function AdminPortfolioPage() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isLocalStorageFallback, setIsLocalStorageFallback] = useState(false);

  // Load Data
  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/portfolio");
      if (!res.ok) throw new Error("HTTP error " + res.status);
      const data = await res.json();

      if (data.db_fallback) {
        setIsLocalStorageFallback(true);
        const local = localStorage.getItem("portfolio_items");
        setItems(local ? JSON.parse(local) : []);
      } else {
        setItems(data.items || []);
        setIsLocalStorageFallback(false);
      }
    } catch (err: any) {
      console.warn("DB fetch failed, falling back to Local Storage:", err);
      setIsLocalStorageFallback(true);
      const local = localStorage.getItem("portfolio_items");
      setItems(local ? JSON.parse(local) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  // Save (Create/Update) Showcase Item
  const handleSaveItem = async (payload: any) => {
    if (isLocalStorageFallback) {
      let updatedList: ShowcaseItem[];
      if (payload.id) {
        // Edit Mode
        updatedList = items.map(item =>
          item.id === payload.id
            ? { ...item, ...payload, updated_at: new Date().toISOString() }
            : item
        );
        toast.success("Showcase item updated in Local Storage");
      } else {
        // Create Mode
        const newItem: ShowcaseItem = {
          ...payload,
          id: Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        updatedList = [newItem, ...items];
        toast.success("Showcase item created in Local Storage");
      }
      setItems(updatedList);
      localStorage.setItem("portfolio_items", JSON.stringify(updatedList));
      setModalOpen(false);
      setEditingItem(null);
    } else {
      // API call mode
      try {
        const method = payload.id ? "PUT" : "POST";
        const res = await fetch("/api/admin/portfolio", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.db_fallback) {
          setIsLocalStorageFallback(true);
          // Retry save in localStorage fallback mode
          handleSaveItem(payload);
          return;
        }

        if (!res.ok) throw new Error(data.error || "Save failed");

        if (payload.id) {
          setItems(prev => prev.map(x => x.id === payload.id ? data.item : x));
          toast.success("Showcase item updated successfully");
        } else {
          setItems(prev => [data.item, ...prev]);
          toast.success("Showcase item created successfully");
        }
        setModalOpen(false);
        setEditingItem(null);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to save portfolio item");
      }
    }
  };

  // Delete Showcase Item
  const handleDeleteItem = async (id: string) => {
    if (isLocalStorageFallback) {
      const updatedList = items.filter(item => item.id !== id);
      setItems(updatedList);
      localStorage.setItem("portfolio_items", JSON.stringify(updatedList));
      toast.success("Showcase item deleted from Local Storage");
      setDeletingId(null);
    } else {
      try {
        const res = await fetch(`/api/admin/portfolio?id=${id}`, {
          method: "DELETE"
        });
        const data = await res.json();

        if (data.db_fallback) {
          setIsLocalStorageFallback(true);
          handleDeleteItem(id);
          return;
        }

        if (!res.ok) throw new Error(data.error || "Delete failed");

        setItems(prev => prev.filter(x => x.id !== id));
        toast.success("Showcase item deleted successfully");
        setDeletingId(null);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to delete portfolio item");
      }
    }
  };

  // Get All Unique Tags
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => {
      item.metadata_tags?.forEach(tag => set.add(tag));
    });
    return Array.from(set);
  }, [items]);

  // Derived filter list
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || item.metadata_tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, searchQuery, selectedTag]);

  // Summary Metrics
  const totalItems = items.length;
  const totalLinks = useMemo(() => {
    return items.reduce((acc, item) => {
      return acc + Object.keys(item.project_links || {}).filter(k => item.project_links[k as keyof ProjectLinks]).length;
    }, 0);
  }, [items]);

  return (
    <div className="space-y-6 text-foreground">
      {/* Breadcrumbs and Top Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <Layers className="size-6 text-primary" />
            Showcase Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure metadata tags, preview links, screenshots, and upload thumbnails to Cloudinary.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/10"
        >
          <Plus className="size-4" />
          Create Showcase Item
        </button>
      </div>

      {/* Database Status Warning */}
      {isLocalStorageFallback && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200"
        >
          <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Local Storage Active:</span> The database table
            <code className="mx-1 px-1 py-0.5 rounded bg-amber-500/10 font-mono text-amber-400">portfolio_items</code>
            does not exist in Supabase yet. Changes are safely saved locally in your browser. Run migration file
            <code className="ml-1 px-1 py-0.5 rounded bg-amber-500/10 font-mono text-amber-400">018_portfolio_showcase.sql</code>
            to connect database storage.
          </div>
        </motion.div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Showcase Projects</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{totalItems}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unique Tags</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{allUniqueTags.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">External Links</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{totalLinks}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Media Uploads</p>
            <p className="text-sm font-semibold mt-1 text-emerald-400 flex items-center gap-1">
              <CloudLightning className="size-3.5 text-emerald-400 animate-pulse" />
              Cloudinary Online
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects by title or description..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Tags filter dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTag(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors",
              !selectedTag
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All Tags
          </button>
          {allUniqueTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors",
                selectedTag === tag
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading portfolio showcase items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center flex flex-col items-center justify-center">
          <Briefcase className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-bold text-foreground">No Projects Found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            {searchQuery || selectedTag
              ? "Try adjusting your search criteria or tag filters."
              : "Get started by creating your very first portfolio showcase item."}
          </p>
          {(searchQuery || selectedTag) ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag(null);
              }}
              className="mt-4 text-xs font-semibold text-primary hover:underline"
            >
              Clear all filters
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="size-3.5" /> Create Showcase Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:border-slate-700/50 hover:shadow-lg transition-all group"
              >
                {/* Image header */}
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/60">
                      <ImageIcon className="size-8 text-slate-500" />
                      <span className="text-[10px] text-slate-400 mt-1">No Thumbnail</span>
                    </div>
                  )}
                  {/* Floating Controls Overlay */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-black/80 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                      title="Edit Item"
                    >
                      <Edit className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-1.5 rounded-lg bg-red-950/80 text-red-400 hover:text-red-300 border border-red-900/30 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed flex-1">
                    {item.description || "No description provided."}
                  </p>

                  {/* Metadata Tags */}
                  {item.metadata_tags && item.metadata_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {item.metadata_tags.map(tag => {
                        const style = getTagStyle(tag);
                        return (
                          <span
                            key={tag}
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              style.bg,
                              style.text
                            )}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Links and Preview counts */}
                  <div className="border-t border-border mt-4 pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {item.project_links?.website && (
                        <a
                          href={item.project_links.website}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-foreground transition-colors"
                          title="Open Live Preview"
                        >
                          <Globe className="size-4" />
                        </a>
                      )}
                      {item.project_links?.github && (
                        <a
                          href={item.project_links.github}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-foreground transition-colors"
                          title="Open Repository"
                        >
                          <GithubIcon className="size-4" />
                        </a>
                      )}
                      {item.project_links?.figma && (
                        <a
                          href={item.project_links.figma}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-foreground transition-colors"
                          title="Open Design Assets"
                        >
                          <FigmaIcon className="size-4" />
                        </a>
                      )}
                      {item.project_links?.video && (
                        <a
                          href={item.project_links.video}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-foreground transition-colors"
                          title="Open Video Demo"
                        >
                          <YoutubeIcon className="size-4" />
                        </a>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 font-medium">
                      Updated {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <ShowcaseModal
            item={editingItem}
            onSave={handleSaveItem}
            onClose={() => {
              setModalOpen(false);
              setEditingItem(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeletingId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="size-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Delete Showcase Item?</h3>
                <p className="text-xs text-muted-foreground mt-1.5">
                  This action is permanent. The showcase item metadata and link integrations will be removed.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletingId && handleDeleteItem(deletingId)}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white hover:bg-red-400 text-xs font-semibold transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
