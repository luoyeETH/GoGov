"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const apiBase = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window === "undefined") {
    return "http://localhost:3031";
  }
  const hostname = window.location.hostname.replace(/^www\./, "");
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3031";
  }
  return `https://api.${hostname}`;
})();

const sessionKey = "gogov_session_token";

type Status = "loading" | "anon" | "authed";

type Profile = {
  username?: string | null;
  email?: string | null;
  walletAddress?: string | null;
};

export default function NavUser() {
  const [status, setStatus] = useState<Status>("anon");
  const [label, setLabel] = useState("我的主页");
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const checkAuth = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setStatus("anon");
      return;
    }
    
    setStatus("loading");
    
    try {
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("未登录");
      }
      const data = await res.json();
      const user = (data.user ?? {}) as Profile;
      setLabel(
        user.username || user.email || user.walletAddress || "我的主页"
      );
      setStatus("authed");
    } catch (_err) {
      window.localStorage.removeItem(sessionKey);
      setStatus("anon");
    }
  };

  useEffect(() => {
    void checkAuth();
    
    const handleAuthChange = () => {
      void checkAuth();
    };
    
    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [pathname]);

  useEffect(() => {
    const closeMenu = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isOpen]);

  if (status === "loading") {
    return <span className="nav-user nav-loading">...</span>;
  }

  if (status === "authed") {
    const logout = async () => {
      const token = window.localStorage.getItem(sessionKey);
      try {
        if (token) {
          await fetch(`${apiBase}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } finally {
        window.localStorage.removeItem(sessionKey);
        setStatus("anon");
        setLabel("我的主页");
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/";
      }
    };

    return (
      <div className="nav-user-dropdown" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="nav-user-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          {label}
          <span className="dropdown-arrow">▼</span>
        </button>
        {isOpen && (
          <div className="dropdown-menu">
            <Link href="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
              我的主页
            </Link>
            <Link href="/password" className="dropdown-item" onClick={() => setIsOpen(false)}>
              修改密码
            </Link>
            <div className="dropdown-divider" />
            <button
              type="button"
              className="dropdown-item danger"
              onClick={logout}
            >
              退出登录
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href="/login" className="nav-user nav-login">
      登录
    </Link>
  );
}
