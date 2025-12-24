"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FontSize = "default" | "large" | "extra-large";

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const PREF_KEY = "user_preferences";

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === "undefined") {
      return "default";
    }
    try {
      // 1. Try new JSON store
      const prefsString = localStorage.getItem(PREF_KEY);
      if (prefsString) {
        const prefs = JSON.parse(prefsString);
        if (["default", "large", "extra-large"].includes(prefs.fontSize)) {
          return prefs.fontSize;
        }
      }

      // 2. Fallback to legacy key
      const savedFontSize = localStorage.getItem("fontSize") as FontSize | null;
      if (savedFontSize === "default" || savedFontSize === "large" || savedFontSize === "extra-large") {
        return savedFontSize;
      }
    } catch {
      return "default";
    }
    
    // 3. Fallback to HTML attribute
    const attrFontSize = window.document.documentElement.getAttribute("data-font-size") as
      | FontSize
      | null;
    if (attrFontSize === "default" || attrFontSize === "large" || attrFontSize === "extra-large") {
      return attrFontSize;
    }
    return "default";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    try {
      // Save to shared JSON object
      const current = localStorage.getItem(PREF_KEY);
      const prefs = current ? JSON.parse(current) : {};
      prefs.fontSize = fontSize;
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      document.cookie = `gogov_font_size=${fontSize}; Path=/; Max-Age=31536000; SameSite=Lax`;
      
      // Cleanup legacy
      localStorage.removeItem("fontSize");
    } catch {
      // Ignore storage errors
    }
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
}
