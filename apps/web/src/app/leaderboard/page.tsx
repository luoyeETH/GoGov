"use client";

import { useEffect, useState } from "react";

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

export default function LeaderboardPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [period, setPeriod] = useState<LeaderboardPeriod>("day");
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const token = localStorage.getItem(sessionKey) ?? "";
        const response = await fetch(`${apiBase}/leaderboard?period=${period}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "获取排行榜失败");
        }
        const result = (await response.json()) as LeaderboardData;
        setData(result);
        setLoadState("idle");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "获取失败");
        setLoadState("error");
      }
    }
    fetchLeaderboard();
  }, [period]);

  return (
    <main className="main">
      <section className="leaderboard-page">
        <div className="leaderboard-header">
          <h1>学习排行榜</h1>
          <p className="leaderboard-subtitle">
            {data?.periodLabel ?? "加载中..."}
          </p>
        </div>

        <div className="leaderboard-tabs">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`leaderboard-tab ${period === opt.value ? "is-active" : ""}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loadState === "loading" && (
          <div className="leaderboard-loading">加载中...</div>
        )}

        {loadState === "error" && (
          <div className="leaderboard-error">{errorMessage}</div>
        )}

        {loadState === "idle" && data && (
          <>
            <div className="leaderboard-list">
              {data.rankings.length === 0 ? (
                <div className="leaderboard-empty">
                  暂无数据，快去使用番茄钟学习吧！
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
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
