"use client";

import { useEffect, useMemo, useState } from "react";

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

type LoadState = "idle" | "loading" | "ready" | "error";
type PasswordState = "idle" | "saving" | "success" | "error";

export default function PasswordPage() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordState, setPasswordState] = useState<PasswordState>("idle");

  useEffect(() => {
    const load = async () => {
      const token = window.localStorage.getItem(sessionKey);
      if (!token) {
        setMessage("请先登录后再修改密码。");
        setLoadState("error");
        return;
      }
      setLoadState("loading");
      setMessage(null);
      try {
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "无法获取用户信息");
        }
        setHasPassword(Boolean(data.user?.hasPassword));
        setLoadState("ready");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "无法获取用户信息");
        setLoadState("error");
      }
    };

    void load();
  }, []);

  const canUpdate = useMemo(() => {
    if (passwordState === "saving") {
      return false;
    }
    if (!oldPassword.trim()) {
      return false;
    }
    if (newPassword.length < 8) {
      return false;
    }
    if (newPassword !== confirmPassword) {
      return false;
    }
    return true;
  }, [oldPassword, newPassword, confirmPassword, passwordState]);

  const updatePassword = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setMessage("请先登录后再修改密码。");
      setPasswordState("error");
      return;
    }
    setPasswordState("saving");
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/auth/password/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "修改失败");
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordState("success");
      setMessage("密码已更新。");
    } catch (err) {
      setPasswordState("error");
      setMessage(err instanceof Error ? err.message : "修改失败");
    }
  };

  return (
    <main className="main register-page">
      <section className="login-hero">
        <div>
          <p className="eyebrow">账号安全</p>
          <h1>修改密码</h1>
          <p className="lead">请输入原始密码并设置新密码。</p>
        </div>
        <div className="login-status">
          {message ? (
            <div
              className={`status-card ${
                loadState === "error" || passwordState === "error"
                  ? "error"
                  : "success"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="register-grid">
        <div className="login-card register-panel">
          {loadState === "loading" ? (
            <div className="practice-loading">正在加载账号信息...</div>
          ) : loadState === "error" ? (
            <div className="practice-error">{message}</div>
          ) : !hasPassword ? (
            <div className="form-message">
              当前账号未设置密码（钱包登录用户）。
            </div>
          ) : (
            <>
              <div className="form-row">
                <label htmlFor="oldPassword">原始密码</label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="newPassword">新密码</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  placeholder="至少 8 位"
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="confirmPassword">确认新密码</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="primary"
                onClick={updatePassword}
                disabled={!canUpdate}
              >
                {passwordState === "saving" ? "提交中..." : "更新密码"}
              </button>
            </>
          )}
        </div>

        <aside className="login-aside">
          <div className="aside-card">
            <h3>密码建议</h3>
            <div className="aside-list">
              <div>✔ 至少 8 位长度</div>
              <div>✔ 避免与用户名相同</div>
              <div>✔ 定期更新更安全</div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
