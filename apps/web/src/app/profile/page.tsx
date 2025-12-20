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

type ProfileState = "idle" | "loading" | "saving" | "success" | "error";

type ProfileData = {
  email: string | null;
  walletAddress: string | null;
  username: string;
  gender: string;
  age: string;
  examStartDate: string;
};

export default function ProfilePage() {
  const [state, setState] = useState<ProfileState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);

  const canSave = useMemo(() => {
    if (state === "saving") {
      return false;
    }
    if (!draft || draft.username.trim().length < 3) {
      return false;
    }
    return true;
  }, [state, draft]);

  useEffect(() => {
    const load = async () => {
      const token = window.localStorage.getItem(sessionKey);
      if (!token) {
        setMessage("请先登录后再完善资料。");
        setState("error");
        return;
      }
      setState("loading");
      try {
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "无法获取用户信息");
        }
        const loaded: ProfileData = {
          email: data.user.email ?? null,
          walletAddress: data.user.walletAddress ?? null,
          username: data.user.username ?? "",
          gender: data.user.gender ?? "hidden",
          age: data.user.age ? String(data.user.age) : "",
          examStartDate: data.user.examStartDate ?? ""
        };
        setProfile(loaded);
        setDraft(loaded);
        setState("idle");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "无法获取用户信息");
        setState("error");
      }
    };

    void load();
  }, []);

  const save = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setMessage("请先登录后再完善资料。");
      setState("error");
      return;
    }
    if (!draft) {
      return;
    }
    setState("saving");
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: draft.username.trim(),
          gender: draft.gender,
          age: draft.age ? Number(draft.age) : undefined,
          examStartDate: draft.examStartDate || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "保存失败");
      }
      const updated: ProfileData = {
        email: data.user.email ?? null,
        walletAddress: data.user.walletAddress ?? null,
        username: data.user.username ?? "",
        gender: data.user.gender ?? "hidden",
        age: data.user.age ? String(data.user.age) : "",
        examStartDate: data.user.examStartDate ?? ""
      };
      setProfile(updated);
      setDraft(updated);
      setEditMode(false);
      setState("success");
      setMessage("资料已保存，正在跳转首页...");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "保存失败");
    }
  };

  return (
    <main className="main register-page">
      <section className="login-hero">
        <div>
          <p className="eyebrow">个人资料</p>
          <h1>完善你的公考画像</h1>
          <p className="lead">首次登录建议补充基础信息。</p>
        </div>
        <div className="login-status">
          {message ? (
            <div
              className={`status-card ${
                state === "error" ? "error" : "success"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="profile-grid">
        <div className="login-card register-panel">
          {state === "loading" ? (
            <div className="practice-loading">正在加载资料...</div>
          ) : profile && draft ? (
            <>
              <div className="profile-header">
                <h3>个人资料</h3>
                {editMode ? (
                  <div className="profile-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setDraft(profile);
                        setEditMode(false);
                      }}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={save}
                      disabled={!canSave}
                    >
                      {state === "saving" ? "保存中..." : "保存资料"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setEditMode(true)}
                  >
                    编辑资料
                  </button>
                )}
              </div>

              {editMode ? (
                <>
                  <div className="form-row">
                    <label>邮箱</label>
                    <input value={draft.email ?? ""} disabled />
                  </div>
                  {draft.walletAddress ? (
                    <div className="form-row">
                      <label>钱包地址</label>
                      <input value={draft.walletAddress ?? ""} disabled />
                    </div>
                  ) : null}
                  <div className="form-row">
                    <label htmlFor="username">用户名</label>
                    <input
                      id="username"
                      value={draft.username}
                      placeholder="3-20 位字母/数字/下划线"
                      onChange={(event) =>
                        setDraft({ ...draft, username: event.target.value })
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="gender">性别</label>
                    <select
                      id="gender"
                      value={draft.gender}
                      onChange={(event) =>
                        setDraft({ ...draft, gender: event.target.value })
                      }
                    >
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="hidden">隐藏</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label htmlFor="age">年龄</label>
                    <input
                      id="age"
                      type="number"
                      min={0}
                      max={120}
                      value={draft.age}
                      placeholder="可选"
                      onChange={(event) =>
                        setDraft({ ...draft, age: event.target.value })
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="examStart">备考开始时间</label>
                    <input
                      id="examStart"
                      type="date"
                      value={draft.examStartDate}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          examStartDate: event.target.value
                        })
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="profile-summary">
                  {profile.email ? (
                    <div>
                      <span>邮箱</span>
                      <strong>{profile.email}</strong>
                    </div>
                  ) : null}
                  {profile.walletAddress ? (
                    <div>
                      <span>钱包</span>
                      <strong>{profile.walletAddress}</strong>
                    </div>
                  ) : null}
                  <div>
                    <span>用户名</span>
                    <strong>{profile.username || "未设置"}</strong>
                  </div>
                  <div>
                    <span>性别</span>
                    <strong>
                      {profile.gender === "male"
                        ? "男"
                        : profile.gender === "female"
                          ? "女"
                          : "隐藏"}
                    </strong>
                  </div>
                  <div>
                    <span>年龄</span>
                    <strong>{profile.age || "未设置"}</strong>
                  </div>
                  <div>
                    <span>备考开始</span>
                    <strong>{profile.examStartDate || "未设置"}</strong>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <aside className="login-aside">
          <div className="aside-card">
            <h3>资料将用于</h3>
            <div className="aside-list">
              <div>✔ 个性化学习计划</div>
              <div>✔ 练习节奏推荐</div>
              <div>✔ AI 提示与纠错</div>
            </div>
          </div>
          <div className="aside-card card-disabled" title="正在开发中">
            <h3>历史练习记录</h3>
            <p>即将支持练习曲线、错题回溯与答题统计。</p>
            <div className="aside-list">
              <div>• 最近训练趋势</div>
              <div>• 错题复盘清单</div>
              <div>• 练习时间统计</div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
