"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

type FreeAiStatus = {
  enabled: boolean;
  usingFree: boolean;
  dailyLimit: number | null;
  usedToday: number | null;
  remaining: number | null;
};

type ProfileData = {
  email: string | null;
  walletAddress: string | null;
  username: string;
  gender: string;
  age: string;
  examStartDate: string;
  aiProvider: string | null;
  aiModel: string | null;
  aiBaseUrl: string | null;
  aiApiKeyConfigured: boolean;
  hasPassword: boolean;
  freeAi: FreeAiStatus | null;
};

function isValidUsername(value: string) {
  const trimmed = value.trim();
  if (/\s/.test(trimmed)) {
    return false;
  }
  return trimmed.length >= 2 && trimmed.length <= 10;
}

function maskKey(value: string) {
  if (!value) {
    return "";
  }
  if (value.length <= 6) {
    return `${value.slice(0, 1)}****`;
  }
  const head = value.slice(0, 4);
  const tail = value.slice(-4);
  return `${head}****${tail}`;
}

export default function ProfilePage() {
  const [state, setState] = useState<ProfileState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [aiApiKeyInput, setAiApiKeyInput] = useState("");
  const [clearAiKey, setClearAiKey] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [aiModelsState, setAiModelsState] = useState<ProfileState>("idle");
  const [aiModelsMessage, setAiModelsMessage] = useState<string | null>(null);
  const lastModelConfigRef = useRef<{ provider: string | null; baseUrl: string | null } | null>(null);

  const canSave = useMemo(() => {
    if (state === "saving") {
      return false;
    }
    if (!draft || !isValidUsername(draft.username.trim())) {
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
          examStartDate: data.user.examStartDate ?? "",
          aiProvider: data.user.aiProvider ?? null,
          aiModel: data.user.aiModel ?? null,
          aiBaseUrl: data.user.aiBaseUrl ?? null,
          aiApiKeyConfigured: Boolean(data.user.aiApiKeyConfigured),
          hasPassword: Boolean(data.user.hasPassword),
          freeAi: data.user.freeAi ?? null
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

  useEffect(() => {
    if (!editMode || !draft) {
      return;
    }
    const current = {
      provider: draft.aiProvider ?? null,
      baseUrl: draft.aiBaseUrl ?? null
    };
    const prev = lastModelConfigRef.current;
    if (!prev) {
      lastModelConfigRef.current = current;
      return;
    }
    if (prev.provider !== current.provider || prev.baseUrl !== current.baseUrl) {
      lastModelConfigRef.current = current;
      if (aiModels.length > 0) {
        setAiModels([]);
      }
      setAiModelsState("idle");
      setAiModelsMessage(null);
      if (draft.aiModel) {
        setDraft({ ...draft, aiModel: "" });
      }
    }
  }, [editMode, draft?.aiProvider, draft?.aiBaseUrl]);

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
      const aiApiKey =
        clearAiKey ? "" : aiApiKeyInput.trim() ? aiApiKeyInput.trim() : undefined;
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
          examStartDate: draft.examStartDate || undefined,
          aiProvider: draft.aiProvider ?? undefined,
          aiModel: draft.aiModel ?? undefined,
          aiBaseUrl: draft.aiBaseUrl ?? undefined,
          aiApiKey
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
        examStartDate: data.user.examStartDate ?? "",
        aiProvider: data.user.aiProvider ?? null,
        aiModel: data.user.aiModel ?? null,
        aiBaseUrl: data.user.aiBaseUrl ?? null,
        aiApiKeyConfigured: Boolean(data.user.aiApiKeyConfigured),
        hasPassword: Boolean(data.user.hasPassword),
        freeAi: data.user.freeAi ?? null
      };
      setProfile(updated);
      setDraft(updated);
      setAiApiKeyInput("");
      setClearAiKey(false);
      setShowAiKey(false);
      setEditMode(false);
      setAiModels([]);
      setAiModelsState("idle");
      setAiModelsMessage(null);
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

  const aiConfigured = Boolean(
    profile &&
      profile.aiProvider &&
      profile.aiProvider !== "none" &&
      profile.aiModel &&
      profile.aiApiKeyConfigured
  );

  const aiProviderLabel =
    profile?.aiProvider === "openai" ? "OpenAI" : profile?.aiProvider;

  const freeAiRemainingLabel =
    profile?.freeAi?.enabled &&
    typeof profile.freeAi.remaining === "number" &&
    typeof profile.freeAi.dailyLimit === "number"
      ? `${profile.freeAi.remaining}/${profile.freeAi.dailyLimit} 次`
      : profile?.freeAi?.enabled
        ? "今日额度暂无数据"
        : null;

  return (
    <main className="main register-page">
      <section className="login-hero app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">个人资料</p>
          <h1 className="app-page-title">完善你的公考画像</h1>
          <p className="lead app-page-subtitle">首次登录建议补充基础信息。</p>
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
                        setAiApiKeyInput("");
                        setClearAiKey(false);
                        setAiModels([]);
                        setAiModelsState("idle");
                        setAiModelsMessage(null);
                        setShowAiKey(false);
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
                    onClick={() => {
                      setDraft({
                        ...profile,
                        aiProvider: profile.aiProvider ?? "openai"
                      });
                      setAiModels([]);
                      setAiModelsState("idle");
                      setAiModelsMessage(null);
                      setShowAiKey(false);
                      setEditMode(true);
                    }}
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
                      placeholder="2-10 位字符"
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
                  <div className="profile-section">
                    <h4>AI 配置</h4>
                    <div className="form-row">
                      <label htmlFor="aiProvider">节点提供商</label>
                      <select
                        id="aiProvider"
                        value={draft.aiProvider ?? "openai"}
                        onChange={(event) =>
                          setDraft({ ...draft, aiProvider: event.target.value })
                        }
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="custom">自定义</option>
                        <option value="none">暂不配置</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label htmlFor="aiBaseUrl">节点地址</label>
                      <input
                        id="aiBaseUrl"
                        value={draft.aiBaseUrl ?? ""}
                        placeholder="可选，例如 https://api.openai.com"
                        onChange={(event) =>
                          setDraft({ ...draft, aiBaseUrl: event.target.value })
                        }
                      />
                    </div>
                    <div className="form-row">
                      <label htmlFor="aiKey">API Key</label>
                      <div className="key-input-row">
                        <input
                          id="aiKey"
                          type="text"
                          value={showAiKey ? aiApiKeyInput : maskKey(aiApiKeyInput)}
                          placeholder={
                            draft.aiApiKeyConfigured
                              ? "已配置，输入新 Key 将替换"
                              : "请输入 key"
                          }
                          readOnly={!showAiKey}
                          onFocus={() => setShowAiKey(true)}
                          onChange={(event) => {
                            setAiApiKeyInput(event.target.value);
                            setClearAiKey(false);
                          }}
                        />
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => setShowAiKey((value) => !value)}
                        >
                          {showAiKey ? "隐藏" : "显示"}
                        </button>
                      </div>
                    </div>
                    <p className="form-message key-hint">
                      {aiApiKeyInput.trim()
                        ? "将使用当前输入的 Key 获取模型。"
                        : draft.aiApiKeyConfigured
                          ? "将使用已保存的 Key 获取模型。"
                          : "请先输入 Key 再获取模型。"}
                    </p>
                    <button
                      type="button"
                      className="ghost"
                      onClick={async () => {
                        if (!draft) {
                          return;
                        }
                        const token = window.localStorage.getItem(sessionKey);
                        if (!token) {
                          setAiModelsMessage("请先登录后再获取模型。");
                          return;
                        }
                        setAiModelsState("loading");
                        setAiModelsMessage(null);
                        try {
                          const payload: Record<string, string> = {
                            provider: draft.aiProvider ?? "openai"
                          };
                          if (draft.aiBaseUrl) {
                            payload.baseUrl = draft.aiBaseUrl;
                          }
                          if (aiApiKeyInput.trim()) {
                            payload.apiKey = aiApiKeyInput.trim();
                          }
                          const res = await fetch(`${apiBase}/ai/models`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            throw new Error(data?.error ?? "获取模型失败");
                          }
                          setAiModels(data.models ?? []);
                          setAiModelsState("success");
                        } catch (err) {
                          setAiModelsState("error");
                          setAiModelsMessage(
                            err instanceof Error ? err.message : "获取模型失败"
                          );
                        }
                      }}
                    >
                      {aiModelsState === "loading" ? "加载中..." : "获取模型列表"}
                    </button>
                    {aiModelsMessage ? (
                      <p className="form-message">{aiModelsMessage}</p>
                    ) : null}
                    <div className="form-row">
                      <label htmlFor="aiModel">模型名称</label>
                      <select
                        id="aiModel"
                        value={draft.aiModel ?? ""}
                        onChange={(event) =>
                          setDraft({ ...draft, aiModel: event.target.value })
                        }
                        disabled={aiModels.length === 0 && !draft.aiModel}
                      >
                        {aiModels.length === 0 ? (
                          <>
                            {draft.aiModel ? (
                              <option value={draft.aiModel}>
                                当前：{draft.aiModel}
                              </option>
                            ) : (
                              <option value="" disabled>
                                请先获取模型列表
                              </option>
                            )}
                          </>
                        ) : (
                          <>
                            <option value="" disabled>
                              请选择模型
                            </option>
                            {aiModels.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                    {draft.aiApiKeyConfigured ? (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          setAiApiKeyInput("");
                          setClearAiKey(true);
                        }}
                      >
                        清空已配置 Key
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="profile-summary profile-summary-brief">
                  <div className="profile-summary-item">
                    <span>用户名</span>
                    <strong>{profile.username || "未设置"}</strong>
                  </div>
                  <div className="profile-summary-item">
                    <span>邮箱</span>
                    <strong>{profile.email || "未设置"}</strong>
                  </div>
                  <div className="profile-summary-item">
                    <span>备考开始</span>
                    <strong>{profile.examStartDate || "未设置"}</strong>
                  </div>
                  <div className="profile-summary-item profile-summary-ai">
                    <span>导师 AI</span>
                    <strong>
                      {aiConfigured
                        ? "已配置"
                        : profile.freeAi?.enabled
                          ? "免费通道"
                          : "未配置"}
                    </strong>
                    {aiConfigured ? (
                      <small>
                        {(aiProviderLabel ?? "自定义提供商")} · {profile.aiModel}
                      </small>
                    ) : profile.freeAi?.enabled ? (
                      <small>{freeAiRemainingLabel ?? "今日额度暂无数据"}</small>
                    ) : (
                      <small>点击编辑完成模型配置</small>
                    )}
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

      {/* 更多功能 - PWA 模式下显示 */}
      <section className="profile-more-features">
        <Link href="/profile/more" className="profile-more-entry" aria-label="打开更多功能">
          <div className="profile-more-entry-text">
            <strong>更多功能</strong>
            <span>进入工具与服务</span>
          </div>
          <svg
            className="profile-more-entry-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </Link>
      </section>
    </main>
  );
}
