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

  // Read from localStorage once on mount — default is always dark
  useEffect(() => {
    const saved = localStorage.getItem("chatnexgenai.mtheme");
    const initialMode: ThemeMode = saved === "light" || saved === "dark" ? saved : "dark";
    setModeState(initialMode);
    setResolvedTheme(initialMode === "light" ? "light" : "dark");
    document.documentElement.setAttribute("data-mtheme", initialMode === "light" ? "light" : "dark");
  }, []);

  // Apply theme change immediately when mode changes
  useEffect(() => {
    const active: "dark" | "light" = mode === "light" ? "light" : "dark";
    setResolvedTheme(active);
    document.documentElement.setAttribute("data-mtheme", active);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("chatnexgenai.mtheme", newMode);
  };

  return (
    <MarketingThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </MarketingThemeContext.Provider>
  );
}

export function useMarketingTheme() {
  return useContext(MarketingThemeContext);
}
