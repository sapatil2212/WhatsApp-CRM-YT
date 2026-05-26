"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_THEME,
  STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

export type ThemeMode = "light" | "dark";

const MODE_STORAGE_KEY = "wacrm.mtheme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (next: ThemeId) => void;
  mode: ThemeMode;
  setMode: (next: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Use static default initial values during server rendering & initial hydration
  // to guarantee 100% server-client HTML consistency and prevent hydration crashes.
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mode, setModeState] = useState<ThemeMode>("dark");

  // Read saved client settings and synchronize state safely after hydration completes
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (isThemeId(savedTheme)) {
        setThemeState(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      } else {
        const fromAttr = document.documentElement.dataset.theme;
        if (isThemeId(fromAttr)) {
          setThemeState(fromAttr);
        }
      }

      const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode;
      if (savedMode === "light" || savedMode === "dark") {
        setModeState(savedMode);
        document.documentElement.setAttribute("data-mtheme", savedMode);
        if (savedMode === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          document.documentElement.classList.add("dark");
        }
      } else {
        const fromAttr = document.documentElement.getAttribute("data-mtheme") as ThemeMode;
        if (fromAttr === "light" || fromAttr === "dark") {
          setModeState(fromAttr);
        }
      }
    } catch {
      // Handle sandboxed/private browsing environments
    }
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-mtheme", next);
      if (next === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  // Sync theme and mode from other tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        if (isThemeId(e.newValue) && e.newValue !== theme) {
          setThemeState(e.newValue);
          document.documentElement.dataset.theme = e.newValue;
        }
      }
      if (e.key === MODE_STORAGE_KEY) {
        if ((e.newValue === "light" || e.newValue === "dark") && e.newValue !== mode) {
          setModeState(e.newValue);
          document.documentElement.setAttribute("data-mtheme", e.newValue);
          if (e.newValue === "light") {
            document.documentElement.classList.remove("dark");
          } else {
            document.documentElement.classList.add("dark");
          }
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}


export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: DEFAULT_THEME,
      setTheme: () => {},
      mode: "dark",
      setMode: () => {},
    };
  }
  return ctx;
}

