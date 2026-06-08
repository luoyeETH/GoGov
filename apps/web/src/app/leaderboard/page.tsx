"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LeaderboardPeriod = "day" | "week" | "month";

type RankingEntry = {
  rank: number;
  userId: string;
  username: string | null;
  totalSeconds: number;
  formattedDuration: string;
};

type LeaderboardData = {
  period: LeaderboardPeriod;
  periodLabel: string;
  rankings: RankingEntry[];
  myRanking: {
    rank: number;
    totalSeconds: number;
    formattedDuration: string;
  } | null;
};

type LoadState = "loading" | "idle" | "error";

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
const leaderboardPeriodKey = "gogov_leaderboard_period";

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "day", label: "日榜" },
  { value: "week", label: "周榜" },
  { value: "month", label: "月榜" }
];

function getRankBadge(rank: number): string | null {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return null;
}

function formatSeconds(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0 分钟";
  }
  const totalMinutes = Math.round(totalSeconds / 60);
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

export default function LeaderboardPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [period, setPeriod] = useState<LeaderboardPeriod>("day");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [periodReady, setPeriodReady] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const leaderboardSummary = useMemo(() => {
    const rankings = data?.rankings ?? [];
    const totalSeconds = rankings.reduce(
      (sum, entry) => sum + entry.totalSeconds,
      0
    );
    return {
      participantCount: rankings.length,
      totalDuration: formatSeconds(totalSeconds),
      topUser: rankings[0]?.username || (rankings[0] ? "匿名用户" : "暂无"),
      myRank: data?.myRanking ? `第 ${data.myRanking.rank} 名` : "未上榜"
    };
  }, [data]);

  useEffect(() => {
    try {
      const savedPeriod = window.localStorage.getItem(leaderboardPeriodKey);
      if (savedPeriod === "day" || savedPeriod === "week" || savedPeriod === "month") {
        setPeriod(savedPeriod);
      }
    } catch {
      // Ignore storage errors.
    } finally {
      setPeriodReady(true);
    }
  }, []);

  useEffect(() => {
    if (!periodReady) {
      return;
    }
    const controller = new AbortController();
    async function fetchLeaderboard() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const token = window.localStorage.getItem(sessionKey) ?? "";
        const response = await fetch(`${apiBase}/leaderboard?period=${period}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "获取排行榜失败");
        }
        const result = (await response.json()) as LeaderboardData;
        setData(result);
        setUpdatedAt(new Date().toISOString());
        setLoadState("idle");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setErrorMessage(err instanceof Error ? err.message : "获取失败");
        setLoadState("error");
      }
    }
    void fetchLeaderboard();
    return () => controller.abort();
  }, [period, periodReady, refreshIndex]);

  const switchPeriod = (nextPeriod: LeaderboardPeriod) => {
    setPeriod(nextPeriod);
    try {
      window.localStorage.setItem(leaderboardPeriodKey, nextPeriod);
    } catch {
      // Ignore storage errors.
    }
  };

  return (
    <main className="main">
      <section className="leaderboard-page">
        <div className="leaderboard-header">
          <div>
            <p className="eyebrow">学习排行</p>
            <h1>学习排行榜</h1>
            <p className="leaderboard-subtitle">
              {data?.periodLabel ?? "统计专注时长，按周期自动刷新排名。"}
            </p>
          </div>
          <button
            type="button"
            className="ghost leaderboard-refresh"
            onClick={() => setRefreshIndex((value) => value + 1)}
            disabled={loadState === "loading"}
          >
            {loadState === "loading" ? "刷新中..." : "刷新"}
          </button>
        </div>

        <div className="leaderboard-tabs" role="tablist" aria-label="排行榜周期">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={period === opt.value}
              className={`leaderboard-tab ${period === opt.value ? "is-active" : ""}`}
              onClick={() => switchPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="leaderboard-refresh-meta">
          最近刷新：{formatRefreshTime(updatedAt)}
        </div>

        <section className="leaderboard-summary" aria-label="排行榜概览">
          <div>
            <span>上榜人数</span>
            <strong>{leaderboardSummary.participantCount}</strong>
          </div>
          <div>
            <span>榜单总时长</span>
            <strong>{leaderboardSummary.totalDuration}</strong>
          </div>
          <div>
            <span>当前榜首</span>
            <strong>{leaderboardSummary.topUser}</strong>
          </div>
          <div>
            <span>我的位置</span>
            <strong>{leaderboardSummary.myRank}</strong>
          </div>
        </section>

        {loadState === "loading" && (
          <div className="leaderboard-skeleton" aria-label="排行榜加载中">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="leaderboard-skeleton-row" key={index}>
                <span />
                <div />
                <strong />
              </div>
            ))}
          </div>
        )}

        {loadState === "error" && (
          <div className="leaderboard-error leaderboard-state-card">
            <strong>排行榜加载失败</strong>
            <span>{errorMessage}</span>
            <button
              type="button"
              className="ghost"
              onClick={() => setRefreshIndex((value) => value + 1)}
            >
              重试
            </button>
          </div>
        )}

        {loadState === "idle" && data && (
          <>
            <div className="leaderboard-list">
              {data.rankings.length === 0 ? (
                <div className="leaderboard-empty leaderboard-state-card">
                  <strong>本期暂无学习记录</strong>
                  <span>打开番茄钟完成一次专注后，就会进入对应周期榜单。</span>
                  <Link href="/pomodoro" className="primary button-link">
                    去番茄钟学习
                  </Link>
                </div>
              ) : (
                data.rankings.map((entry) => {
                  const badge = getRankBadge(entry.rank);
                  return (
                    <div
                      key={entry.userId}
                      className={`leaderboard-row ${badge ? `rank-${badge}` : ""}`}
                    >
                      <div className="leaderboard-rank">
                        {badge ? (
                          <span className={`rank-badge ${badge}`}>
                            {entry.rank}
                          </span>
                        ) : (
                          <span className="rank-number">{entry.rank}</span>
                        )}
                      </div>
                      <div className="leaderboard-user">
                        {entry.username || "匿名用户"}
                      </div>
                      <div className="leaderboard-duration">
                        {entry.formattedDuration}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {data.myRanking && (
              <div className="leaderboard-my-rank">
                <div className="my-rank-label">我的排名</div>
                <div className="my-rank-content">
                  <span className="my-rank-position">
                    第 {data.myRanking.rank} 名
                  </span>
                  <span className="my-rank-duration">
                    {data.myRanking.formattedDuration}
                  </span>
                </div>
              </div>
            )}

            {!data.myRanking && (
              <div className="leaderboard-my-rank leaderboard-my-rank-empty">
                <div className="my-rank-label">我的排名</div>
                <div className="my-rank-content">
                  <span className="my-rank-hint">
                    本期暂无记录，使用番茄钟开始学习吧！
                  </span>
                  <Link href="/pomodoro" className="ghost button-link leaderboard-rank-action">
                    去学习
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
