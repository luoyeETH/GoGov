"use client";

import { useEffect, useState } from "react";
import { Theme, useTheme } from "./theme-provider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const closeMenu = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isOpen]);

  const labels: Record<Theme, string> = {
    eyecare: "护眼模式",
    light: "亮色模式",
    dark: "暗色模式",
  };

  const icons: Record<Theme, React.ReactNode> = {
    eyecare: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    light: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    dark: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  };

  return (
    <div className="nav-user-dropdown nav-control" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="nav-user-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="切换主题"
        title="切换主题"
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icons[theme]}
          <span className="theme-label-text">{labels[theme]}</span>
        </span>
        <span className="dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {(Object.keys(labels) as Theme[]).map((t) => (
            <button
              key={t}
              className={`dropdown-item ${theme === t ? "active" : ""}`}
              onClick={() => {
                setTheme(t);
                setIsOpen(false);
              }}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {icons[t]}
              {labels[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
