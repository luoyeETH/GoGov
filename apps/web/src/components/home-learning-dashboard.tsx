"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

type LoadState = "loading" | "idle" | "error";

type PomodoroInsightDay = {
  date: string;
  totalMinutes: number;
  totals: Record<string, number>;
};

type PomodoroInsights = {
  totals: {
    sessions: number;
    completed: number;
    failed: number;
    focusMinutes: number;
  };
  subjects: string[];
  heatmap: {
    days: PomodoroInsightDay[];
  };
  timeBuckets: {
    key: string;
    label: string;
    range: string;
    count: number;
    minutes: number;
  }[];
  radar: {
    subject: string;
    minutes: number;
  }[];
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
const HEATMAP_DAYS = 84;
const PIE_COLORS = [
  "#2f855a",
  "#2c7a7b",
  "#2b6cb0",
  "#b7791f",
  "#c05621",
  "#4a5568"
];
const DEFAULT_SUBJECTS = [
  "常识",
  "政治理论",
  "言语理解",
  "数量关系",
  "判断推理",
  "资料分析",
  "专业知识",
  "申论"
];
const DEFAULT_BUCKETS = [
  { key: "morning", label: "早晨", range: "05:00-11:59", count: 0, minutes: 0 },
  { key: "afternoon", label: "下午", range: "12:00-17:59", count: 0, minutes: 0 },
  { key: "night", label: "深夜", range: "18:00-04:59", count: 0, minutes: 0 }
];

function formatMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) {
    return "0";
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    return `${hours} 小时 ${rest} 分钟`;
  }
  return `${Math.round(minutes)} 分钟`;
}

function formatMinutesShort(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0m";
  }
  if (minutes >= 60) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours}h`;
  }
  return `${Math.round(minutes)}m`;
}

function getHeatLevel(value: number, max: number) {
  if (!max || value <= 0) {
    return 0;
  }
  const ratio = value / max;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

function getBeijingDateString(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  const year = beijing.getFullYear();
  const month = `${beijing.getMonth() + 1}`.padStart(2, "0");
  const day = `${beijing.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateLabel(label: string, offsetDays: number) {
  const [year, month, day] = label.split("-").map((value) => Number(value));
  const baseUtc = Date.UTC(year, month - 1, day);
  const next = new Date(baseUtc + offsetDays * 24 * 60 * 60 * 1000);
  return next.toISOString().slice(0, 10);
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export default function HomeLearningDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [insights, setInsights] = useState<PomodoroInsights | null>(null);
  const [insightsState, setInsightsState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [heatSubject, setHeatSubject] = useState<string>("全部");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setToken(localStorage.getItem(sessionKey));
  }, []);

  useEffect(() => {
    if (!token) {
      setInsights(null);
      setErrorMessage(null);
      setInsightsState("idle");
      return;
    }
    let active = true;
    const loadInsights = async () => {
      setInsightsState("loading");
      try {
        const res = await fetch(
          `${apiBase}/pomodoro/insights?days=${HEATMAP_DAYS}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "无法获取学习地图数据");
        }
        if (!active) {
          return;
        }
        setInsights(data);
        setInsightsState("idle");
        setErrorMessage(null);
      } catch (err) {
        if (!active) {
          return;
        }
        setInsights(null);
        setInsightsState("error");
        setErrorMessage(
          err instanceof Error ? err.message : "无法获取学习地图数据"
        );
      }
    };
    void loadInsights();
    return () => {
      active = false;
    };
  }, [token]);

  const subjectOptions = useMemo(() => {
    const list = insights?.subjects?.length ? insights.subjects : DEFAULT_SUBJECTS;
    return ["全部", ...Array.from(new Set(list))];
  }, [insights]);

  useEffect(() => {
    if (!subjectOptions.includes(heatSubject)) {
      setHeatSubject("全部");
    }
  }, [subjectOptions, heatSubject]);

  const todayLabel = getBeijingDateString();
  const fallbackHeatmapDays = useMemo(() => {
    const days: PomodoroInsightDay[] = [];
    for (let i = HEATMAP_DAYS - 1; i >= 0; i -= 1) {
      const date = shiftDateLabel(todayLabel, -i);
      days.push({ date, totalMinutes: 0, totals: {} });
    }
    return days;
  }, [todayLabel]);
  const heatmapDays =
    insights?.heatmap?.days?.length ? insights.heatmap.days : fallbackHeatmapDays;

  const heatmapValues = useMemo(() => {
    return heatmapDays.map((day) => {
      const minutes =
        heatSubject === "全部"
          ? day.totalMinutes
          : day.totals?.[heatSubject] ?? 0;
      return {
        date: day.date,
        minutes
      };
    });
  }, [heatmapDays, heatSubject]);

  const maxHeatMinutes = useMemo(() => {
    return heatmapValues.reduce((max, item) => Math.max(max, item.minutes), 0);
  }, [heatmapValues]);

  const todayRecord = useMemo(() => {
    return heatmapDays.find((day) => day.date === todayLabel) ?? null;
  }, [heatmapDays, todayLabel]);

  const todayBreakdown = useMemo(() => {
    const totals = todayRecord?.totals ?? {};
    return Object.entries(totals)
      .filter(([, minutes]) => minutes > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([subjectName, minutes], index) => ({
        subject: subjectName,
        minutes,
        color: PIE_COLORS[index % PIE_COLORS.length]
      }));
  }, [todayRecord]);

  const todayTotalMinutes = useMemo(() => {
    if (!todayRecord) {
      return 0;
    }
    const entriesTotal = todayBreakdown.reduce(
      (sum, item) => sum + item.minutes,
      0
    );
    return Math.max(todayRecord.totalMinutes ?? 0, entriesTotal);
  }, [todayBreakdown, todayRecord]);

  const todayPieSegments = useMemo(() => {
    if (!todayTotalMinutes || todayBreakdown.length <= 1) {
      return [];
    }
    const center = 64;
    const radius = 58;
    let currentAngle = -Math.PI / 2;
    return todayBreakdown.map((item) => {
      const ratio = item.minutes / todayTotalMinutes;
      const angle = Math.max(0, ratio * Math.PI * 2);
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return {
        ...item,
        path: describeArc(center, center, radius, start, end)
      };
    });
  }, [todayBreakdown, todayTotalMinutes]);

  const bucketStats = useMemo(() => {
    const source = insights?.timeBuckets?.length
      ? insights.timeBuckets
      : DEFAULT_BUCKETS;
    const map = new Map(source.map((item) => [item.key, item]));
    return DEFAULT_BUCKETS.map((bucket) => map.get(bucket.key) ?? bucket);
  }, [insights]);

  const bucketMaxCount = useMemo(() => {
    return bucketStats.reduce((max, item) => Math.max(max, item.count), 1);
  }, [bucketStats]);

  const radarSource = useMemo(() => {
    if (insights?.radar?.length) {
      return insights.radar;
    }
    return DEFAULT_SUBJECTS.map((subject) => ({ subject, minutes: 0 }));
  }, [insights]);

  const radarPoints = useMemo(() => {
    const radar = radarSource ?? [];
    const max = radar.reduce((best, item) => Math.max(best, item.minutes), 0) || 1;
    const size = 220;
    const center = size / 2;
    const radius = 80;
    const step = (Math.PI * 2) / (radar.length || 1);
    return {
      size,
      center,
      radius,
      max,
      points: radar.map((item, index) => {
        const angle = step * index - Math.PI / 2;
        const value = item.minutes / max;
        return {
          subject: item.subject,
          minutes: item.minutes,
          x: center + Math.cos(angle) * radius * value,
          y: center + Math.sin(angle) * radius * value,
          labelX: center + Math.cos(angle) * (radius + 22),
          labelY: center + Math.sin(angle) * (radius + 22)
        };
      })
    };
  }, [radarSource]);

  const radarPolygon = radarPoints.points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const aiSuggestion = useMemo(() => {
    if (!radarSource.length) {
      return "登录后即可获得基于学习地图的智能建议。";
    }
    const totalMinutes = radarSource.reduce(
      (sum, item) => sum + item.minutes,
      0
    );
    if (!totalMinutes) {
      return "今日还没有学习记录，先开启一轮番茄钟吧。";
    }
    const weakest = radarSource.reduce((min, item) => {
      return item.minutes < min.minutes ? item : min;
    }, radarSource[0]);
    return `检测到你在『${weakest.subject}』投入较少，建议今日优先完成对应专项练习。`;
  }, [radarSource]);

  const statusText = useMemo(() => {
    if (!token) {
      return null;
    }
    if (insightsState === "loading") {
      return "学习地图同步中...";
    }
    if (insightsState === "error") {
      return errorMessage ?? "学习地图加载失败";
    }
    return null;
  }, [token, insightsState, errorMessage]);

  const openPomodoro = () => {
    router.push("/pomodoro");
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPomodoro();
    }
  };

  return (
    <section className="home-dashboard">
      <div className="home-dashboard-header">
        <div>
          <h2>学习地图数据中心</h2>
          <p>今日状态、12 周热力、时段效率与偏科雷达一屏掌握。</p>
        </div>
        {statusText ? (
          <span className="home-dashboard-status">{statusText}</span>
        ) : null}
      </div>

      <div className="home-dashboard-grid">
        <div
          className="pomodoro-map-card home-dashboard-card home-dashboard-clickable"
          role="link"
          tabIndex={0}
          onClick={openPomodoro}
          onKeyDown={handleCardKeyDown}
          aria-label="前往番茄钟查看今日学习分布"
        >
          <div className="pomodoro-card-header">
            <h3>今日学习分布</h3>
            <span>今日状态</span>
          </div>
          <div className="pomodoro-today">
            <div className="pomodoro-today-chart">
              <svg
                className="pomodoro-pie"
                viewBox="0 0 128 128"
                role="img"
                aria-label="今日学习科目分布"
              >
                {todayBreakdown.length === 1 ? (
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill={todayBreakdown[0].color}
                  />
                ) : todayPieSegments.length ? (
                  todayPieSegments.map((item) => (
                    <path key={item.subject} d={item.path} fill={item.color} />
                  ))
                ) : (
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill="rgba(56, 161, 105, 0.12)"
                  />
                )}
              </svg>
              <div className="pomodoro-today-total">
                <span>今日学习</span>
                <strong>{formatMinutes(todayTotalMinutes)}</strong>
              </div>
            </div>
            <div className="pomodoro-today-legend">
              {todayBreakdown.length ? (
                todayBreakdown.map((item) => {
                  const percent = todayTotalMinutes
                    ? Math.round((item.minutes / todayTotalMinutes) * 1000) / 10
                    : 0;
                  return (
                    <div key={item.subject} className="pomodoro-today-item">
                      <span
                        className="pomodoro-today-swatch"
                        style={{ background: item.color }}
                      />
                      <div>
                        <strong>{item.subject}</strong>
                        <span>
                          {item.minutes} 分钟 · {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="pomodoro-today-empty">今日暂无学习记录</div>
              )}
            </div>
          </div>
        </div>

        <div
          className="pomodoro-map-card home-dashboard-card home-dashboard-clickable"
          role="link"
          tabIndex={0}
          onClick={openPomodoro}
          onKeyDown={handleCardKeyDown}
          aria-label="前往番茄钟查看学习热力图"
        >
          <div className="pomodoro-card-header">
            <h3>学习热力图</h3>
            <span>最近 12 周投入</span>
          </div>
          <div className="pomodoro-heatmap-controls">
            {subjectOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`pomodoro-chip ${heatSubject === item ? "active" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setHeatSubject(item);
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="pomodoro-heatmap">
            {heatmapValues.map((day) => (
              <div
                key={day.date}
                className={`heatmap-cell heatmap-level-${getHeatLevel(
                  day.minutes,
                  maxHeatMinutes
                )}`}
                title={`${day.date} · ${day.minutes} 分钟`}
              />
            ))}
          </div>
          <div className="pomodoro-heatmap-legend">
            <span>少</span>
            <div className="heatmap-scale">
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={`heatmap-cell heatmap-level-${level}`}
                />
              ))}
            </div>
            <span>多</span>
          </div>
        </div>

        <div
          className="pomodoro-map-card home-dashboard-card home-dashboard-clickable"
          role="link"
          tabIndex={0}
          onClick={openPomodoro}
          onKeyDown={handleCardKeyDown}
          aria-label="前往番茄钟查看高效时段"
        >
          <div className="pomodoro-card-header">
            <h3>高效时段</h3>
            <span>番茄钟完成次数</span>
          </div>
          <div className="pomodoro-buckets home-dashboard-buckets">
            {bucketStats.map((bucket) => {
              const width = bucketMaxCount
                ? (bucket.count / bucketMaxCount) * 100
                : 0;
              return (
                <div key={bucket.key} className="pomodoro-bucket">
                  <div>
                    <strong>{bucket.label}</strong>
                    <span>{bucket.range}</span>
                  </div>
                  <div className="pomodoro-bucket-bar">
                    <div style={{ width: `${width}%` }} />
                  </div>
                  <div className="pomodoro-bucket-meta">{bucket.count} 次</div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="pomodoro-map-card home-dashboard-card home-dashboard-clickable"
          role="link"
          tabIndex={0}
          onClick={openPomodoro}
          onKeyDown={handleCardKeyDown}
          aria-label="前往番茄钟查看科目雷达"
        >
          <div className="pomodoro-card-header">
            <h3>科目雷达</h3>
            <span>专注时长占比</span>
          </div>
          <div className="pomodoro-radar">
            <svg
              width={radarPoints.size}
              height={radarPoints.size}
              viewBox={`0 0 ${radarPoints.size} ${radarPoints.size}`}
            >
              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const points = radarPoints.points
                  .map((point) => {
                    const angle = Math.atan2(
                      point.y - radarPoints.center,
                      point.x - radarPoints.center
                    );
                    const r = radarPoints.radius * ratio;
                    const x = radarPoints.center + Math.cos(angle) * r;
                    const y = radarPoints.center + Math.sin(angle) * r;
                    return `${x},${y}`;
                  })
                  .join(" ");
                return (
                  <polygon
                    key={ratio}
                    points={points}
                    className="pomodoro-radar-grid"
                  />
                );
              })}
              {radarPoints.points.map((point, index) => (
                <line
                  key={`${point.subject}-${index}`}
                  x1={radarPoints.center}
                  y1={radarPoints.center}
                  x2={point.x}
                  y2={point.y}
                  className="pomodoro-radar-line"
                />
              ))}
              {radarPolygon ? (
                <polygon
                  points={radarPolygon}
                  className="pomodoro-radar-shape"
                />
              ) : null}
              {radarPoints.points.map((point) => (
                <text
                  key={point.subject}
                  x={point.labelX}
                  y={point.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pomodoro-radar-label"
                >
                  {point.subject}
                </text>
              ))}
            </svg>
            <div className="pomodoro-radar-meta">
              {radarSource.map((item) => (
                <div key={item.subject}>
                  <strong>{item.subject}</strong>
                  <span>{formatMinutesShort(item.minutes)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pomodoro-map-card home-dashboard-card home-dashboard-ai-card">
        <div className="pomodoro-card-header">
          <h3>AI 智能建议</h3>
          <span>今日行动提示</span>
        </div>
        <p className="home-dashboard-ai-text">{aiSuggestion}</p>
      </div>
    </section>
  );
}
