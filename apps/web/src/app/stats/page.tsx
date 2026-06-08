"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { QuickPracticeCategory } from "@gogov/shared";

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

type LoadState = "loading" | "idle" | "error";

type CategoryStat = {
  categoryId: string | null;
  sessions: number;
  questions: number;
  correct: number;
  accuracy: number;
};

type RecentSession = {
  id: string;
  practiceType: string;
  categoryId: string | null;
  mode: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  durationSeconds: number;
  createdAt: string;
};

type StatsData = {
  totals: {
    sessions: number;
    questions: number;
    correct: number;
    accuracy: number;
    studyMinutes: number;
  };
  mistakes: number;
  byCategory: CategoryStat[];
  recentSessions: RecentSession[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 分钟";
  }
  const totalMinutes = Math.round(value);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes} 分钟`;
  }
  if (minutes <= 0) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${minutes} 分钟`;
}

function formatRefreshTime(value: string | null) {
  if (!value) {
    return "尚未刷新";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚未刷新";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

export default function StatsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [categories, setCategories] = useState<QuickPracticeCategory[]>([]);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item.name]));
  }, [categories]);

  const categoryRows = useMemo(() => {
    return (stats?.byCategory ?? [])
      .map((item) => ({
        ...item,
        categoryName: item.categoryId
          ? categoryMap.get(item.categoryId) ?? "未知题型"
          : "未知题型"
      }))
      .sort((a, b) => b.questions - a.questions || a.accuracy - b.accuracy);
  }, [categoryMap, stats]);

  const statsInsights = useMemo(() => {
    const totalQuestions = stats?.totals.questions ?? 0;
    const sessions = stats?.totals.sessions ?? 0;
    const weakest = [...categoryRows]
      .filter((item) => item.questions > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.questions - a.questions)[0];

    return {
      correctLabel: stats ? `${stats.totals.correct}/${totalQuestions}` : "--",
      averageQuestions:
        stats && sessions > 0 ? Math.round(totalQuestions / sessions) : "--",
      weakCategory: weakest ? weakest.categoryName : "暂无",
      updatedAt: formatRefreshTime(updatedAt)
    };
  }, [categoryRows, stats, updatedAt]);
  const showStatsGrid = state !== "error" || Boolean(stats);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const token = window.localStorage.getItem(sessionKey);
      if (!token) {
        setStats(null);
        setRequiresLogin(true);
        setMessage("请先登录后查看统计。");
        setState("error");
        return;
      }
      setRequiresLogin(false);
      setState("loading");
      setMessage(null);
      try {
        const [statsRes, categoriesRes] = await Promise.all([
          fetch(`${apiBase}/stats/overview`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }),
          fetch(`${apiBase}/practice/quick/categories`, {
            signal: controller.signal
          })
        ]);
        const statsData = await statsRes.json();
        if (!statsRes.ok) {
          throw new Error(statsData?.error ?? "无法获取统计数据");
        }
        const categoriesData = await categoriesRes.json();
        if (!categoriesRes.ok) {
          throw new Error("无法获取题型列表");
        }
        setStats(statsData);
        setCategories(categoriesData.categories ?? []);
        setUpdatedAt(new Date().toISOString());
        setState("idle");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setMessage(err instanceof Error ? err.message : "无法获取统计数据");
        setState("error");
      }
    };

    void load();
    return () => controller.abort();
  }, [refreshIndex]);

  return (
    <main className="main stats-page">
      <section className="stats-header app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">学习统计</p>
          <h1 className="app-page-title">训练数据看板</h1>
          <p className="lead app-page-subtitle">
            汇总你的练习记录、正确率与错题分布，帮助定位薄弱点。
          </p>
        </div>
        <div className="stats-header-actions">
          <button
            type="button"
            className="ghost stats-refresh"
            onClick={() => setRefreshIndex((value) => value + 1)}
            disabled={state === "loading"}
          >
            {state === "loading" ? "刷新中..." : "刷新数据"}
          </button>
          <Link href="/practice/quick" className="primary button-link">
            开始练习
          </Link>
        </div>
        <div className="stats-summary app-page-metrics">
          <div className="app-page-metric">
            <span className="app-page-metric-label">练习场次</span>
            <strong className="app-page-metric-value">
              {stats?.totals.sessions ?? "--"}
            </strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">总题数</span>
            <strong className="app-page-metric-value">
              {stats?.totals.questions ?? "--"}
            </strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">总体正确率</span>
            <strong className="app-page-metric-value">
              {stats ? `${stats.totals.accuracy}%` : "--"}
            </strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">累计时长</span>
            <strong className="app-page-metric-value">
              {stats ? formatMinutes(stats.totals.studyMinutes) : "--"}
            </strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">累计错题</span>
            <strong className="app-page-metric-value">
              {stats?.mistakes ?? "--"}
            </strong>
          </div>
        </div>
      </section>

      <section className="stats-insights" aria-label="训练洞察">
        <div>
          <span>答对题数</span>
          <strong>{statsInsights.correctLabel}</strong>
        </div>
        <div>
          <span>场均题量</span>
          <strong>{statsInsights.averageQuestions}</strong>
        </div>
        <div>
          <span>优先复盘</span>
          <strong>{statsInsights.weakCategory}</strong>
        </div>
        <div>
          <span>最近刷新</span>
          <strong>{statsInsights.updatedAt}</strong>
        </div>
      </section>

      {state === "loading" ? (
        <div className="stats-status stats-status-loading">正在加载统计数据...</div>
      ) : message ? (
        <div className="stats-status stats-status-error">
          <strong>{requiresLogin ? "登录后查看个人统计" : "统计加载失败"}</strong>
          <span>{message}</span>
          <div className="stats-status-actions">
            {requiresLogin ? (
              <Link href="/login" className="primary button-link">
                去登录
              </Link>
            ) : (
              <button
                type="button"
                className="ghost"
                onClick={() => setRefreshIndex((value) => value + 1)}
              >
                重试
              </button>
            )}
            <Link href="/practice/quick" className="ghost button-link">
              先去练习
            </Link>
          </div>
        </div>
      ) : null}

      {showStatsGrid ? (
        <section className="stats-grid">
          <div className="stats-card">
            <div className="stats-card-header">
              <h3>题型表现</h3>
              <span>按题型汇总正确率</span>
            </div>
            <div className="stats-list">
              {state === "loading" ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div className="stats-skeleton-row" key={index}>
                    <span />
                    <strong />
                  </div>
                ))
              ) : categoryRows.length ? (
                categoryRows.map((item) => (
                  <div key={item.categoryId ?? "unknown"} className="stats-row">
                    <div className="stats-row-main">
                      <strong>{item.categoryName}</strong>
                      <span>
                        {item.sessions} 场 · {item.questions} 题 · 答对{" "}
                        {item.correct} 题
                      </span>
                      <div className="stats-progress" aria-hidden="true">
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(item.accuracy, 100))}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="stats-metric">
                      <span>正确率</span>
                      <strong>{item.accuracy}%</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="stats-empty">
                  <strong>暂无题型记录</strong>
                  <span>完成一次速算训练后，这里会按题型展示正确率。</span>
                  <Link href="/practice/quick" className="primary button-link">
                    去训练
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <h3>最近练习</h3>
              <span>最近 5 次练习记录</span>
            </div>
            <div className="stats-list">
              {state === "loading" ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div className="stats-skeleton-row" key={index}>
                    <span />
                    <strong />
                  </div>
                ))
              ) : stats?.recentSessions?.length ? (
                stats.recentSessions.map((item) => (
                  <div key={item.id} className="stats-row">
                    <div className="stats-row-main">
                      <strong>
                        {item.categoryId
                          ? categoryMap.get(item.categoryId) ?? "未知题型"
                          : "综合练习"}
                      </strong>
                      <span>
                        {formatDate(item.createdAt)} · {item.totalQuestions} 题 ·
                        {formatMinutes(item.durationSeconds / 60)}
                      </span>
                    </div>
                    <div className="stats-metric">
                      <span>正确率</span>
                      <strong>{item.accuracy}%</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="stats-empty">
                  <strong>暂无练习记录</strong>
                  <span>开始练习后，最近 5 次训练会自动显示在这里。</span>
                  <Link href="/practice/quick" className="primary button-link">
                    开始第一场
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
