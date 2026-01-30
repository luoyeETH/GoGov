"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import LoadingButton from "../../../components/loading-button";

type PromptField = {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

type PromptScenario = {
  id: string;
  label: string;
  description: string;
  fields: PromptField[];
  output: string[];
};

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

type ScenarioValues = Record<string, Record<string, string>>;

type HistoryItem = {
  id: string;
  scenarioId: string;
  question: string;
  answer: string;
  model: string | null;
  createdAt: string;
};

type LoadState = "idle" | "loading" | "error";
type RequestState = "idle" | "loading" | "error";

export default function AiAssistPage() {
  const [scenarios, setScenarios] = useState<PromptScenario[]>([]);
  const [activeId, setActiveId] = useState("");
  const [values, setValues] = useState<ScenarioValues>({});
  const [questions, setQuestions] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyState, setHistoryState] = useState<LoadState>("idle");
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryItem | null>(null);
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const scenario = useMemo(() => {
    return scenarios.find((item) => item.id === activeId) ?? scenarios[0];
  }, [activeId, scenarios]);

  const scenarioValues = values[scenario?.id] ?? {};
  const questionValue = questions[scenario?.id] ?? "";

  const scenarioLabels = useMemo(() => {
    return new Map(scenarios.map((item) => [item.id, item.label]));
  }, [scenarios]);

  const loadScenarios = async () => {
    try {
      const res = await fetch(`${apiBase}/ai/assist/scenarios`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.scenarios)) {
        setScenarios(data.scenarios);
        if (data.scenarios.length > 0 && !activeId) {
          setActiveId(data.scenarios[0].id);
        }
        // 初始化 values 和 questions
        const initialValues: ScenarioValues = {};
        const initialQuestions: Record<string, string> = {};
        data.scenarios.forEach((s: PromptScenario) => {
          initialValues[s.id] = {};
          initialQuestions[s.id] = "";
        });
        setValues(initialValues);
        setQuestions(initialQuestions);
      }
    } catch (err) {
      console.error("Failed to load scenarios:", err);
    }
  };

  const loadHistory = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistoryState("error");
      setHistoryMessage("请先登录后查看历史记录。");
      return;
    }
    setHistoryState("loading");
    setHistoryMessage(null);
    try {
      const res = await fetch(`${apiBase}/ai/assist/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "加载历史失败");
      }
      setHistory(data.history ?? []);
      setHistoryState("idle");
    } catch (err) {
      setHistoryState("error");
      setHistoryMessage(err instanceof Error ? err.message : "加载历史失败");
    }
  };

  useEffect(() => {
    void loadScenarios();
    void loadHistory();
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      void loadHistory();
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    if (!scenario) return;
    setValues((prev) => ({
      ...prev,
      [scenario.id]: { ...prev[scenario.id], [key]: value }
    }));
    if (requestMessage) {
      setRequestMessage(null);
      setRequestState("idle");
    }
  };

  const handleQuestionChange = (value: string) => {
    if (!scenario) return;
    setQuestions((prev) => ({ ...prev, [scenario.id]: value }));
    if (requestMessage) {
      setRequestMessage(null);
      setRequestState("idle");
    }
  };

  const handleClear = () => {
    if (!scenario) return;
    setValues((prev) => ({ ...prev, [scenario.id]: {} }));
    setQuestions((prev) => ({ ...prev, [scenario.id]: "" }));
    setAnswer((prev) => {
      const next = { ...prev };
      delete next[scenario.id];
      return next;
    });
    setActiveHistory(null);
    setRequestMessage(null);
  };

  const handleGenerate = async () => {
    if (requestState === "loading" || !scenario) {
      return;
    }
    const hasInput =
      questionValue.trim().length > 0 ||
      scenario.fields.some((field) => scenarioValues[field.key]?.trim());
    if (!hasInput) {
      setRequestMessage("请先填写问题或补充关键信息。");
      setRequestState("error");
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setRequestMessage("请先登录后再使用 AI 答疑。");
      setRequestState("error");
      return;
    }
    setRequestState("loading");
    setRequestMessage(null);
    try {
      const res = await fetch(`${apiBase}/ai/assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scenarioId: scenario.id,
          fields: scenarioValues,
          question: questionValue
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "答疑失败");
      }
      if (data.answer) {
        setAnswer((prev) => ({ ...prev, [scenario.id]: data.answer as string }));
      }
      if (data.history) {
        setHistory((prev) => [data.history as HistoryItem, ...prev]);
        setActiveHistory(data.history as HistoryItem);
      }
      setRequestState("idle");
    } catch (err) {
      setRequestState("error");
      setRequestMessage(err instanceof Error ? err.message : "答疑失败");
    }
  };

  const displayAnswer = activeHistory?.answer ?? (scenario ? answer[scenario.id] : "");

  if (scenarios.length === 0 || !scenario) {
    return (
      <main className="main assist-page">
        <section className="login-hero app-page-header">
          <div className="app-page-header-main">
            <p className="eyebrow">AI 答疑</p>
            <h1 className="app-page-title">加载中...</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="main assist-page">
      <section className="login-hero app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">AI 答疑</p>
          <h1 className="app-page-title">一套提示词，覆盖公考核心问题</h1>
          <p className="lead app-page-subtitle">
            使用你已配置的模型，直接获得真实答复。支持岗位选择、学习路径、题目解析与计划生成。
          </p>
        </div>
      </section>

      <section className="assist-grid">
        <div className="assist-panel">
          <div className="assist-card">
            <h3>场景选择</h3>
            <div className="scenario-list">
              {scenarios.map((item) => {
                const active = item.id === scenario.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`scenario-card ${active ? "active" : ""}`}
                    onClick={() => {
                      setActiveId(item.id);
                      setActiveHistory(null);
                    }}
                  >
                    <div className="scenario-title">{item.label}</div>
                    <p>{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="assist-card">
            <div className="assist-card-header">
              <h3>历史记录</h3>
              <button type="button" className="ghost" onClick={loadHistory}>
                刷新
              </button>
            </div>
            {historyState === "loading" ? (
              <p className="form-message">正在加载...</p>
            ) : history.length === 0 ? (
              <p className="form-message">
                {historyMessage ?? "暂无答疑记录。"}
              </p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`history-item ${
                      activeHistory?.id === item.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveId(item.scenarioId);
                      setActiveHistory(item);
                    }}
                  >
                    <div className="history-title">
                      {scenarioLabels.get(item.scenarioId) ?? "未分类"}
                      <span>
                        {new Date(item.createdAt).toLocaleString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p>{item.question || "（无问题描述）"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="assist-workspace">
          <div className="assist-card">
            <div className="assist-card-header">
              <h3>需求输入</h3>
              <Link href="/profile" className="ghost button-link">
                配置 AI
              </Link>
            </div>
            {scenario.fields.map((field) => (
              <div className="form-row" key={field.key}>
                <label>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    rows={4}
                    value={scenarioValues[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      handleFieldChange(field.key, event.target.value)
                    }
                  />
                ) : (
                  <input
                    value={scenarioValues[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      handleFieldChange(field.key, event.target.value)
                    }
                  />
                )}
              </div>
            ))}
            <div className="form-row">
              <label>问题/补充需求</label>
              <textarea
                rows={4}
                value={questionValue}
                placeholder="补充具体问题、答题卡点或想得到的建议"
                onChange={(event) => handleQuestionChange(event.target.value)}
              />
            </div>
            <div className="assist-actions">
              <LoadingButton
                type="button"
                className="primary"
                loading={requestState === "loading"}
                loadingText="生成中..."
                onClick={handleGenerate}
              >
                生成答复
              </LoadingButton>
              <button type="button" className="ghost" onClick={handleClear}>
                清空输入
              </button>
            </div>
            {requestMessage ? (
              <p className="form-message">{requestMessage}</p>
            ) : (
              <p className="form-message">
                如需真实回答，请先在个人主页配置模型与 API Key。
              </p>
            )}
          </div>

          <div className="assist-card">
            <h3>答复</h3>
            {requestState === "loading" ? (
              <p className="form-message">AI 正在生成答复...</p>
            ) : displayAnswer ? (
              <div className="assist-output">
                <ReactMarkdown>{displayAnswer}</ReactMarkdown>
              </div>
            ) : (
              <p className="form-message">提交问题后将显示 AI 答复。</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
