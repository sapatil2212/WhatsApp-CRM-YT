"use client";

import { Check, Sun, Moon } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Appearance panel — color-theme and theme mode pickers.
 */
export function AppearancePanel() {
  const { theme, setTheme, mode, setMode } = useTheme();
  return (
    <section className="space-y-8">
      {/* Theme Mode Selection */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Theme mode</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose whether the dashboard should be light or dark. Saved to this device.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => setMode("light")}
            aria-pressed={mode === "light"}
            className={cn(
              "flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-all",
              mode === "light"
                ? "border-primary/60 ring-2 ring-primary/40"
                : "border-border hover:border-slate-400 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/40",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Light Mode</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Clean, high-contrast visual style.</div>
            </div>
            {mode === "light" && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Check className="h-3 w-3" />
                Active
              </span>
            )}
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => setMode("dark")}
            aria-pressed={mode === "dark"}
            className={cn(
              "flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-all",
              mode === "dark"
                ? "border-primary/60 ring-2 ring-primary/40"
                : "border-border hover:border-slate-400 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/40",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Dark Mode</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Deep, premium dark visual style.</div>
            </div>
            {mode === "dark" && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Check className="h-3 w-3" />
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Accent Theme Selection */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Accent color</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the primary color palette used across the app for buttons, links, active items, and badges. Saved to this device.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => (
            <ThemeCard
              key={t.id}
              id={t.id}
              name={t.name}
              tagline={t.tagline}
              swatch={t.swatch}
              isActive={t.id === theme}
              onPick={() => setTheme(t.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ThemeCard({
  id,
  name,
  tagline,
  swatch,
  isActive,
  onPick,
}: {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: string;
  isActive: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isActive}
      aria-label={`Use ${name} theme`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            background: swatch,
            boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)",
          }}
        />
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Check className="h-3 w-3" />
            Active
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="mt-1 text-xs leading-relaxed text-slate-400">
          {tagline}
        </div>
      </div>
      <div
        className="mt-1 flex h-2 overflow-hidden rounded-full"
        aria-hidden
      >
        <span className="flex-1" style={{ background: swatch }} />
        <span className="w-3 bg-slate-700" />
        <span className="w-3 bg-slate-800" />
        <span className="w-3 bg-slate-900" />
      </div>
      <span className="sr-only">Theme id: {id}</span>
    </button>
  );
}
