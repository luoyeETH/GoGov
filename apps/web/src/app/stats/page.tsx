"use client";

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

export default function StatsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [categories, setCategories] = useState<QuickPracticeCategory[]>([]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item.name]));
  }, [categories]);

  useEffect(() => {
    const load = async () => {
      const token = window.localStorage.getItem(sessionKey);
      if (!token) {
        setMessage("请先登录后查看统计。");
        setState("error");
        return;
      }
      setState("loading");
      setMessage(null);
      try {
        const [statsRes, categoriesRes] = await Promise.all([
          fetch(`${apiBase}/stats/overview`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiBase}/practice/quick/categories`)
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
        setState("idle");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "无法获取统计数据");
        setState("error");
      }
    };

    void load();
  }, []);

  return (
    <main className="main stats-page">
      <section className="stats-header">
        <div>
          <p className="eyebrow">学习统计</p>
          <h1>训练数据看板</h1>
          <p className="lead">
            汇总你的练习记录、正确率与错题分布，帮助定位薄弱点。
          </p>
        </div>
        <div className="stats-summary">
          <div>
            <span>练习场次</span>
            <strong>{stats?.totals.sessions ?? "--"}</strong>
          </div>
          <div>
            <span>总题数</span>
            <strong>{stats?.totals.questions ?? "--"}</strong>
          </div>
          <div>
            <span>总体正确率</span>
            <strong>
              {stats ? `${stats.totals.accuracy}%` : "--"}
            </strong>
          </div>
          <div>
            <span>累计时长</span>
            <strong>
              {stats ? `${stats.totals.studyMinutes} 分钟` : "--"}
            </strong>
          </div>
          <div>
            <span>累计错题</span>
            <strong>{stats?.mistakes ?? "--"}</strong>
          </div>
        </div>
      </section>

      {state === "loading" ? (
        <div className="practice-loading">正在加载统计数据...</div>
      ) : message ? (
        <div className="practice-error">{message}</div>
      ) : null}

      <section className="stats-grid">
        <div className="stats-card">
          <div className="stats-card-header">
            <h3>题型表现</h3>
            <span>按题型汇总正确率</span>
          </div>
          <div className="stats-list">
            {stats?.byCategory?.length ? (
              stats.byCategory.map((item) => (
                <div key={item.categoryId ?? "unknown"} className="stats-row">
                  <div>
                    <strong>
                      {item.categoryId
                        ? categoryMap.get(item.categoryId) ?? "未知题型"
                        : "未知题型"}
                    </strong>
                    <span>
                      {item.sessions} 场 · {item.questions} 题
                    </span>
                  </div>
                  <div className="stats-metric">{item.accuracy}%</div>
                </div>
              ))
            ) : (
              <div className="practice-loading">暂无题型记录</div>
            )}
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-header">
            <h3>最近练习</h3>
            <span>最近 5 次练习记录</span>
          </div>
          <div className="stats-list">
            {stats?.recentSessions?.length ? (
              stats.recentSessions.map((item) => (
                <div key={item.id} className="stats-row">
                  <div>
                    <strong>
                      {item.categoryId
                        ? categoryMap.get(item.categoryId) ?? "未知题型"
                        : "综合练习"}
                    </strong>
                    <span>
                      {formatDate(item.createdAt)} · {item.totalQuestions} 题 ·
                      {Math.round(item.durationSeconds / 60)} 分钟
                    </span>
                  </div>
                  <div className="stats-metric">{item.accuracy}%</div>
                </div>
              ))
            ) : (
              <div className="practice-loading">暂无练习记录</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
