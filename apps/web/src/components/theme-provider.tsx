"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "eyecare" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const PREF_KEY = "user_preferences";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "eyecare";
    }
    try {
      // 1. Try new JSON store
      const prefsString = localStorage.getItem(PREF_KEY);
      if (prefsString) {
        const prefs = JSON.parse(prefsString);
        if (["eyecare", "light", "dark"].includes(prefs.theme)) {
          return prefs.theme;
        }
      }

      // 2. Fallback to legacy key
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme === "eyecare" || savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    } catch {
      return "eyecare";
    }
    
    // 3. Fallback to HTML attribute (initialized by script)
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
      // Save to shared JSON object
      const current = localStorage.getItem(PREF_KEY);
      const prefs = current ? JSON.parse(current) : {};
      prefs.theme = theme;
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      document.cookie = `gogov_theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
      
      // Cleanup legacy
      localStorage.removeItem("theme");
    } catch {
      // Ignore storage errors
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
