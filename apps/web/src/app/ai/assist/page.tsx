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

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function AiAssistPage() {
  const [scenarios, setScenarios] = useState<PromptScenario[]>([]);
  const [scenarioState, setScenarioState] = useState<LoadState>("loading");
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState("");
  const [values, setValues] = useState<ScenarioValues>({});
  const [questions, setQuestions] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyState, setHistoryState] = useState<LoadState>("idle");
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [historyQuery, setHistoryQuery] = useState("");
  const [activeHistory, setActiveHistory] = useState<HistoryItem | null>(null);
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const scenario = useMemo(() => {
    return scenarios.find((item) => item.id === activeId) ?? scenarios[0];
  }, [activeId, scenarios]);

  const scenarioValues = values[scenario?.id] ?? {};
  const questionValue = questions[scenario?.id] ?? "";
  const displayAnswer = activeHistory?.answer ?? (scenario ? answer[scenario.id] : "");

  const scenarioLabels = useMemo(() => {
    return new Map(scenarios.map((item) => [item.id, item.label]));
  }, [scenarios]);

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) {
      return history;
    }
    return history.filter((item) => {
      const label = scenarioLabels.get(item.scenarioId) ?? "";
      return `${label} ${item.question} ${item.answer}`
        .toLowerCase()
        .includes(query);
    });
  }, [history, historyQuery, scenarioLabels]);

  const assistSummary = useMemo(() => {
    return {
      scenarioCount: scenarios.length,
      historyCount: history.length,
      currentScenario: scenario?.label ?? "加载中",
      outputState: activeHistory
        ? "历史答复"
        : displayAnswer
          ? "已生成"
          : requestState === "loading"
            ? "生成中"
            : "待生成"
    };
  }, [activeHistory, displayAnswer, history.length, requestState, scenario?.label, scenarios.length]);

  const loadScenarios = async () => {
    setScenarioState("loading");
    setScenarioMessage(null);
    try {
      const res = await fetch(`${apiBase}/ai/assist/scenarios`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "无法加载答疑场景");
      }
      if (!Array.isArray(data.scenarios)) {
        throw new Error("答疑场景数据格式异常");
      }
      setScenarios(data.scenarios);
      if (data.scenarios.length > 0 && !activeId) {
        setActiveId(data.scenarios[0].id);
      }
      const initialValues: ScenarioValues = {};
      const initialQuestions: Record<string, string> = {};
      data.scenarios.forEach((s: PromptScenario) => {
        initialValues[s.id] = values[s.id] ?? {};
        initialQuestions[s.id] = questions[s.id] ?? "";
      });
      setValues(initialValues);
      setQuestions(initialQuestions);
      setScenarioState("idle");
    } catch (err) {
      setScenarioState("error");
      setScenarioMessage(err instanceof Error ? err.message : "无法加载答疑场景");
    }
  };

  const loadHistory = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistory([]);
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

  if (scenarios.length === 0 || !scenario) {
    return (
      <main className="main assist-page">
        <section className="login-hero app-page-header">
          <div className="app-page-header-main">
            <p className="eyebrow">AI 答疑</p>
            <h1 className="app-page-title">一套提示词，覆盖公考核心问题</h1>
            <p className="lead app-page-subtitle">
              正在准备岗位选择、题目解析与学习计划等答疑场景。
            </p>
          </div>
        </section>
        <section className="assist-state-card">
          {scenarioState === "loading" ? (
            <>
              <div className="assist-skeleton-line wide" />
              <div className="assist-skeleton-line" />
              <div className="assist-skeleton-grid">
                <span />
                <span />
                <span />
              </div>
            </>
          ) : (
            <>
              <strong>答疑场景加载失败</strong>
              <span>{scenarioMessage ?? "请稍后重试。"}</span>
              <button type="button" className="ghost" onClick={() => void loadScenarios()}>
                重新加载
              </button>
            </>
          )}
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

      <section className="assist-summary" aria-label="AI 答疑概览">
        <div>
          <span>可用场景</span>
          <strong>{assistSummary.scenarioCount}</strong>
        </div>
        <div>
          <span>历史记录</span>
          <strong>{assistSummary.historyCount}</strong>
        </div>
        <div>
          <span>当前场景</span>
          <strong>{assistSummary.currentScenario}</strong>
        </div>
        <div>
          <span>答复状态</span>
          <strong>{assistSummary.outputState}</strong>
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
            <div className="assist-history-tools">
              <input
                type="search"
                value={historyQuery}
                placeholder="搜索历史问题或答复"
                onChange={(event) => setHistoryQuery(event.target.value)}
              />
              {historyQuery ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setHistoryQuery("")}
                >
                  清除
                </button>
              ) : null}
            </div>
            {historyState === "loading" ? (
              <div className="assist-history-skeleton">
                <span />
                <span />
                <span />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="assist-empty">
                <strong>
                  {historyQuery
                    ? "没有匹配记录"
                    : historyState === "error"
                      ? "暂时无法查看历史"
                      : "暂无答疑记录"}
                </strong>
                <span>
                  {historyQuery
                    ? "换个关键词，或清除搜索查看全部历史。"
                    : historyMessage ?? "生成一次答复后会自动保存到这里。"}
                </span>
                <div className="assist-empty-actions">
                  {historyState === "error" && historyMessage?.includes("登录") ? (
                    <Link href="/login" className="primary button-link">
                      去登录
                    </Link>
                  ) : (
                    <button type="button" className="ghost" onClick={loadHistory}>
                      重新加载
                    </button>
                  )}
                  {historyQuery ? (
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setHistoryQuery("")}
                    >
                      清除搜索
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="history-list">
                {filteredHistory.map((item) => (
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
                      <span>{formatHistoryTime(item.createdAt)}</span>
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
              <div className="assist-output-skeleton" aria-label="AI 正在生成答复">
                <span />
                <span />
                <span />
                <span />
              </div>
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
