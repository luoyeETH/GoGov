"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Apple SF Symbols style icons - thinner strokes, refined shapes
const NAV_ITEMS = [
  {
    href: "/pomodoro",
    label: "专注",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" strokeWidth="1.5" stroke="currentColor" />
        <path d="M12 7v5l3 2" strokeWidth="1.5" stroke="currentColor" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" opacity="0.15" />
        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M12 7v5l3 2" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
      </svg>
    )
  },
  {
    href: "/daily-tasks",
    label: "任务",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="3" strokeWidth="1.5" stroke="currentColor" />
        <path d="M9 12l2 2 4-4" strokeWidth="1.5" stroke="currentColor" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="3" opacity="0.15" />
        <rect x="4" y="4" width="16" height="16" rx="3" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M9 12l2 2 4-4" strokeWidth="2" stroke="currentColor" fill="none" />
      </svg>
    )
  },
  {
    href: "/chat",
    label: "AI",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3C7.03 3 3 6.58 3 11c0 2.12.94 4.04 2.47 5.44L4 21l4.89-2.12c.97.32 2.02.5 3.11.5 4.97 0 9-3.58 9-8s-4.03-8-9-8z" strokeWidth="1.5" stroke="currentColor" />
        <circle cx="8.5" cy="11" r="1" fill="currentColor" />
        <circle cx="12" cy="11" r="1" fill="currentColor" />
        <circle cx="15.5" cy="11" r="1" fill="currentColor" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C7.03 3 3 6.58 3 11c0 2.12.94 4.04 2.47 5.44L4 21l4.89-2.12c.97.32 2.02.5 3.11.5 4.97 0 9-3.58 9-8s-4.03-8-9-8z" opacity="0.15" />
        <path d="M12 3C7.03 3 3 6.58 3 11c0 2.12.94 4.04 2.47 5.44L4 21l4.89-2.12c.97.32 2.02.5 3.11.5 4.97 0 9-3.58 9-8s-4.03-8-9-8z" fill="none" strokeWidth="2" stroke="currentColor" />
        <circle cx="8.5" cy="11" r="1.2" />
        <circle cx="12" cy="11" r="1.2" />
        <circle cx="15.5" cy="11" r="1.2" />
      </svg>
    ),
    highlight: true
  },
  {
    href: "/practice/quick",
    label: "速算",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth="1.5" stroke="currentColor" />
        <line x1="9" y1="7" x2="15" y2="7" strokeWidth="1.5" stroke="currentColor" />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
        <circle cx="9" cy="16" r="1" fill="currentColor" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
        <circle cx="15" cy="16" r="1" fill="currentColor" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="5" y="3" width="14" height="18" rx="2" opacity="0.15" />
        <rect x="5" y="3" width="14" height="18" rx="2" fill="none" strokeWidth="2" stroke="currentColor" />
        <line x1="9" y1="7" x2="15" y2="7" strokeWidth="2" stroke="currentColor" />
        <circle cx="9" cy="12" r="1.2" />
        <circle cx="15" cy="12" r="1.2" />
        <circle cx="9" cy="16" r="1.2" />
        <circle cx="12" cy="16" r="1.2" />
        <circle cx="15" cy="16" r="1.2" />
      </svg>
    )
  },
  {
    href: "/profile",
    label: "我的",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" strokeWidth="1.5" stroke="currentColor" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeWidth="1.5" stroke="currentColor" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="8" r="4" opacity="0.15" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" opacity="0.15" />
        <circle cx="12" cy="8" r="4" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" strokeWidth="2" stroke="currentColor" />
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
            <span className="mobile-nav-icon">
              {isActive && item.activeIcon ? item.activeIcon : item.icon}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
