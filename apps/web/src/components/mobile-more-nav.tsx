"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MORE_ITEMS = [
  { href: "/knowledge", label: "常识学习" },
  { href: "/computer", label: "计算机专项" },
  { href: "/practice/quick", label: "速算练习" },
  { href: "/mock-report", label: "模考解读" },
  { href: "/daily-tasks", label: "今日任务" },
  { href: "/pomodoro", label: "番茄钟" },
  { href: "/ledger", label: "记账本" },
  { href: "/stats", label: "统计看板" },
  { href: "/mistakes", label: "错题本" },
];

export default function MobileMoreNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeMenu = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isOpen]);

  return (
    <div className="mobile-more-nav" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="ghost button-link mobile-more-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="mobile-more-menu"
      >
        <span className="mobile-more-label">更多功能</span>
        <span className="mobile-more-arrow" aria-hidden="true">▼</span>
      </button>
      {isOpen ? (
        <div id="mobile-more-menu" className="dropdown-menu mobile-more-menu" role="menu">
          {MORE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
