"use client";

/**
 * Linear-list flow editor.
 *
 * The whole flow (header, trigger config, node list, validation panel)
 * is owned by this single component. State lives client-side as a
 * single `BuilderState` object; `Save` PUTs the whole structure to
 * `/api/flows/[id]`; `Activate` hits `/api/flows/[id]/activate`.
 *
 * Why one big file: keeps the diff between fields + the form code
 * obvious, matches the existing `automation-builder.tsx` shape, and
 * sidesteps over-componentization for a UI that will be replaced by a
 * react-flow canvas in v2 anyway. The node-config sub-forms live in
 * the same file as small components rather than separate modules.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CircleCheck,
  CircleAlert,
  Copy,
  History,
  Loader2,
  Plus,
  Save,
  Trash2,
  Undo2,
  Redo2,
  Workflow,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ListChecks,
  ListPlus,
  CornerDownRight,
  UserPlus,
  Flag,
  PlayCircle,
  PauseCircle,
  Inbox,
  GitFork,
  Tag,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  validateFlowForActivation,
  type ValidationIssue,
} from "@/lib/flows/validate";
import type { FlowNodeRow, FlowRow } from "@/lib/flows/types";

interface FlowBuilderProps {
  initialFlow: FlowRow;
  initialNodes: FlowNodeRow[];
}

// ============================================================
// Local state shape — mirrors the DB but the configs are typed
// loosely (Record<string, unknown>) since each node_type carries a
// different shape. The sub-form components narrow as needed.
// ============================================================

type NodeType =
  | "start"
  | "send_message"
  | "send_buttons"
  | "send_list"
  | "collect_input"
  | "condition"
  | "set_tag"
  | "handoff"
  | "end";

interface BuilderNode {
  node_key: string;
  node_type: NodeType;
  config: Record<string, unknown>;
}

interface BuilderState {
  name: string;
  description: string;
  trigger_type: "keyword" | "first_inbound_message" | "manual";
  trigger_config: Record<string, unknown>;
  entry_node_id: string | null;
  status: FlowRow["status"];
  nodes: BuilderNode[];
}

// ============================================================
// Per-node-type metadata used to render icons + labels everywhere
// the user sees a node summary.
// ============================================================

const NODE_META: Record<
  NodeType,
  { label: string; icon: typeof Workflow; color: string }
> = {
  start: { label: "Start", icon: PlayCircle, color: "text-emerald-400" },
  send_message: {
    label: "Send message",
    icon: MessageCircle,
    color: "text-emerald-400",
  },
  send_buttons: {
    label: "Send buttons",
    icon: ListChecks,
    color: "text-primary",
  },
  send_list: {
    label: "Send list",
    icon: ListPlus,
    color: "text-teal-400",
  },
  collect_input: {
    label: "Collect input",
    icon: Inbox,
    color: "text-teal-400",
  },
  condition: {
    label: "If / else",
    icon: GitFork,
    color: "text-fuchsia-400",
  },
  set_tag: {
    label: "Tag contact",
    icon: Tag,
    color: "text-pink-400",
  },
  handoff: {
    label: "Handoff to agent",
    icon: UserPlus,
    color: "text-amber-400",
  },
  end: { label: "End", icon: Flag, color: "text-slate-400" },
};

// ============================================================
// Helpers
// ============================================================

function slugify(s: string, fallback: string): string {
  const cleaned = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

function uniqueNodeKey(base: string, existing: BuilderNode[]): string {
  if (!existing.some((n) => n.node_key === base)) return base;
  let i = 2;
  while (existing.some((n) => n.node_key === `${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

// Short, single-line content summary used in the collapsed NodeCard
// header — lets users scan a 10-node flow without expanding every card.
// Returns null when there's nothing meaningful to show (start/end, or
// a freshly-added node with no fields filled in).
function truncate(s: string, max = 80): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + "…";
}

function summarizeNode(node: BuilderNode): string | null {
  const cfg = node.config;
  switch (node.node_type) {
    case "start":
    case "end":
      return null;
    case "send_message": {
      const text = typeof cfg.text === "string" ? cfg.text : "";
      return text.length > 0 ? truncate(text) : null;
    }
    case "send_buttons": {
      const text = typeof cfg.text === "string" ? cfg.text : "";
      const buttons = Array.isArray(cfg.buttons)
        ? (cfg.buttons as Array<Record<string, unknown>>)
        : [];
      const titles = buttons
        .map((b) => (typeof b.title === "string" ? b.title : ""))
        .filter(Boolean)
        .join(" / ");
      if (text.length > 0) {
        return titles ? `${truncate(text, 40)} · ${truncate(titles, 35)}` : truncate(text);
      }
      return titles || null;
    }
    case "send_list": {
      const text = typeof cfg.text === "string" ? cfg.text : "";
      const sections = Array.isArray(cfg.sections)
        ? (cfg.sections as Array<Record<string, unknown>>)
        : [];
      const rowCount = sections.reduce<number>((sum, s) => {
        const rows = Array.isArray(s.rows) ? s.rows : [];
        return sum + rows.length;
      }, 0);
      if (text.length > 0) {
        return rowCount > 0
          ? `${truncate(text, 50)} · ${rowCount} option${rowCount === 1 ? "" : "s"}`
          : truncate(text);
      }
      return rowCount > 0
        ? `${rowCount} option${rowCount === 1 ? "" : "s"} across ${sections.length} section${sections.length === 1 ? "" : "s"}`
        : null;
    }
    case "collect_input": {
      const prompt = typeof cfg.prompt_text === "string" ? cfg.prompt_text : "";
      const varKey = typeof cfg.var_key === "string" ? cfg.var_key : "";
      if (prompt.length > 0) {
        return varKey ? `${truncate(prompt, 50)} → vars.${varKey}` : truncate(prompt);
      }
      return varKey ? `→ vars.${varKey}` : null;
    }
    case "condition": {
      const subjectKey =
        typeof cfg.subject_key === "string" ? cfg.subject_key : "";
      if (!subjectKey) return null;
      const subject =
        cfg.subject === "tag"
          ? "tag"
          : cfg.subject === "contact_field"
            ? "field"
            : "var";
      const subjectStr =
        subject === "tag" ? `has tag ${truncate(subjectKey, 24)}` : `${subject}.${subjectKey}`;
      const op =
        cfg.operator === "equals"
          ? "=="
          : cfg.operator === "contains"
            ? "contains"
            : cfg.operator === "present"
              ? "exists"
              : cfg.operator === "absent"
                ? "missing"
                : "";
      const value = typeof cfg.value === "string" ? cfg.value : "";
      const valStr =
        (cfg.operator === "equals" || cfg.operator === "contains") && value
          ? ` "${truncate(value, 20)}"`
          : "";
      return subject === "tag" ? subjectStr : `${subjectStr} ${op}${valStr}`;
    }
    case "set_tag": {
      const mode = cfg.mode === "remove" ? "Remove" : "Add";
      const tagId = typeof cfg.tag_id === "string" ? cfg.tag_id : "";
      // No tag name available without an async lookup here; show a
      // short prefix of the UUID so users can disambiguate between
      // multiple set_tag nodes at a glance.
      return tagId ? `${mode} tag ${tagId.slice(0, 8)}…` : `${mode} tag (none picked)`;
    }
    case "handoff": {
      const note = typeof cfg.note === "string" ? cfg.note : "";
      return note.length > 0 ? truncate(note) : null;
    }
  }
}

function defaultConfigFor(type: NodeType): Record<string, unknown> {
  switch (type) {
    case "start":
      return { next_node_key: "" };
    case "send_message":
      return { text: "", next_node_key: "" };
    case "send_buttons":
      return {
        text: "",
        buttons: [{ reply_id: "yes", title: "Yes", next_node_key: "" }],
      };
    case "send_list":
      return {
        text: "",
        button_label: "View options",
        sections: [
          {
            title: "",
            rows: [
              { reply_id: "row_1", title: "Option 1", next_node_key: "" },
            ],
          },
        ],
      };
    case "collect_input":
      return {
        prompt_text: "",
        var_key: "answer",
        next_node_key: "",
      };
    case "condition":
      return {
        subject: "var",
        subject_key: "",
        operator: "equals",
        value: "",
        true_next: "",
        false_next: "",
      };
    case "set_tag":
      return { mode: "add", tag_id: "", next_node_key: "" };
    case "handoff":
      return { note: "" };
    case "end":
      return {};
  }
}

// ============================================================
// Root component
// ============================================================

export function FlowBuilder({ initialFlow, initialNodes }: FlowBuilderProps) {
  const router = useRouter();

  const [state, setState] = useState<BuilderState>(() => ({
    name: initialFlow.name,
    description: initialFlow.description ?? "",
    trigger_type: initialFlow.trigger_type,
    trigger_config: initialFlow.trigger_config as Record<string, unknown>,
    entry_node_id: initialFlow.entry_node_id,
    status: initialFlow.status,
    nodes: initialNodes.map((n) => ({
      node_key: n.node_key,
      node_type: n.node_type as NodeType,
      config: n.config as Record<string, unknown>,
    })),
  }));

  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialNodes.map((n) => n.node_key)),
  );
  // Tracks whether the in-memory state has user edits that haven't been
  // PUT yet. We use a wrapper setState (`setStateDirty`) for user edits;
  // status-only changes after the activate API succeeds use raw setState
  // so they don't falsely re-flag the form as dirty.
  const [dirty, setDirty] = useState(false);

  // ── Undo / Redo history ────────────────────────────────────────────
  const historyRef = useRef<{ past: BuilderState[]; future: BuilderState[] }>({
    past: [],
    future: [],
  });
  const MAX_HISTORY = 30;

  const setStateDirty = useCallback<typeof setState>((updaterOrValue) => {
    setDirty(true);
    setState((prev) => {
      const hist = historyRef.current;
      hist.past = [...hist.past.slice(-(MAX_HISTORY - 1)), prev];
      hist.future = []; // clear redo on new edit
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const hist = historyRef.current;
    if (hist.past.length === 0) return;
    const prev = hist.past[hist.past.length - 1];
    hist.past = hist.past.slice(0, -1);
    setState((cur) => {
      hist.future = [cur, ...hist.future];
      return prev;
    });
    setDirty(true);
  }, []);

  const redo = useCallback(() => {
    const hist = historyRef.current;
    if (hist.future.length === 0) return;
    const next = hist.future[0];
    hist.future = hist.future.slice(1);
    setState((cur) => {
      hist.past = [...hist.past, cur];
      return next;
    });
    setDirty(true);
  }, []);

  // Used by jumpToNode() to scroll the target into view + flash its border.
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [flashedKey, setFlashedKey] = useState<string | null>(null);

  // Browser-level reload / tab-close / external-link guard. SPA
  // navigation (sidebar links, back button) isn't covered here — Next 16
  // routes through the App Router and beforeunload doesn't fire on
  // client-side route changes. That's a follow-up; this catches the
  // accidental refresh / closed-window class of data loss.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore the return value but require something
      // truthy to actually show the native prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // handleSaveRef is assigned after handleSave is defined (below).
  const handleSaveRef = useRef<(() => void) | null>(null);

  // ---- Validation ----
  const issues = useMemo<ValidationIssue[]>(
    () =>
      validateFlowForActivation(
        {
          name: state.name,
          trigger_type: state.trigger_type,
          trigger_config: state.trigger_config,
          entry_node_id: state.entry_node_id,
        },
        state.nodes,
      ),
    [state],
  );
  const blockers = issues.filter((i) => i.severity === "error");
  const canActivate = blockers.length === 0;

  // ---- Save (PUT) ----
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/flows/${initialFlow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          description: state.description || null,
          trigger_type: state.trigger_type,
          trigger_config: state.trigger_config,
          entry_node_id: state.entry_node_id,
          nodes: state.nodes,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Save failed: ${res.status}`);
      }
      setDirty(false);
      toast.success("Saved.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [initialFlow.id, state]);

  // ── Ctrl+S save, Ctrl+Z undo, Ctrl+Y redo ─────────────────────────
  handleSaveRef.current = handleSave;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current?.();
      }
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ---- Activate / Pause / Archive ----
  const handleStatus = useCallback(
    async (next: BuilderState["status"]) => {
      if (next === "active" && !canActivate) {
        toast.error("Fix the issues below before activating.");
        return;
      }
      setActivating(true);
      try {
        // Always save first so the activation validator sees the
        // latest state — the user shouldn't have to remember "save
        // then activate".
        if (next === "active") {
          await handleSave();
        }
        const res = await fetch(`/api/flows/${initialFlow.id}/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? `Status update failed: ${res.status}`);
        }
        setState((s) => ({ ...s, status: next }));
        toast.success(
          next === "active"
            ? "Flow activated."
            : next === "archived"
              ? "Archived."
              : "Saved as draft.",
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Status update failed";
        toast.error(msg);
      } finally {
        setActivating(false);
      }
    },
    [canActivate, handleSave, initialFlow.id],
  );

  // ---- Delete ----
  const handleDelete = useCallback(async () => {
    const yes = window.confirm(
      `Delete "${state.name}"? Any active runs end immediately. This can't be undone.`,
    );
    if (!yes) return;
    try {
      const res = await fetch(`/api/flows/${initialFlow.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      router.push("/flows");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }, [initialFlow.id, router, state.name]);

  // ---- Node helpers ----
  const updateNode = useCallback(
    (key: string, patch: Partial<BuilderNode>) => {
      setStateDirty((s) => {
        const newKey = patch.node_key;
        const keyChanged = newKey && newKey !== key;

        const nodes = s.nodes.map((n) => {
          // Apply the patch to the target node first.
          const updated = n.node_key === key ? { ...n, ...patch } : n;

          // If the node_key was renamed, rewrite every reference to the
          // old key in all other nodes' configs so the graph stays valid.
          if (!keyChanged || n.node_key === key) return updated;

          const rewrite = (v: unknown): unknown => {
            if (v === key) return newKey;
            if (Array.isArray(v)) return v.map(rewrite);
            if (v && typeof v === "object") {
              return Object.fromEntries(
                Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, rewrite(val)]),
              );
            }
            return v;
          };
          return { ...updated, config: rewrite(updated.config) as Record<string, unknown> };
        });

        return {
          ...s,
          nodes,
          // Update entry_node_id if it pointed at the renamed node.
          entry_node_id:
            keyChanged && s.entry_node_id === key ? newKey : s.entry_node_id,
        };
      });
    },
    [setStateDirty],
  );

  const updateNodeConfig = useCallback(
    (key: string, configPatch: Record<string, unknown>) => {
      setStateDirty((s) => ({
        ...s,
        nodes: s.nodes.map((n) =>
          n.node_key === key ? { ...n, config: { ...n.config, ...configPatch } } : n,
        ),
      }));
    },
    [setStateDirty],
  );

  const addNode = useCallback(
    (type: NodeType) => {
      const meta = NODE_META[type];
      const base = slugify(meta.label, type);
      setStateDirty((s) => {
        const node_key = uniqueNodeKey(base, s.nodes);
        const newNode: BuilderNode = {
          node_key,
          node_type: type,
          config: defaultConfigFor(type),
        };
        // Auto-wire: if the last node has a single next_node_key that's
        // empty, point it at this new node so the user doesn't have to
        // manually connect every pair.
        const nodes = [...s.nodes];
        if (nodes.length > 0) {
          const last = nodes[nodes.length - 1];
          const autoWireTypes = ["start", "send_message", "collect_input", "set_tag"];
          if (autoWireTypes.includes(last.node_type)) {
            const cfg = last.config as { next_node_key?: string };
            if (!cfg.next_node_key) {
              nodes[nodes.length - 1] = {
                ...last,
                config: { ...last.config, next_node_key: node_key },
              };
            }
          }
        }
        setExpanded((prev) => new Set([...prev, node_key]));
        return {
          ...s,
          nodes: [...nodes, newNode],
          entry_node_id:
            s.entry_node_id ??
            (type === "start" ? node_key : s.entry_node_id ?? null),
        };
      });
    },
    [setStateDirty],
  );

  // Insert a node after a specific existing node (between two nodes).
  const insertNodeAfter = useCallback(
    (afterKey: string, type: NodeType) => {
      const meta = NODE_META[type];
      const base = slugify(meta.label, type);
      setStateDirty((s) => {
        const node_key = uniqueNodeKey(base, s.nodes);
        const newNode: BuilderNode = {
          node_key,
          node_type: type,
          config: defaultConfigFor(type),
        };
        const idx = s.nodes.findIndex((n) => n.node_key === afterKey);
        if (idx === -1) return { ...s, nodes: [...s.nodes, newNode] };

        const nodes = [...s.nodes];
        // Auto-wire: point the previous node at the new node, and
        // point the new node at whatever the previous node pointed to.
        const prev = nodes[idx];
        const autoWireTypes = ["start", "send_message", "collect_input", "set_tag"];
        if (autoWireTypes.includes(prev.node_type)) {
          const oldNext = (prev.config as { next_node_key?: string }).next_node_key || "";
          nodes[idx] = { ...prev, config: { ...prev.config, next_node_key: node_key } };
          if (autoWireTypes.includes(type)) {
            newNode.config = { ...newNode.config, next_node_key: oldNext };
          }
        }

        nodes.splice(idx + 1, 0, newNode);
        setExpanded((p) => new Set([...p, node_key]));
        return { ...s, nodes };
      });
    },
    [setStateDirty],
  );

  const removeNode = useCallback(
    (key: string) => {
      setStateDirty((s) => {
        // Null out any next_node_key references pointing to the removed node
        // so no other node silently points into the void.
        const clearRef = (v: unknown): unknown => {
          if (v === key) return "";
          if (Array.isArray(v)) return v.map(clearRef);
          if (v && typeof v === "object") {
            return Object.fromEntries(
              Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, clearRef(val)]),
            );
          }
          return v;
        };
        return {
          ...s,
          nodes: s.nodes
            .filter((n) => n.node_key !== key)
            .map((n) => ({ ...n, config: clearRef(n.config) as Record<string, unknown> })),
          entry_node_id: s.entry_node_id === key ? null : s.entry_node_id,
        };
      });
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    [setStateDirty],
  );

  // Move a node up or down in the list.
  const moveNode = useCallback(
    (key: string, direction: "up" | "down") => {
      setStateDirty((s) => {
        const idx = s.nodes.findIndex((n) => n.node_key === key);
        if (idx === -1) return s;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= s.nodes.length) return s;
        const nodes = [...s.nodes];
        [nodes[idx], nodes[targetIdx]] = [nodes[targetIdx], nodes[idx]];
        return { ...s, nodes };
      });
    },
    [setStateDirty],
  );

  // Duplicate a node with a fresh key.
  const duplicateNode = useCallback(
    (key: string) => {
      setStateDirty((s) => {
        const src = s.nodes.find((n) => n.node_key === key);
        if (!src) return s;
        const newKey = uniqueNodeKey(src.node_key, s.nodes);
        const clone: BuilderNode = {
          node_key: newKey,
          node_type: src.node_type,
          config: JSON.parse(JSON.stringify(src.config)),
        };
        const idx = s.nodes.findIndex((n) => n.node_key === key);
        const nodes = [...s.nodes];
        nodes.splice(idx + 1, 0, clone);
        setExpanded((p) => new Set([...p, newKey]));
        return { ...s, nodes };
      });
    },
    [setStateDirty],
  );

  const toggleExpanded = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Jump-to-node: invoked when a user clicks an issue in the validation
  // panel. Expand the offending card (so the broken field is visible),
  // scroll it into the viewport, then flash its border so the eye lands
  // on it. requestAnimationFrame defers the scroll until after React
  // commits the expanded layout.
  const jumpToNode = useCallback((key: string) => {
    setExpanded((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setFlashedKey(key);
    requestAnimationFrame(() => {
      const el = nodeRefs.current.get(key);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    window.setTimeout(() => {
      setFlashedKey((cur) => (cur === key ? null : cur));
    }, 1600);
  }, []);

  const setNodeRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(key, el);
      else nodeRefs.current.delete(key);
    },
    [],
  );

  // ---- Render ----
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 p-6">
      <Header
        state={state}
        setState={setStateDirty}
        dirty={dirty}
        saving={saving}
        activating={activating}
        onSave={handleSave}
        onStatus={handleStatus}
        onDelete={handleDelete}
        canActivate={canActivate}
        onBack={() => router.push("/flows")}
        onViewRuns={() => router.push(`/flows/${initialFlow.id}/runs`)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyRef.current.past.length > 0}
        canRedo={historyRef.current.future.length > 0}
      />

      <TriggerPanel
        state={state}
        setState={setStateDirty}
        triggerIssues={issues.filter((i) => i.scope === "trigger")}
      />

      <EntryPicker state={state} setState={setStateDirty} />

      <section className="flex flex-col gap-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">
            Nodes ({state.nodes.length})
          </h2>
          <AddNodeButton onAdd={addNode} />
        </div>

        {state.nodes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
            <p className="mb-3">
              Add a <strong>Start</strong> node, then a <strong>Send buttons</strong>
              {" "}node, then a <strong>Handoff</strong> — that&apos;s the welcome-menu shape.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => addNode("start")}>
                <PlayCircle className="h-3.5 w-3.5 text-emerald-400" /> Start
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode("send_buttons")}>
                <ListChecks className="h-3.5 w-3.5 text-primary" /> Send buttons
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode("handoff")}>
                <UserPlus className="h-3.5 w-3.5 text-amber-400" /> Handoff
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode("end")}>
                <Flag className="h-3.5 w-3.5 text-slate-400" /> End
              </Button>
            </div>
          </div>
        ) : (
          state.nodes.map((node, idx) => (
            <div key={node.node_key}>
              <NodeCard
                node={node}
                allNodes={state.nodes}
                nodeIndex={idx}
                nodeCount={state.nodes.length}
                expanded={expanded.has(node.node_key)}
                isEntry={state.entry_node_id === node.node_key}
                isFlashed={flashedKey === node.node_key}
                cardRef={setNodeRef(node.node_key)}
                issues={issues.filter(
                  (i) => i.scope === "node" && i.node_key === node.node_key,
                )}
                onToggle={() => toggleExpanded(node.node_key)}
                onUpdate={(patch) => updateNode(node.node_key, patch)}
                onUpdateConfig={(patch) => updateNodeConfig(node.node_key, patch)}
                onRemove={() => removeNode(node.node_key)}
                onSetEntry={() =>
                  setStateDirty((s) => ({ ...s, entry_node_id: node.node_key }))
                }
                onMoveUp={() => moveNode(node.node_key, "up")}
                onMoveDown={() => moveNode(node.node_key, "down")}
                onDuplicate={() => duplicateNode(node.node_key)}
              />
              {/* Insert-between connector with add button */}
              {idx < state.nodes.length - 1 && (
                <InsertBetweenButton
                  afterKey={node.node_key}
                  nextKey={state.nodes[idx + 1]?.node_key}
                  isConnected={(() => {
                    const cfg = node.config as Record<string, unknown>;
                    const nextKey = state.nodes[idx + 1]?.node_key;
                    if (!nextKey) return false;
                    if (cfg.next_node_key === nextKey) return true;
                    return false;
                  })()}
                  onInsert={insertNodeAfter}
                />
              )}
            </div>
          ))
        )}
      </section>

      {/* Sticky-bottom so the activate-readiness status follows the
          user as they scroll through nodes. The parent <main> in the
          dashboard shell is the scroll container; this stays pinned
          to the viewport bottom (with a 1rem gap) until the page
          naturally ends, at which point it falls back into flow. */}
      <div className="sticky bottom-4 z-10 shadow-xl shadow-slate-950/60">
        <ValidationPanel issues={issues} onJump={jumpToNode} />
      </div>
    </div>
  );
}

// ============================================================
// Header
// ============================================================

function Header({
  state,
  setState,
  dirty,
  saving,
  activating,
  onSave,
  onStatus,
  onDelete,
  canActivate,
  onBack,
  onViewRuns,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  state: BuilderState;
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
  dirty: boolean;
  saving: boolean;
  activating: boolean;
  onSave: () => void;
  onStatus: (s: BuilderState["status"]) => void;
  onDelete: () => void;
  canActivate: boolean;
  onBack: () => void;
  onViewRuns: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 hover:text-slate-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Flows
        </button>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Workflow className="h-5 w-5 shrink-0 text-primary" />
          <Input
            value={state.name}
            onChange={(e) =>
              setState((s) => ({ ...s, name: e.target.value }))
            }
            placeholder="Flow name"
            className="max-w-md bg-slate-900 text-lg font-semibold"
          />
          <StatusBadge status={state.status} />
          {dirty && (
            <span
              className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-amber-300"
              title="Unsaved changes — hit Save to persist"
              aria-live="polite"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Edited
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewRuns()}
          >
            <History className="h-3.5 w-3.5" />
            Runs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          {state.status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatus("draft")}
              disabled={activating}
            >
              {activating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PauseCircle className="h-3.5 w-3.5" />
              )}
              Pause
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatus("active")}
              disabled={activating || !canActivate}
              title={
                !canActivate
                  ? "Fix the issues below before activating"
                  : undefined
              }
            >
              {activating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              Activate
            </Button>
          )}
          <Button onClick={onSave} disabled={saving} size="sm" title="Save (Ctrl+S)">
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>
      <Input
        value={state.description}
        onChange={(e) =>
          setState((s) => ({ ...s, description: e.target.value }))
        }
        placeholder="Optional description (internal — customers don't see this)"
        className="bg-slate-900 text-sm"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: BuilderState["status"] }) {
  const cls = {
    draft: "border-slate-700 bg-slate-800 text-slate-300",
    active: "border-emerald-600/40 bg-emerald-500/10 text-emerald-300",
    archived: "border-slate-700 bg-slate-800/50 text-slate-500",
  }[status];
  return (
    <Badge variant="outline" className={cn("shrink-0", cls)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ============================================================
// Trigger panel
// ============================================================

function TriggerPanel({
  state,
  setState,
  triggerIssues,
}: {
  state: BuilderState;
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
  triggerIssues: ValidationIssue[];
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Trigger</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">When…</label>
          <Select
            value={state.trigger_type}
            onValueChange={(v) =>
              setState((s) => ({
                ...s,
                trigger_type: v as BuilderState["trigger_type"],
                trigger_config:
                  v === "keyword" ? { keywords: [] } : v === "manual" ? {} : {},
              }))
            }
          >
            <SelectTrigger className="bg-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keyword">
                A message contains a keyword
              </SelectItem>
              <SelectItem value="first_inbound_message">
                Customer&apos;s first ever inbound message
              </SelectItem>
              <SelectItem value="manual">
                Manual only (no auto-trigger)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {state.trigger_type === "keyword" && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Keywords (comma-separated)
            </label>
            <Input
              value={
                Array.isArray(state.trigger_config.keywords)
                  ? (state.trigger_config.keywords as string[]).join(", ")
                  : ""
              }
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  trigger_config: {
                    ...s.trigger_config,
                    keywords: e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean),
                  },
                }))
              }
              placeholder="support, help, hi"
              className="bg-slate-800"
            />
          </div>
        )}
      </div>
      {triggerIssues.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {triggerIssues.map((i, ix) => (
            <IssueLine key={ix} issue={i} />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// Entry-node picker
// ============================================================

function EntryPicker({
  state,
  setState,
}: {
  state: BuilderState;
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
}) {
  if (state.nodes.length === 0) return null;
  return (
    <section className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
      <CornerDownRight className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-xs text-slate-400">Entry node:</span>
      <NodeKeySelect
        value={state.entry_node_id}
        nodes={state.nodes}
        onChange={(key) =>
          setState((s) => ({ ...s, entry_node_id: key }))
        }
        placeholder="Pick the first node…"
        className="flex-1 max-w-xs"
      />
    </section>
  );
}

// ============================================================
// Node card — collapsed summary + expanded config form
// ============================================================

function NodeCard({
  node,
  allNodes,
  nodeIndex,
  nodeCount,
  expanded,
  isEntry,
  isFlashed,
  cardRef,
  issues,
  onToggle,
  onUpdate,
  onUpdateConfig,
  onRemove,
  onSetEntry,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: {
  node: BuilderNode;
  allNodes: BuilderNode[];
  nodeIndex: number;
  nodeCount: number;
  expanded: boolean;
  isEntry: boolean;
  isFlashed: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  issues: ValidationIssue[];
  onToggle: () => void;
  onUpdate: (patch: Partial<BuilderNode>) => void;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onSetEntry: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
}) {
  const meta = NODE_META[node.node_type];
  const hasError = issues.some((i) => i.severity === "error");
  const preview = summarizeNode(node);
  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-lg border bg-slate-900 transition-shadow duration-500",
        hasError
          ? "border-red-500/40"
          : isEntry
            ? "border-primary/50"
            : "border-slate-800",
        isFlashed &&
          "ring-2 ring-primary ring-offset-2 ring-offset-slate-950",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <meta.icon className={cn("h-4 w-4 shrink-0", meta.color)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              {meta.label}
            </span>
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
              {node.node_key}
            </code>
            {isEntry && (
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-[10px] text-primary"
              >
                Entry
              </Badge>
            )}
          </div>
          {!expanded && preview && (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {preview}
            </p>
          )}
        </div>
        {/* Quick-glance wiring indicator for single-outbound nodes */}
        {!expanded && (() => {
          const cfg = node.config as Record<string, unknown>;
          const nextKey = typeof cfg.next_node_key === "string" ? cfg.next_node_key : null;
          if (!nextKey) return null;
          return (
            <span className="hidden items-center gap-1 text-[10px] text-slate-500 sm:inline-flex">
              <CornerDownRight className="h-3 w-3" />
              {nextKey}
            </span>
          );
        })()}
        {hasError && (
          <CircleAlert className="h-3.5 w-3.5 shrink-0 text-red-400" />
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-slate-800 px-4 py-4">
          <NodeConfigForm
            node={node}
            allNodes={allNodes}
            onUpdate={onUpdate}
            onUpdateConfig={onUpdateConfig}
          />
          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
            <div className="flex items-center gap-1">
              {!isEntry && (
                <Button variant="ghost" size="sm" onClick={onSetEntry}>
                  Set as entry
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUp}
                disabled={nodeIndex === 0}
                title="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveDown}
                disabled={nodeIndex === nodeCount - 1}
                title="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
          {issues.length > 0 && (
            <div className="mt-3 flex flex-col gap-1 rounded-md bg-red-500/5 p-2">
              {issues.map((i, ix) => (
                <IssueLine key={ix} issue={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Per-node-type config form
// ============================================================

function NodeConfigForm({
  node,
  allNodes,
  onUpdate,
  onUpdateConfig,
}: {
  node: BuilderNode;
  allNodes: BuilderNode[];
  onUpdate: (patch: Partial<BuilderNode>) => void;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
}) {
  const cfg = node.config;
  // Internal identifiers (node_key, reply_id columns on buttons/list rows)
  // are auto-generated and the runner is the only consumer. Hide them by
  // default so the form reads as plain editing; expose under "Advanced"
  // for the rare case where someone wants to lock a key for stable
  // analytics or external integration.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasReplyIds =
    node.node_type === "send_buttons" || node.node_type === "send_list";
  return (
    <div className="flex flex-col gap-3">
      {node.node_type === "start" && (
        <NextNodeRow
          value={(cfg as { next_node_key?: string }).next_node_key ?? ""}
          allNodes={allNodes}
          currentKey={node.node_key}
          onChange={(v) => onUpdateConfig({ next_node_key: v })}
          label="Advances to"
        />
      )}

      {node.node_type === "send_message" && (
        <>
          <TextRow
            label="Text sent to the customer"
            value={(cfg as { text?: string }).text ?? ""}
            onChange={(v) => onUpdateConfig({ text: v })}
          />
          <NextNodeRow
            value={(cfg as { next_node_key?: string }).next_node_key ?? ""}
            allNodes={allNodes}
            currentKey={node.node_key}
            onChange={(v) => onUpdateConfig({ next_node_key: v })}
            label="Advances to"
          />
        </>
      )}

      {node.node_type === "send_buttons" && (
        <SendButtonsForm
          cfg={cfg as SendButtonsCfg}
          allNodes={allNodes}
          currentKey={node.node_key}
          onUpdateConfig={onUpdateConfig}
          showAdvanced={showAdvanced}
        />
      )}

      {node.node_type === "send_list" && (
        <SendListForm
          cfg={cfg as SendListCfg}
          allNodes={allNodes}
          currentKey={node.node_key}
          onUpdateConfig={onUpdateConfig}
          showAdvanced={showAdvanced}
        />
      )}

      {node.node_type === "collect_input" && (
        <>
          <TextRow
            label="Prompt sent to the customer"
            value={(cfg as { prompt_text?: string }).prompt_text ?? ""}
            onChange={(v) => onUpdateConfig({ prompt_text: v })}
            rows={2}
          />
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Variable key (stored in flow_runs.vars; alphanumeric + underscore)
            </label>
            <Input
              value={(cfg as { var_key?: string }).var_key ?? ""}
              onChange={(e) =>
                onUpdateConfig({
                  var_key: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                })
              }
              placeholder="e.g. name, email, company"
              className="bg-slate-800 font-mono text-xs"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Interpolate in downstream prompts and handoff notes with{" "}
              <code className="rounded bg-slate-800 px-1">
                {"{{vars."}
                {(cfg as { var_key?: string }).var_key || "name"}
                {"}}"}
              </code>
              .
            </p>
          </div>
          <NextNodeRow
            value={(cfg as { next_node_key?: string }).next_node_key ?? ""}
            allNodes={allNodes}
            currentKey={node.node_key}
            onChange={(v) => onUpdateConfig({ next_node_key: v })}
            label="After capturing, advance to"
          />
        </>
      )}

      {node.node_type === "condition" && (
        <ConditionForm
          cfg={cfg as ConditionCfg}
          allNodes={allNodes}
          currentKey={node.node_key}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {node.node_type === "set_tag" && (
        <SetTagForm
          cfg={cfg as SetTagCfg}
          allNodes={allNodes}
          currentKey={node.node_key}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {node.node_type === "handoff" && (
        <TextRow
          label="Internal note (for the agent picking up)"
          value={(cfg as { note?: string }).note ?? ""}
          onChange={(v) => onUpdateConfig({ note: v })}
          rows={2}
        />
      )}

      {node.node_type === "end" && (
        <p className="text-xs text-slate-500">
          Terminal node. When the runner reaches this node the run is marked
          complete. No config needed.
        </p>
      )}

      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
        >
          {showAdvanced ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {showAdvanced ? "Hide" : "Show"} advanced
        </button>
        {showAdvanced && (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Node key (internal identifier — keep stable for analytics)
              </label>
              <Input
                value={node.node_key}
                onChange={(e) =>
                  onUpdate({ node_key: slugify(e.target.value, node.node_key) })
                }
                className="bg-slate-800 font-mono text-xs"
              />
            </div>
            {hasReplyIds && (
              <p className="text-[10px] text-slate-500">
                Reply IDs for each option are shown inline above. They&apos;re
                returned by WhatsApp when a customer taps; you usually don&apos;t
                need to touch them.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- send_buttons form ----

interface SendButtonsCfg {
  text?: string;
  footer_text?: string;
  buttons?: Array<{ reply_id: string; title: string; next_node_key: string }>;
}

function SendButtonsForm({
  cfg,
  allNodes,
  currentKey,
  onUpdateConfig,
  showAdvanced,
}: {
  cfg: SendButtonsCfg;
  allNodes: BuilderNode[];
  currentKey: string;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
  showAdvanced: boolean;
}) {
  const buttons = cfg.buttons ?? [];
  const updateButton = (
    idx: number,
    patch: Partial<NonNullable<SendButtonsCfg["buttons"]>[number]>,
  ) => {
    onUpdateConfig({
      buttons: buttons.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    });
  };
  const addButton = () =>
    onUpdateConfig({
      buttons: [
        ...buttons,
        {
          reply_id: `btn_${buttons.length + 1}`,
          title: "Option",
          next_node_key: "",
        },
      ],
    });
  const removeButton = (idx: number) =>
    onUpdateConfig({ buttons: buttons.filter((_, i) => i !== idx) });

  return (
    <>
      <TextRow
        label="Body text"
        value={cfg.text ?? ""}
        onChange={(v) => onUpdateConfig({ text: v })}
        rows={3}
      />
      <TextRow
        label="Footer (optional, 60 chars)"
        value={cfg.footer_text ?? ""}
        onChange={(v) => onUpdateConfig({ footer_text: v })}
      />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-slate-400">
            Buttons (1–3) — each one routes to a different next node
          </label>
        </div>
        <div className="flex flex-col gap-3">
          {buttons.map((b, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-1 gap-2 rounded-md border border-slate-800 bg-slate-800/40 p-3",
                showAdvanced
                  ? "md:grid-cols-[1fr_2fr_2fr_auto]"
                  : "md:grid-cols-[2fr_2fr_auto]",
              )}
            >
              {showAdvanced && (
                <Input
                  value={b.reply_id}
                  onChange={(e) =>
                    updateButton(i, {
                      reply_id: slugify(e.target.value, `btn_${i + 1}`),
                    })
                  }
                  placeholder="reply_id"
                  className="bg-slate-800 font-mono text-xs"
                />
              )}
              <Input
                value={b.title}
                onChange={(e) => updateButton(i, { title: e.target.value })}
                placeholder="Visible title (≤20 chars)"
                className="bg-slate-800"
                maxLength={20}
              />
              <NodeKeySelect
                value={b.next_node_key || null}
                nodes={allNodes}
                excludeKey={currentKey}
                onChange={(v) => updateButton(i, { next_node_key: v ?? "" })}
                placeholder="Next node…"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeButton(i)}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {buttons.length < 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addButton}
            className="mt-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add button
          </Button>
        )}
      </div>
    </>
  );
}

// ---- send_list form ----

interface SendListCfg {
  text?: string;
  button_label?: string;
  footer_text?: string;
  sections?: Array<{
    title?: string;
    rows: Array<{
      reply_id: string;
      title: string;
      description?: string;
      next_node_key: string;
    }>;
  }>;
}

function SendListForm({
  cfg,
  allNodes,
  currentKey,
  onUpdateConfig,
  showAdvanced,
}: {
  cfg: SendListCfg;
  allNodes: BuilderNode[];
  currentKey: string;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
  showAdvanced: boolean;
}) {
  const sections = cfg.sections ?? [];
  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);

  const updateSection = (
    sIdx: number,
    patch: Partial<NonNullable<SendListCfg["sections"]>[number]>,
  ) => {
    onUpdateConfig({
      sections: sections.map((s, i) =>
        i === sIdx ? { ...s, ...patch } : s,
      ),
    });
  };
  const addSection = () =>
    onUpdateConfig({
      sections: [
        ...sections,
        {
          title: "",
          rows: [
            {
              reply_id: `row_${totalRows + 1}`,
              title: `Option ${totalRows + 1}`,
              next_node_key: "",
            },
          ],
        },
      ],
    });
  const removeSection = (sIdx: number) =>
    onUpdateConfig({ sections: sections.filter((_, i) => i !== sIdx) });
  const updateRow = (
    sIdx: number,
    rIdx: number,
    patch: Partial<
      NonNullable<SendListCfg["sections"]>[number]["rows"][number]
    >,
  ) => {
    onUpdateConfig({
      sections: sections.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              rows: s.rows.map((r, j) => (j === rIdx ? { ...r, ...patch } : r)),
            }
          : s,
      ),
    });
  };
  const addRow = (sIdx: number) =>
    onUpdateConfig({
      sections: sections.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              rows: [
                ...s.rows,
                {
                  reply_id: `row_${totalRows + 1}`,
                  title: `Option ${totalRows + 1}`,
                  next_node_key: "",
                },
              ],
            }
          : s,
      ),
    });
  const removeRow = (sIdx: number, rIdx: number) =>
    onUpdateConfig({
      sections: sections.map((s, i) =>
        i === sIdx ? { ...s, rows: s.rows.filter((_, j) => j !== rIdx) } : s,
      ),
    });

  return (
    <>
      <TextRow
        label="Body text"
        value={cfg.text ?? ""}
        onChange={(v) => onUpdateConfig({ text: v })}
        rows={3}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextRow
          label="Tap-to-expand button label (≤20 chars)"
          value={cfg.button_label ?? ""}
          onChange={(v) => onUpdateConfig({ button_label: v })}
        />
        <TextRow
          label="Footer (optional, 60 chars)"
          value={cfg.footer_text ?? ""}
          onChange={(v) => onUpdateConfig({ footer_text: v })}
        />
      </div>

      <div className="mt-2">
        <label className="mb-2 block text-xs text-slate-400">
          Rows (1–10 total across all sections)
        </label>
        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="mb-3 rounded-md border border-slate-800 bg-slate-800/40 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <Input
                value={section.title ?? ""}
                onChange={(e) =>
                  updateSection(sIdx, { title: e.target.value })
                }
                placeholder={`Section ${sIdx + 1} title (optional)`}
                className="bg-slate-800 text-xs"
              />
              {sections.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(sIdx)}
                  className="shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  aria-label="Remove section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {section.rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className={cn(
                  "mb-2 grid grid-cols-1 gap-2",
                  showAdvanced
                    ? "md:grid-cols-[1fr_2fr_2fr_auto]"
                    : "md:grid-cols-[2fr_2fr_auto]",
                )}
              >
                {showAdvanced && (
                  <Input
                    value={row.reply_id}
                    onChange={(e) =>
                      updateRow(sIdx, rIdx, {
                        reply_id: slugify(
                          e.target.value,
                          `row_${rIdx + 1}`,
                        ),
                      })
                    }
                    placeholder="reply_id"
                    className="bg-slate-800 font-mono text-xs"
                  />
                )}
                <Input
                  value={row.title}
                  onChange={(e) =>
                    updateRow(sIdx, rIdx, { title: e.target.value })
                  }
                  placeholder="Row title (≤24)"
                  className="bg-slate-800"
                  maxLength={24}
                />
                <NodeKeySelect
                  value={row.next_node_key || null}
                  nodes={allNodes}
                  excludeKey={currentKey}
                  onChange={(v) =>
                    updateRow(sIdx, rIdx, { next_node_key: v ?? "" })
                  }
                  placeholder="Next node…"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(sIdx, rIdx)}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {totalRows < 10 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addRow(sIdx)}
                className="mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add row
              </Button>
            )}
          </div>
        ))}
        {/* WhatsApp's interactive-list spec caps sections at 10. Group rows
            by category (Billing / Support / Sales etc.) to give customers a
            scannable menu. */}
        {sections.length < 10 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addSection}
          >
            <Plus className="h-3.5 w-3.5" />
            Add section
          </Button>
        )}
      </div>
    </>
  );
}

// ---- condition form ----

interface ConditionCfg {
  subject?: "var" | "tag" | "contact_field";
  subject_key?: string;
  operator?: "equals" | "contains" | "present" | "absent";
  value?: string;
  true_next?: string;
  false_next?: string;
}

interface UserTag {
  id: string;
  name: string;
  color?: string;
}

function ConditionForm({
  cfg,
  allNodes,
  currentKey,
  onUpdateConfig,
}: {
  cfg: ConditionCfg;
  allNodes: BuilderNode[];
  currentKey: string;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
}) {
  const [tags, setTags] = useState<UserTag[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tags").catch(() => null);
        if (!res || !res.ok) return;
        const json = (await res.json()) as { tags?: UserTag[] };
        if (!cancelled) setTags(json.tags ?? []);
      } catch {
        // Tags endpoint absent on older deployments — fall back to a
        // plain text input so the condition is still authorable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subject = cfg.subject ?? "var";
  const operator = cfg.operator ?? "equals";
  const showValue = operator === "equals" || operator === "contains";

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">If</label>
          <Select
            value={subject}
            onValueChange={(v) =>
              onUpdateConfig({ subject: v as ConditionCfg["subject"] })
            }
          >
            <SelectTrigger className="bg-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="var">Captured variable</SelectItem>
              <SelectItem value="tag">Contact has tag</SelectItem>
              <SelectItem value="contact_field">Contact field</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-slate-400">
            {subject === "var"
              ? "var name"
              : subject === "tag"
                ? "Tag"
                : "Field"}
          </label>
          {subject === "tag" && tags.length > 0 ? (
            <Select
              value={cfg.subject_key ?? ""}
              onValueChange={(v) => onUpdateConfig({ subject_key: v })}
            >
              <SelectTrigger className="bg-slate-800">
                <SelectValue placeholder="Pick a tag…" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : subject === "contact_field" ? (
            <Select
              value={cfg.subject_key ?? ""}
              onValueChange={(v) => onUpdateConfig({ subject_key: v })}
            >
              <SelectTrigger className="bg-slate-800">
                <SelectValue placeholder="Pick a field…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">name</SelectItem>
                <SelectItem value="email">email</SelectItem>
                <SelectItem value="phone">phone</SelectItem>
                <SelectItem value="company">company</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={cfg.subject_key ?? ""}
              onChange={(e) => onUpdateConfig({ subject_key: e.target.value })}
              placeholder={subject === "var" ? "e.g. email" : "tag UUID"}
              className="bg-slate-800 font-mono text-xs"
            />
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          showValue ? "md:grid-cols-2" : "",
        )}
      >
        <div>
          <label className="mb-1 block text-xs text-slate-400">Operator</label>
          <Select
            value={operator}
            onValueChange={(v) =>
              onUpdateConfig({ operator: v as ConditionCfg["operator"] })
            }
          >
            <SelectTrigger className="bg-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">is present</SelectItem>
              <SelectItem value="absent">is absent</SelectItem>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {showValue && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">Value</label>
            <Input
              value={cfg.value ?? ""}
              onChange={(e) => onUpdateConfig({ value: e.target.value })}
              className="bg-slate-800"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NextNodeRow
          value={cfg.true_next ?? ""}
          allNodes={allNodes}
          currentKey={currentKey}
          onChange={(v) => onUpdateConfig({ true_next: v })}
          label="If true → advance to"
        />
        <NextNodeRow
          value={cfg.false_next ?? ""}
          allNodes={allNodes}
          currentKey={currentKey}
          onChange={(v) => onUpdateConfig({ false_next: v })}
          label="If false → advance to"
        />
      </div>
    </>
  );
}

// ---- set_tag form ----

interface SetTagCfg {
  mode?: "add" | "remove";
  tag_id?: string;
  next_node_key?: string;
}

function SetTagForm({
  cfg,
  allNodes,
  currentKey,
  onUpdateConfig,
}: {
  cfg: SetTagCfg;
  allNodes: BuilderNode[];
  currentKey: string;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
}) {
  const [tags, setTags] = useState<UserTag[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tags").catch(() => null);
        if (!res || !res.ok) return;
        const json = (await res.json()) as { tags?: UserTag[] };
        if (!cancelled) setTags(json.tags ?? []);
      } catch {
        // No tags endpoint — fall back to raw UUID input.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Action</label>
          <Select
            value={cfg.mode ?? "add"}
            onValueChange={(v) =>
              onUpdateConfig({ mode: v as SetTagCfg["mode"] })
            }
          >
            <SelectTrigger className="bg-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add tag</SelectItem>
              <SelectItem value="remove">Remove tag</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Tag</label>
          {tags.length > 0 ? (
            <Select
              value={cfg.tag_id ?? ""}
              onValueChange={(v) => onUpdateConfig({ tag_id: v })}
            >
              <SelectTrigger className="bg-slate-800">
                <SelectValue placeholder="Pick a tag…" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={cfg.tag_id ?? ""}
              onChange={(e) => onUpdateConfig({ tag_id: e.target.value })}
              placeholder="Tag UUID"
              className="bg-slate-800 font-mono text-xs"
            />
          )}
        </div>
      </div>
      <NextNodeRow
        value={cfg.next_node_key ?? ""}
        allNodes={allNodes}
        currentKey={currentKey}
        onChange={(v) => onUpdateConfig({ next_node_key: v })}
        label="Then advance to"
      />
    </>
  );
}

// ---- Smaller field components ----

function TextRow({
  label,
  value,
  onChange,
  rows = 1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      {rows > 1 ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="bg-slate-800"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-800"
        />
      )}
    </div>
  );
}

function NextNodeRow({
  value,
  allNodes,
  currentKey,
  onChange,
  label,
}: {
  value: string;
  allNodes: BuilderNode[];
  currentKey: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <NodeKeySelect
        value={value || null}
        nodes={allNodes}
        excludeKey={currentKey}
        onChange={(v) => onChange(v ?? "")}
        placeholder="Pick a next node…"
      />
    </div>
  );
}

function NodeKeySelect({
  value,
  nodes,
  excludeKey,
  onChange,
  placeholder,
  className,
}: {
  value: string | null;
  nodes: BuilderNode[];
  excludeKey?: string;
  onChange: (v: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const options = nodes.filter((n) => n.node_key !== excludeKey);
  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? null : v)}
    >
      <SelectTrigger className={cn("bg-slate-800", className)}>
        <SelectValue placeholder={placeholder ?? "—"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— None —</SelectItem>
        {options.map((n) => {
          const Icon = NODE_META[n.node_type].icon;
          return (
            <SelectItem key={n.node_key} value={n.node_key}>
              <span className="inline-flex items-center gap-1.5">
                <Icon
                  className={cn("h-3 w-3", NODE_META[n.node_type].color)}
                />
                {n.node_key}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ============================================================
// Insert-between connector button
// ============================================================

function InsertBetweenButton({
  afterKey,
  nextKey,
  isConnected,
  onInsert,
}: {
  afterKey: string;
  nextKey?: string;
  isConnected: boolean;
  onInsert: (afterKey: string, type: NodeType) => void;
}) {
  const types: NodeType[] = [
    "send_message",
    "send_buttons",
    "send_list",
    "collect_input",
    "condition",
    "set_tag",
    "handoff",
    "end",
  ];
  return (
    <div className="group relative flex items-center justify-center py-1">
      {/* Connection line */}
      <div
        className={cn(
          "absolute left-1/2 top-0 h-full w-px -translate-x-1/2",
          isConnected ? "bg-emerald-600/50" : "bg-slate-700/50",
        )}
      />
      {/* Connection indicator */}
      {isConnected && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-medium text-emerald-500/70 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowDown className="h-3 w-3" />
        </div>
      )}
      {/* Insert button (shows on hover) */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative z-10 mx-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 opacity-40 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary hover:opacity-100 group-hover:opacity-100"
          aria-label="Insert node here"
        >
          <Plus className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="border-slate-700 bg-slate-900">
          {types.map((t) => {
            const meta = NODE_META[t];
            return (
              <DropdownMenuItem key={t} onClick={() => onInsert(afterKey, t)}>
                <meta.icon className={cn("h-3.5 w-3.5", meta.color)} />
                {meta.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================
// Add-node menu
// ============================================================

const NODE_DESCRIPTIONS: Record<NodeType, string> = {
  start: "Entry point of the flow",
  send_message: "Send a text message",
  send_buttons: "Message with up to 3 reply buttons",
  send_list: "Interactive list menu (up to 10 options)",
  collect_input: "Ask a question and store the answer",
  condition: "Branch based on a variable or tag",
  set_tag: "Add or remove a contact tag",
  handoff: "Transfer to a human agent",
  end: "End the flow",
};

function AddNodeButton({ onAdd }: { onAdd: (type: NodeType) => void }) {
  const categories: { label: string; types: NodeType[] }[] = [
    { label: "Flow control", types: ["start", "condition", "end"] },
    { label: "Messages", types: ["send_message", "send_buttons", "send_list"] },
    { label: "Data", types: ["collect_input", "set_tag"] },
    { label: "Actions", types: ["handoff"] },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
        aria-label="Add node"
      >
        <Plus className="h-3.5 w-3.5" />
        Add node
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 border-slate-700 bg-slate-900">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {cat.label}
            </div>
            {cat.types.map((t) => {
              const meta = NODE_META[t];
              return (
                <DropdownMenuItem
                  key={t}
                  onClick={() => onAdd(t)}
                  className="flex flex-col items-start gap-0 py-1.5"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <meta.icon className={cn("h-3.5 w-3.5", meta.color)} />
                    {meta.label}
                  </span>
                  <span className="ml-5 text-[10px] text-slate-500">
                    {NODE_DESCRIPTIONS[t]}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// Validation panel — bottom of the editor
// ============================================================

function ValidationPanel({
  issues,
  onJump,
}: {
  issues: ValidationIssue[];
  onJump: (key: string) => void;
}) {
  if (issues.length === 0) {
    // Slate-950 base + emerald accents so the panel stays readable when
    // sticky-positioned over scrolled-behind node cards (a translucent
    // bg-emerald-500/10 would bleed through ugly).
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-600/50 bg-slate-950 p-3 text-sm font-medium text-emerald-300">
        <CircleCheck className="h-4 w-4 shrink-0" />
        No issues. Ready to activate.
      </div>
    );
  }
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return (
    <div
      className={cn(
        "rounded-lg border bg-slate-950 p-3",
        errors.length > 0 ? "border-red-500/40" : "border-amber-500/40",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
        {errors.length > 0 ? (
          <CircleAlert className="h-4 w-4 text-red-400" />
        ) : (
          <CircleAlert className="h-4 w-4 text-amber-400" />
        )}
        {errors.length} error{errors.length === 1 ? "" : "s"},{" "}
        {warnings.length} warning{warnings.length === 1 ? "" : "s"}
      </div>
      <div className="flex flex-col gap-1">
        {issues.map((i, ix) => (
          <IssueLine key={ix} issue={i} onJump={onJump} />
        ))}
      </div>
    </div>
  );
}

function IssueLine({
  issue,
  onJump,
}: {
  issue: ValidationIssue;
  onJump?: (key: string) => void;
}) {
  const tone =
    issue.severity === "error" ? "text-red-300" : "text-amber-300";
  const iconTone =
    issue.severity === "error" ? "text-red-400" : "text-amber-400";
  const body = (
    <>
      <CircleAlert className={cn("mt-0.5 h-3 w-3 shrink-0", iconTone)} />
      <span className="min-w-0 flex-1">
        {issue.node_key && (
          <code className="mr-1 rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-400">
            {issue.node_key}
          </code>
        )}
        {issue.message}
      </span>
    </>
  );

  // Only node-scoped issues can jump; trigger-scoped issues have no
  // destination (the trigger panel is already at the top of the page).
  if (issue.node_key && onJump) {
    return (
      <button
        type="button"
        onClick={() => onJump(issue.node_key!)}
        className={cn(
          "flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-slate-800/60",
          tone,
        )}
        aria-label={`Jump to node ${issue.node_key}`}
      >
        {body}
      </button>
    );
  }
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md px-2 py-1 text-xs",
        tone,
      )}
    >
      {body}
    </div>
  );
}
