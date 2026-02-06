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
      if (res.status === 401) {
        window.localStorage.removeItem(sessionKey);
        setStatus("anon");
        return;
      }
      if (!res.ok) {
        throw new Error("认证状态检查失败");
      }
      const data = await res.json();
      const user = (data.user ?? {}) as Profile;
      setLabel(
        user.username || user.email || user.walletAddress || "我的主页"
      );
      setStatus("authed");
    } catch (_err) {
      setStatus((prev) => (prev === "loading" ? "anon" : prev));
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
          className="nav-user-trigger nav-user-profile"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="nav-user-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.65-8 4.95V21h16v-2.05C20 15.65 15.3 14 12 14Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="nav-user-label">{label}</span>
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
