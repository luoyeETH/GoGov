"use client";

import Link from "next/link";
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
const analysisKey = "gogov_kline_analysis";

type ChartPoint = {
  age?: number;
  year?: number;
  daYun?: string;
  ganZhi?: string;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
  score?: number;
  reason?: string;
};

type KlineAnalysis = {
  bazi?: string[];
  summary?: string;
  summaryScore?: number;
  personality?: string;
  personalityScore?: number;
  study?: string;
  studyScore?: number;
  career?: string;
  careerScore?: number;
  familySupport?: string;
  familySupportScore?: number;
  health?: string;
  healthScore?: number;
  examLuck?: string;
  examLuckScore?: number;
  landingYear?: string;
  landingProbability?: number;
  backupPath?: string;
  chartPoints?: ChartPoint[];
};

type StoredAnalysis = {
  id?: string;
  analysis: KlineAnalysis;
  raw?: string | null;
  model?: string | null;
  warning?: string | null;
  createdAt?: string | null;
};

function formatProbability(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return `${Math.round(value * 100)}%`;
}

function KlineChart({ points }: { points: ChartPoint[] }) {
  const { candles, gridLines, labels, width, height } = useMemo(() => {
    const size = { width: 860, height: 280 };
    const padding = { top: 24, bottom: 42, left: 40, right: 24 };
    const minValue = 0;
    const maxValue = 100;
    const range = maxValue - minValue;
    const usableHeight = size.height - padding.top - padding.bottom;
    const usableWidth = size.width - padding.left - padding.right;
    const xStep = usableWidth / Math.max(points.length, 1);
    const clampValue = (value: number) =>
      Math.min(maxValue, Math.max(minValue, value));
    const toY = (value: number) =>
      padding.top + ((maxValue - clampValue(value)) / range) * usableHeight;

    const candles = points.map((point, index) => {
      const center = padding.left + xStep * (index + 0.5);
      const bodyWidth = Math.min(18, xStep * 0.6);
      const openValue =
        typeof point.open === "number" ? point.open : point.score ?? minValue;
      const closeValue =
        typeof point.close === "number" ? point.close : point.score ?? minValue;
      const highValue =
        typeof point.high === "number" ? point.high : Math.max(openValue, closeValue);
      const lowValue =
        typeof point.low === "number" ? point.low : Math.min(openValue, closeValue);
      const openY = toY(openValue);
      const closeY = toY(closeValue);
      const highY = toY(highValue);
      const lowY = toY(lowValue);
      const up = closeValue >= openValue;
      return {
        key: `${point.age ?? index}-${index}`,
        center,
        bodyWidth,
        openY,
        closeY,
        highY,
        lowY,
        up
      };
    });

    const gridLines = Array.from({ length: 5 }).map((_, index) => {
      const value = minValue + (range * index) / 4;
      return {
        value: Math.round(value),
        y: toY(value)
      };
    });

    const labels = points.map((point, index) => ({
      x: padding.left + xStep * (index + 0.5),
      value: point.age ?? 23 + index
    }));

    return { candles, gridLines, labels, ...size };
  }, [points]);

  if (!points.length) {
    return <p className="form-message">暂无 K 线数据。</p>;
  }

  return (
    <div className="kline-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="上岸概率 K 线">
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx="16"
          className="kline-chart-bg"
        />
        {gridLines.map((line) => (
          <g key={`grid-${line.value}`}>
            <line
              x1="40"
              x2={width - 24}
              y1={line.y}
              y2={line.y}
              className="kline-chart-grid"
            />
            <text x="12" y={line.y + 4} className="kline-chart-axis">
              {line.value}
            </text>
          </g>
        ))}
        {candles.map((candle) => (
          <g key={candle.key}>
            <line
              x1={candle.center}
              x2={candle.center}
              y1={candle.highY}
              y2={candle.lowY}
              className={`kline-chart-wick ${candle.up ? "up" : "down"}`}
            />
            <rect
              x={candle.center - candle.bodyWidth / 2}
              y={Math.min(candle.openY, candle.closeY)}
              width={candle.bodyWidth}
              height={Math.max(2, Math.abs(candle.openY - candle.closeY))}
              className={`kline-chart-body ${candle.up ? "up" : "down"}`}
              rx="3"
            />
          </g>
        ))}
        {labels.map((label, index) => (
          <text
            key={`label-${label.value}-${index}`}
            x={label.x}
            y={height - 16}
            className="kline-chart-label"
            textAnchor="middle"
          >
            {label.value}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function KlineResultPage() {
  const [payload, setPayload] = useState<StoredAnalysis | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">(
    "loading"
  );

  useEffect(() => {
    const raw = window.sessionStorage.getItem(analysisKey);
    const hydrate = (value: string | null) => {
      if (!value) {
        return false;
      }
      try {
        const parsed = JSON.parse(value) as StoredAnalysis;
        if (!parsed || typeof parsed !== "object" || !parsed.analysis) {
          return false;
        }
        setPayload(parsed);
        setLoadState("ready");
        return true;
      } catch {
        return false;
      }
    };
    if (hydrate(raw)) {
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setLoadState("missing");
      return;
    }
    const loadLatest = async () => {
      try {
        const response = await fetch(`${apiBase}/kline/history?limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = (await response.json()) as {
          reports?: StoredAnalysis[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "获取记录失败");
        }
        const latest = Array.isArray(data.reports) ? data.reports[0] : null;
        if (latest && latest.analysis) {
          setPayload(latest);
          window.sessionStorage.setItem(analysisKey, JSON.stringify(latest));
          setLoadState("ready");
          return;
        }
      } catch {
        // ignore
      }
      setLoadState("missing");
    };
    loadLatest();
  }, []);

  const analysis = payload?.analysis;
  const chartPoints = Array.isArray(analysis?.chartPoints)
    ? analysis?.chartPoints.filter((item) => item && typeof item === "object")
    : [];

  if (loadState === "missing") {
    return (
      <main className="main kline-result-page">
        <section className="kline-card">
          <h2>暂无测算结果</h2>
          <p className="form-message">请先在上岸 K 线页面完成测算。</p>
          <Link className="ghost button-link" href="/kline">
            返回上岸 K 线
          </Link>
        </section>
      </main>
    );
  }

  if (!analysis || loadState === "loading") {
    return (
      <main className="main kline-result-page">
        <section className="kline-card">
          <p className="form-message">加载中...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="main kline-result-page">
      <section className="kline-result-hero">
        <div>
          <p className="eyebrow">UPSHORE KLINE REPORT</p>
          <h1>上岸 K 线报告</h1>
          <p className="lead">{analysis.summary || "暂无总结"}</p>
          <div className="kline-result-meta">
            <div>
              <span>最可能上岸</span>
              <strong>{analysis.landingYear || "无"}</strong>
            </div>
            <div>
              <span>上岸概率</span>
              <strong>{formatProbability(analysis.landingProbability)}</strong>
            </div>
            <div>
              <span>AI 模型</span>
              <strong>{payload?.model || "-"}</strong>
            </div>
          </div>
          {payload?.warning ? (
            <p className="form-message kline-warning">提示：{payload.warning}</p>
          ) : null}
        </div>
        <div className="kline-card">
          <h3>核心结论</h3>
          <div className="kline-score-grid">
            <div className="kline-score-card">
              <span>总评</span>
              <strong>{analysis.summaryScore ?? "-"}</strong>
            </div>
            <div className="kline-score-card">
              <span>人格</span>
              <strong>{analysis.personalityScore ?? "-"}</strong>
            </div>
            <div className="kline-score-card">
              <span>学习</span>
              <strong>{analysis.studyScore ?? "-"}</strong>
            </div>
            <div className="kline-score-card">
              <span>岗位匹配</span>
              <strong>{analysis.careerScore ?? "-"}</strong>
            </div>
            <div className="kline-score-card">
              <span>家庭支持</span>
              <strong>{analysis.familySupportScore ?? "-"}</strong>
            </div>
            <div className="kline-score-card">
              <span>健康</span>
              <strong>{analysis.healthScore ?? "-"}</strong>
            </div>
            <div className="kline-score-card">
              <span>考试运</span>
              <strong>{analysis.examLuckScore ?? "-"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="kline-chart-card kline-card">
        <div className="kline-card-header">
          <h3>上岸概率 K 线</h3>
          <span>年龄 23 → 40（虚岁）</span>
        </div>
        <KlineChart points={chartPoints} />
      </section>

      <section className="kline-grid">
        <div className="kline-card">
          <h3>备考人格</h3>
          <p>{analysis.personality || "暂无"}</p>
        </div>
        <div className="kline-card">
          <h3>学习与应试</h3>
          <p>{analysis.study || "暂无"}</p>
        </div>
        <div className="kline-card">
          <h3>体制适配度</h3>
          <p>{analysis.career || "暂无"}</p>
        </div>
        <div className="kline-card">
          <h3>家庭支撑</h3>
          <p>{analysis.familySupport || "暂无"}</p>
        </div>
        <div className="kline-card">
          <h3>健康风险</h3>
          <p>{analysis.health || "暂无"}</p>
        </div>
        <div className="kline-card">
          <h3>考试运专项</h3>
          <p>{analysis.examLuck || "暂无"}</p>
        </div>
        <div className="kline-card">
          <h3>备选路径</h3>
          <p>{analysis.backupPath || "暂无"}</p>
        </div>
      </section>

      <section className="kline-card kline-point-list">
        <div className="kline-card-header">
          <h3>逐年详批</h3>
          <span>共 {chartPoints.length} 年</span>
        </div>
        <div className="kline-point-grid">
          {chartPoints.map((point, index) => (
            <div key={`${point.age ?? index}-${index}`} className="kline-point-card">
              <div className="kline-point-header">
                <strong>{point.age ?? 23 + index} 岁</strong>
                <span>{point.year ?? "-"}</span>
              </div>
              <div className="kline-point-meta">
                <span>大运 {point.daYun || "-"}</span>
                <span>流年 {point.ganZhi || "-"}</span>
                <span>评分 {point.score ?? "-"}</span>
              </div>
              <p>{point.reason || "暂无详批"}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
