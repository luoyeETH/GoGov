"use client";

import Link from "next/link";
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

  useEffect(() => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      // Already anon
      return;
    }
    
    // Found token, set to loading then fetch
    setStatus("loading");
    
    const load = async () => {
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

    void load();
  }, []);

  if (status === "loading") {
    return <span className="nav-user nav-loading">...</span>;
  }

  if (status === "authed") {
    return (
      <Link href="/profile" className="nav-user nav-profile">
        {label}
      </Link>
    );
  }

  return (
    <Link href="/login" className="nav-user nav-login">
      登录
    </Link>
  );
}
