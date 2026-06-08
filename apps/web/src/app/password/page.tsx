"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordState, setPasswordState] = useState<PasswordState>("idle");

  const loadAccount = useCallback(async () => {
    const token = window.localStorage.getItem(sessionKey);
    setAuthReady(true);
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
  }, []);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const passwordIssues = useMemo(() => {
    const issues: string[] = [];
    if (!oldPassword.trim()) {
      issues.push("请输入原始密码。");
    }
    if (newPassword.length < 8) {
      issues.push("新密码至少需要 8 位。");
    }
    if (newPassword && !confirmPassword) {
      issues.push("请再次输入新密码。");
    } else if (confirmPassword && newPassword !== confirmPassword) {
      issues.push("两次输入的新密码不一致。");
    }
    if (oldPassword && newPassword && oldPassword === newPassword) {
      issues.push("新密码不能与原始密码相同。");
    }
    return issues;
  }, [oldPassword, newPassword, confirmPassword]);

  const passwordScore = useMemo(() => {
    if (!newPassword) {
      return 0;
    }
    const checks = [
      newPassword.length >= 8,
      /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      /\d/.test(newPassword),
      /[^A-Za-z0-9]/.test(newPassword)
    ];
    return checks.filter(Boolean).length;
  }, [newPassword]);

  const passwordStrengthLabel =
    passwordScore >= 4 ? "强" : passwordScore >= 2 ? "中" : newPassword ? "弱" : "未输入";
  const passwordStrengthTone =
    passwordScore >= 4 ? "strong" : passwordScore >= 2 ? "medium" : newPassword ? "weak" : "empty";

  const canUpdate = useMemo(() => {
    if (passwordState === "saving") {
      return false;
    }
    if (loadState !== "ready" || !hasPassword) {
      return false;
    }
    if (passwordIssues.length || !confirmPassword) {
      return false;
    }
    return true;
  }, [confirmPassword, hasPassword, loadState, passwordIssues.length, passwordState]);

  const passwordSummary = useMemo(
    () => [
      {
        label: "账号状态",
        value:
          loadState === "loading"
            ? "加载中"
            : loadState === "ready"
              ? "已登录"
              : authReady
                ? "需登录"
                : "检查中"
      },
      {
        label: "密码状态",
        value:
          loadState === "loading"
            ? "加载中"
            : hasPassword
              ? "已设置"
              : loadState === "ready"
                ? "未设置"
                : "未知"
      },
      { label: "新密码强度", value: passwordStrengthLabel },
      {
        label: "提交状态",
        value:
          passwordState === "saving"
            ? "提交中"
            : passwordState === "success"
              ? "已更新"
              : "待提交"
      }
    ],
    [authReady, hasPassword, loadState, passwordState, passwordStrengthLabel]
  );

  const updatePassword = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setAuthReady(true);
      setMessage("请先登录后再修改密码。");
      setPasswordState("error");
      return;
    }
    if (!canUpdate) {
      setMessage(passwordIssues[0] ?? "请先完成密码信息。");
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

      <section className="password-summary" aria-label="密码安全状态概览">
        {passwordSummary.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <section className="register-grid">
        <div className="login-card register-panel">
          {loadState === "loading" ? (
            <div className="password-skeleton" aria-label="正在加载账号信息">
              <span />
              <span />
              <span />
            </div>
          ) : loadState === "error" ? (
            <div className="password-state-card" role="alert">
              <strong>账号信息加载失败</strong>
              <span>{message ?? "请稍后重试。"}</span>
              <div className="password-state-actions">
                <Link href="/login" className="primary button-link">去登录</Link>
                <button type="button" className="ghost" onClick={() => void loadAccount()}>
                  重试
                </button>
              </div>
            </div>
          ) : !hasPassword ? (
            <div className="password-state-card">
              <strong>当前账号未设置密码</strong>
              <span>钱包登录用户暂不能通过此页修改密码，可在个人资料中维护账号信息。</span>
              <div className="password-state-actions">
                <Link href="/profile" className="ghost button-link">查看个人资料</Link>
              </div>
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
              <div className={`password-strength strength-${passwordStrengthTone}`}>
                <span>强度</span>
                <div className="password-strength-bars" aria-hidden="true">
                  {[1, 2, 3, 4].map((item) => (
                    <i key={item} className={passwordScore >= item ? "active" : ""} />
                  ))}
                </div>
                <strong>{passwordStrengthLabel}</strong>
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
              {oldPassword || newPassword || confirmPassword ? (
                <div className="password-issues" role="alert">
                  {passwordIssues.length ? (
                    passwordIssues.slice(0, 2).map((issue) => (
                      <span key={issue}>{issue}</span>
                    ))
                  ) : (
                    <span>密码信息已就绪。</span>
                  )}
                </div>
              ) : null}
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
              <div><span className="aside-list-dot success" />至少 8 位长度</div>
              <div><span className="aside-list-dot success" />避免与用户名相同</div>
              <div><span className="aside-list-dot success" />定期更新更安全</div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
