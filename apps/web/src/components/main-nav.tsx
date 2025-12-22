"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop Nav */}
      <nav className="nav desktop-nav">
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

      {/* Mobile Nav Trigger */}
      <div className="mobile-nav-container" ref={containerRef}>
        <button 
            type="button" 
            className={`mobile-nav-trigger ${isOpen ? "active" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
        >
            <span style={{ fontWeight: 600 }}>功能导航</span>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              className={`dropdown-arrow ${isOpen ? "open" : ""}`}
              style={{ transition: "transform 0.2s" }}
            >
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
        </button>
        
        {isOpen && (
            <div className="mobile-nav-menu">
                {NAV_ITEMS.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`mobile-nav-item ${pathname === item.href ? "active" : ""}`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
        )}
      </div>

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
        
        .mobile-nav-container {
            display: none;
            position: relative;
        }
        .mobile-nav-trigger {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--card);
            border: 1px solid var(--border);
            padding: 8px 16px;
            border-radius: 999px;
            font-size: var(--text-sm);
            color: var(--text);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .mobile-nav-trigger:hover, .mobile-nav-trigger.active {
            border-color: var(--brand);
            color: var(--brand-dark);
        }
        .dropdown-arrow.open {
            transform: rotate(180deg);
        }
        .mobile-nav-menu {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            background: var(--card);
            border-radius: 12px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
            padding: 6px;
            min-width: 160px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .mobile-nav-item {
            display: block;
            width: 100%;
            text-align: left;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: var(--text-sm);
            color: var(--text);
            text-decoration: none;
            transition: background 0.15s ease;
        }
        .mobile-nav-item:hover, .mobile-nav-item.active {
            background: var(--bg-accent);
            color: var(--brand-dark);
            font-weight: 600;
        }

        @media (max-width: 900px) {
            .desktop-nav {
                display: none;
            }
            .mobile-nav-container {
                display: block;
            }
        }
      `}</style>
    </>
  );
}
