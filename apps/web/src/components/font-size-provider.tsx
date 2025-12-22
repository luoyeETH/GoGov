"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FontSize = "default" | "large" | "extra-large";

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === "undefined") {
      return "default";
    }
    try {
      const savedFontSize = localStorage.getItem("fontSize") as FontSize | null;
      if (savedFontSize === "default" || savedFontSize === "large" || savedFontSize === "extra-large") {
        return savedFontSize;
      }
    } catch {
      return "default";
    }
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
      localStorage.setItem("fontSize", fontSize);
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
