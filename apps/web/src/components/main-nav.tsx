"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

type NavItem = {
  href: string;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "学习",
    items: [
      { href: "/knowledge", label: "常识学习" },
      { href: "/computer", label: "计算机专项" },
      { href: "/practice/quick", label: "速算练习" },
      { href: "/interview", label: "AI 面试教练" },
    ],
  },
  {
    label: "规划",
    items: [
      { href: "/study-plan", label: "备考规划" },
      { href: "/daily-tasks", label: "今日任务" },
    ],
  },
  {
    label: "复盘",
    items: [
      { href: "/stats", label: "统计看板" },
      { href: "/mistakes", label: "错题本" },
      { href: "/mock-report", label: "模考解读" },
      { href: "/leaderboard", label: "学习排行榜" },
    ],
  },
  {
    label: "工具",
    items: [
      { href: "/ai/assist", label: "AI 答疑" },
      { href: "/pomodoro", label: "番茄钟" },
      { href: "/kline", label: "上岸K线" },
      { href: "/ledger", label: "记账本" },
    ],
  },
];

function NavDropdown({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = group.items.some(
    (item) =>
      pathname === item.href ||
      (pathname.startsWith(item.href) && item.href !== "/")
  );

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="nav-dropdown"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`nav-dropdown-trigger ${isActive ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {group.label}
        <svg
          className={`nav-dropdown-arrow ${isOpen ? "is-open" : ""}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="nav-dropdown-menu">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-dropdown-item ${
                pathname === item.href ||
                (pathname.startsWith(item.href) && item.href !== "/")
                  ? "active"
                  : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MainNav() {
  const pathname = usePathname();
  const [showDesktopNav, setShowDesktopNav] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(min-width: 901px)");
    const update = () => setShowDesktopNav(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return (
    <>
      {/* Desktop Nav */}
      <nav
        className="nav desktop-nav"
        aria-hidden={!showDesktopNav}
        style={{ display: showDesktopNav ? "flex" : "none" }}
      >
        {NAV_GROUPS.map((group) => (
          <NavDropdown key={group.label} group={group} pathname={pathname} />
        ))}
      </nav>

      <style jsx>{`
        .nav-link {
          color: inherit;
          text-decoration: none;
          font-weight: 600;
          white-space: nowrap;
        }
        .nav-link:hover,
        .nav-link.active {
          color: var(--brand-dark);
        }

        @media (max-width: 900px) {
          .desktop-nav {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
