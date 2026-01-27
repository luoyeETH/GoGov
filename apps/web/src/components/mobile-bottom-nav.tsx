"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    href: "/pomodoro",
    label: "番茄钟",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    href: "/daily-tasks",
    label: "任务",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  },
  {
    href: "/ai/assist",
    label: "AI",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    highlight: true
  },
  {
    href: "/practice/quick",
    label: "速算",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="12" y2="14" />
        <line x1="8" y1="18" x2="12" y2="18" />
      </svg>
    )
  },
  {
    href: "/profile",
    label: "我的",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const checkVisibility = () => {
      // 检查是否是移动端 PWA 模式
      const isMobile = window.innerWidth <= 768;
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      setIsVisible(isMobile && isStandalone);
    };

    checkVisibility();
    window.addEventListener("resize", checkVisibility);

    // 监听 display-mode 变化
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", checkVisibility);
    }

    return () => {
      window.removeEventListener("resize", checkVisibility);
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", checkVisibility);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && item.href !== "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? "active" : ""} ${item.highlight ? "highlight" : ""}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
