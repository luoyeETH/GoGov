"use client";

import { useEffect, useState } from "react";
import { FontSize, useFontSize } from "./font-size-provider";

export default function FontSizeSwitcher() {
  const { fontSize, setFontSize } = useFontSize();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering user preference after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const closeMenu = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isOpen]);

  const labels: Record<FontSize, string> = {
    default: "默认字体",
    large: "中号字体",
    "extra-large": "大号字体",
  };

  const icons: Record<FontSize, React.ReactNode> = {
    default: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    large: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    "extra-large": (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  };

  const currentFontSize = mounted ? fontSize : "default";

  return (
    <div className="nav-user-dropdown" onClick={(e) => e.stopPropagation()} style={{ marginRight: 16 }}>
      <button
        type="button"
        className="nav-user-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="切换字体大小"
        title="切换字体大小"
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
          <span className="font-size-label-text">{labels[currentFontSize]}</span>
        </span>
        <span className="dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {(Object.keys(labels) as FontSize[]).map((t) => (
            <button
              key={t}
              className={`dropdown-item ${currentFontSize === t ? "active" : ""}`}
              onClick={() => {
                setFontSize(t);
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
      <style jsx>{`
        .font-size-label-text {
          font-size: 13px;
        }
        @media (max-width: 600px) {
          .font-size-label-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
