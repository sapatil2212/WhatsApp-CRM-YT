"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeMode = "dark" | "light" | "system";

interface MarketingThemeContextType {
  mode: ThemeMode;
  resolvedTheme: "dark" | "light";
  setMode: (mode: ThemeMode) => void;
}

const MarketingThemeContext = createContext<MarketingThemeContextType>({
  mode: "dark",
  resolvedTheme: "dark",
  setMode: () => {},
});

export function MarketingThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage or system on client side
  useEffect(() => {
    const saved = localStorage.getItem("wacrm.mtheme") as ThemeMode | null;
    const initialMode: ThemeMode = saved === "light" || saved === "dark" || saved === "system" ? saved : "dark";
    setModeState(initialMode);
    setMounted(true);
  }, []);

  // Update resolved theme and data attribute whenever mode changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    const updateTheme = () => {
      let activeTheme: "dark" | "light" = "dark";

      if (mode === "system") {
        const isSystemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        activeTheme = isSystemLight ? "light" : "dark";
      } else {
        activeTheme = mode;
      }

      setResolvedTheme(activeTheme);
      root.setAttribute("data-mtheme", activeTheme);
    };

    updateTheme();

    // Listen for system preference changes if mode is 'system'
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => updateTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [mode, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("wacrm.mtheme", newMode);
  };

  // Prevent flash by avoiding rendering with incorrect server state
  // During SSR we default to the dark fallback
  return (
    <MarketingThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </MarketingThemeContext.Provider>
  );
}

export function useMarketingTheme() {
  return useContext(MarketingThemeContext);
}
