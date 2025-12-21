"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "eyecare" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "eyecare";
    }
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme === "eyecare" || savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    } catch {
      return "eyecare";
    }
    const attrTheme = window.document.documentElement.getAttribute("data-theme") as
      | Theme
      | null;
    if (attrTheme === "eyecare" || attrTheme === "light" || attrTheme === "dark") {
      return attrTheme;
    }
    return "eyecare";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Ignore storage errors (private mode, quota, etc.).
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
