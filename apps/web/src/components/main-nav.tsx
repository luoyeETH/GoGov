"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/knowledge", label: "常识学习" },
  { href: "/practice/quick", label: "速算练习" },
  { href: "/mock-report", label: "模考解读" },
  { href: "/study-plan", label: "备考规划" },
  { href: "/kline", label: "上岸K线" },
  { href: "/daily-tasks", label: "今日任务" },
  { href: "/stats", label: "统计看板" },
  { href: "/mistakes", label: "错题本" },
  { href: "/ai/assist", label: "AI 答疑" },
];

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
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`nav-link ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/') ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <style jsx>{`
        .nav-link {
            color: inherit;
            text-decoration: none;
            font-weight: 600;
            white-space: nowrap;
        }
        .nav-link:hover, .nav-link.active {
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
