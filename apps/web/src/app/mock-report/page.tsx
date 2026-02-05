"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, MouseEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingButton from "../../components/loading-button";

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

const manualSubjects = [
  "政治理论",
  "常识判断",
  "言语理解与表达",
  "数量关系",
  "判断推理",
  "资料分析"
];

const subjectAliases: Record<string, string> = {
  常识: "常识判断",
  言语理解: "言语理解与表达"
};

const trendSeriesColors: Record<string, string> = {
  overall: "var(--brand)",
  政治理论: "#2563eb",
  常识判断: "#22c55e",
  言语理解与表达: "#0ea5e9",
  数量关系: "#ef4444",
  判断推理: "#14b8a6",
  资料分析: "#eab308"
};

const trendFallbackColors = [
  "#2563eb",
  "#22c55e",
  "#0ea5e9",
  "#ef4444",
  "#14b8a6",
  "#eab308",
  "#f97316",
  "#0f766e"
];

const maxTrendVisibleCountDesktop = 18;
const maxTrendVisibleCountMobile = 8;
const trendMobileBreakpoint = 720;

const baseSeasonDate = "2025-12-21";
const baseNationalSeasonIndex = 3;
const baseProvincialSeasonNumber = 4;
const seasons = ["一", "二", "三", "四"];

type Metric = {
  subject: string;
  correct: number | null;
  total: number | null;
  timeMinutes: number | null;
  accuracy: number | null;
};

type ManualEntry = {
  subject: string;
  correct: string;
  total: string;
  timeMinutes: string;
};

type AnalysisResponse = {
  summary?: string;
  details?: string[];
  speedFocus?: string[];
  practiceFocus?: string[];
  targets?: string[];
  nextWeekPlan?: string[];
  metrics?: Metric[];
  overall?: { accuracy?: number | null; timeTotalMinutes?: number | null };
  model?: string | null;
  raw?: string;
  historyId?: string;
};

type HistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  summary: string;
  overallAccuracy: number | null;
  timeTotalMinutes: number | null;
  metrics: Metric[];
  analysis?: AnalysisResponse | null;
  analysisRaw?: string | null;
};

type UploadImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type RequestState = "idle" | "loading" | "error";
type TitlePreset = "provincial" | "national" | "custom";
type FocusColumn = "input" | "result" | "history";

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

function formatTrendDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getBeijingDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + 8 * 60 * 60 * 1000);
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return start;
}

function normalizeSubjectName(subject: string) {
  const trimmed = subject.trim();
  if (!trimmed) {
    return "";
  }
  return subjectAliases[trimmed] ?? trimmed;
}

function getMaxVisibleCount(viewportWidth: number) {
  if (!viewportWidth || !Number.isFinite(viewportWidth)) {
    return maxTrendVisibleCountDesktop;
  }
  return viewportWidth <= trendMobileBreakpoint
    ? maxTrendVisibleCountMobile
    : maxTrendVisibleCountDesktop;
}

function formatChineseNumber(value: number) {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (value <= 10) {
    return value === 10 ? "十" : digits[value] ?? "一";
  }
  if (value < 20) {
    return `十${digits[value % 10] ?? ""}`;
  }
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return `${digits[tens] ?? ""}十${ones ? digits[ones] : ""}`;
}

function getDefaultMockTitles() {
  const now = getBeijingDate();
  const weekStart = getWeekStart(now);
  const base = new Date(`${baseSeasonDate}T00:00:00+08:00`);
  const diffWeeks = Math.floor(
    (weekStart.getTime() - base.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const examYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const nationalRawSeason = baseNationalSeasonIndex - 1 + diffWeeks;
  const nationalSeasonIndex = ((nationalRawSeason % 4) + 4) % 4;
  const provincialSeasonNumber = Math.max(1, baseProvincialSeasonNumber + diffWeeks);
  return {
    national: `${examYear}粉笔模考（国考）第${seasons[nationalSeasonIndex]}季`,
    provincial: `${examYear}粉笔模考（省考）第${formatChineseNumber(
      provincialSeasonNumber
    )}季`
  };
}

function buildManualMetrics(entries: ManualEntry[]) {
  return entries.flatMap((entry) => {
    const subject = normalizeSubjectName(entry.subject);
    const hasCorrect = entry.correct.trim().length > 0;
    const hasTotal = entry.total.trim().length > 0;
    if (!subject || !hasCorrect || !hasTotal) {
      return [];
    }
    const correct = Number(entry.correct);
    const total = Number(entry.total);
    if (!Number.isFinite(correct) || !Number.isFinite(total)) {
      return [];
    }
    const time = entry.timeMinutes.trim().length
      ? Number(entry.timeMinutes)
      : null;
    return [
      {
        subject,
        correct,
        total,
        timeMinutes: Number.isFinite(time) ? time : undefined
      }
    ];
  });
}

function normalizeAccuracy(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  let normalized = value;
  if (normalized > 1 && normalized <= 100) {
    normalized = normalized / 100;
  } else if (normalized > 1000) {
    normalized = normalized / 10000;
  }
  if (normalized < 0) {
    normalized = 0;
  }
  if (normalized > 1) {
    normalized = 1;
  }
  return normalized;
}

function formatAccuracy(value: number | null | undefined, digits = 1) {
  const normalized = normalizeAccuracy(value);
  if (normalized === null) {
    return "未知";
  }
  return `${(normalized * 100).toFixed(digits)}%`;
}

function formatAccuracyDelta(current: number | null, previous: number | null, digits = 1) {
  if (typeof current !== "number" || typeof previous !== "number") {
    return { text: "—", direction: "none" as const };
  }
  const diff = current - previous;
  if (!Number.isFinite(diff)) {
    return { text: "—", direction: "none" as const };
  }
  const text = `${diff > 0 ? "+" : ""}${(diff * 100).toFixed(digits)}%`;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  return { text, direction };
}

function formatMinutes(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "未知";
  }
  return `${value.toFixed(digits)} 分钟`;
}

function computeOverallAccuracy(metrics: Metric[]) {
  const totals = metrics.reduce(
    (acc, metric) => {
      if (typeof metric.correct === "number") {
        acc.correct += metric.correct;
      }
      if (typeof metric.total === "number") {
        acc.total += metric.total;
      }
      return acc;
    },
    { correct: 0, total: 0 }
  );
  if (!totals.total) {
    return null;
  }
  return totals.correct / totals.total;
}

function getMetricAccuracy(metric?: Metric | null) {
  if (!metric) {
    return null;
  }
  if (
    typeof metric.correct === "number" &&
    typeof metric.total === "number" &&
    metric.total > 0
  ) {
    return normalizeAccuracy(metric.correct / metric.total);
  }
  return normalizeAccuracy(metric.accuracy ?? null);
}

function getHistoryOverallAccuracy(item: HistoryItem) {
  const provided = normalizeAccuracy(item.overallAccuracy);
  if (provided !== null) {
    return provided;
  }
  return normalizeAccuracy(computeOverallAccuracy(item.metrics));
}

function getLastValue(values: Array<number | null>) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (typeof value === "number") {
      return value;
    }
  }
  return null;
}

function buildLinePath(points: Array<{ x: number; y: number | null }>) {
  let path = "";
  let started = false;
  points.forEach((point) => {
    if (point.y === null) {
      started = false;
      return;
    }
    if (!started) {
      path += `M ${point.x} ${point.y}`;
      started = true;
    } else {
      path += ` L ${point.x} ${point.y}`;
    }
  });
  return path;
}

function getXAxisLabelIndices(count: number, maxVisibleCount: number) {
  if (count <= maxVisibleCount) {
    return Array.from({ length: count }, (_, index) => index);
  }
  return [0, Math.floor(count / 3), Math.floor((2 * count) / 3), count - 1];
}

function parseJsonAnalysis(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const withBraces = candidate.startsWith("{") && candidate.endsWith("}")
    ? candidate
    : null;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const sliced =
    start >= 0 && end > start ? candidate.slice(start, end + 1) : null;
  const payload = withBraces ?? sliced;
  if (!payload) {
    return null;
  }
  try {
    const parsed = JSON.parse(payload);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as AnalysisResponse;
  } catch {
    return null;
  }
}

function normalizeAnalysis(data: AnalysisResponse) {
  if (data.raw) {
    const parsed = parseJsonAnalysis(data.raw);
    if (parsed) {
      const summary =
        typeof data.summary === "string" && data.summary.trim()
          ? data.summary
          : parsed.summary;
      const details =
        Array.isArray(data.details) && data.details.length
          ? data.details
          : parsed.details;
      const speedFocus =
        Array.isArray(data.speedFocus) && data.speedFocus.length
          ? data.speedFocus
          : parsed.speedFocus;
      const practiceFocus =
        Array.isArray(data.practiceFocus) && data.practiceFocus.length
          ? data.practiceFocus
          : parsed.practiceFocus;
      const targets =
        Array.isArray(data.targets) && data.targets.length
          ? data.targets
          : parsed.targets;
      const nextWeekPlan =
        Array.isArray(data.nextWeekPlan) && data.nextWeekPlan.length
          ? data.nextWeekPlan
          : parsed.nextWeekPlan;
      const metrics =
        Array.isArray(data.metrics) && data.metrics.length
          ? data.metrics
          : parsed.metrics;
      const overall = data.overall ?? parsed.overall;
      const model = data.model ?? parsed.model;
      return {
        ...data,
        summary,
        details,
        speedFocus,
        practiceFocus,
        targets,
        nextWeekPlan,
        metrics,
        overall,
        model,
        raw: undefined
      };
    }
  }
  return data;
}

function hasStructuredAnalysis(data: AnalysisResponse) {
  if (typeof data.summary === "string" && data.summary.trim()) {
    return true;
  }
  if (Array.isArray(data.details) && data.details.length) {
    return true;
  }
  if (Array.isArray(data.speedFocus) && data.speedFocus.length) {
    return true;
  }
  if (Array.isArray(data.practiceFocus) && data.practiceFocus.length) {
    return true;
  }
  if (Array.isArray(data.targets) && data.targets.length) {
    return true;
  }
  if (Array.isArray(data.nextWeekPlan) && data.nextWeekPlan.length) {
    return true;
  }
  if (Array.isArray(data.metrics) && data.metrics.length) {
    return true;
  }
  if (
    typeof data.overall?.accuracy === "number" ||
    typeof data.overall?.timeTotalMinutes === "number"
  ) {
    return true;
  }
  return false;
}

function buildAnalysisMarkdown(data: AnalysisResponse) {
  const normalized = normalizeAnalysis(data);
  if (!hasStructuredAnalysis(normalized) && normalized.raw) {
    return normalized.raw;
  }
  const lines: string[] = [];
  const metrics = Array.isArray(normalized.metrics) ? normalized.metrics : [];
  const overallAccuracy = formatAccuracy(
    normalizeAccuracy(normalized.overall?.accuracy) ??
      computeOverallAccuracy(metrics)
  );
  const overallTime = formatMinutes(normalized.overall?.timeTotalMinutes, 1);
  lines.push(`### 整体指标`);
  lines.push(`- 正确率：${overallAccuracy}`);
  lines.push(`- 总用时：${overallTime}`);

  if (metrics.length) {
    lines.push("");
    lines.push(`### 分科数据`);
    lines.push("");
    lines.push(`| 科目 | 正确/总 | 正确率 | 用时 |`);
    lines.push(`| --- | --- | --- | --- |`);
    metrics.forEach((metric) => {
      const correct =
        typeof metric.correct === "number" ? metric.correct : "-";
      const total = typeof metric.total === "number" ? metric.total : "-";
      const accuracyValue =
        typeof metric.correct === "number" &&
        typeof metric.total === "number" &&
        metric.total > 0
          ? metric.correct / metric.total
          : metric.accuracy;
      const accuracy = formatAccuracy(accuracyValue, 1);
      const time =
        typeof metric.timeMinutes === "number"
          ? `${metric.timeMinutes.toFixed(1)}m`
          : "未知";
      lines.push(`| ${metric.subject} | ${correct}/${total} | ${accuracy} | ${time} |`);
    });
  }

  if (normalized.summary) {
    lines.push("");
    lines.push(`### 整体点评`);
    lines.push(normalized.summary);
  }
  if (normalized.details && normalized.details.length) {
    lines.push("");
    lines.push(`### 细节点评`);
    normalized.details.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.speedFocus && normalized.speedFocus.length) {
    lines.push("");
    lines.push(`### 提速关注`);
    normalized.speedFocus.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.practiceFocus && normalized.practiceFocus.length) {
    lines.push("");
    lines.push(`### 重点练习`);
    normalized.practiceFocus.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.targets && normalized.targets.length) {
    lines.push("");
    lines.push(`### 强化目标`);
    normalized.targets.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.nextWeekPlan && normalized.nextWeekPlan.length) {
    lines.push("");
    lines.push(`### 下周学习计划`);
    normalized.nextWeekPlan.forEach((item) => lines.push(`- ${item}`));
  }
  return lines.join("\n");
}

type InputMethod = "image" | "manual";

export default function MockReportPage() {
  const [title, setTitle] = useState("");
  const [titlePreset, setTitlePreset] = useState<TitlePreset>("provincial");
  const [note, setNote] = useState("");
  const [uploads, setUploads] = useState<UploadImage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [trendFilter, setTrendFilter] = useState<string>("all");
  const [trendViewportWidth, setTrendViewportWidth] = useState<number>(0);
  const [selectedTrendIndex, setSelectedTrendIndex] = useState<number | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>("image");
  const [focusColumn, setFocusColumn] = useState<FocusColumn>("input");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareGenerating, setShareGenerating] = useState(false);
  const [shareAnalysisGenerating, setShareAnalysisGenerating] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const trendScrollRef = useRef<HTMLDivElement | null>(null);
  const trendCardRef = useRef<HTMLDivElement | null>(null);
  const analysisCardRef = useRef<HTMLDivElement | null>(null);

  const [manualEntries, setManualEntries] = useState<ManualEntry[]>(() =>
    manualSubjects.map((subject) => ({
      subject,
      correct: "",
      total: "",
      timeMinutes: ""
    }))
  );

  const manualMetrics = useMemo(
    () => buildManualMetrics(manualEntries),
    [manualEntries]
  );

  const defaultTitles = useMemo(() => getDefaultMockTitles(), []);

  useEffect(() => {
    if (titlePreset === "custom") {
      return;
    }
    setTitle(defaultTitles[titlePreset]);
  }, [defaultTitles, titlePreset]);

  const loadHistory = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistory([]);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/mock/reports?limit=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.history)) {
        setHistory(
          data.history.map((item: Record<string, unknown>) => {
            const analysis = item.analysis as Record<string, unknown> | null | undefined;
            const analysisRaw =
              typeof item.analysisRaw === "string" ? item.analysisRaw : null;
            return {
              id: String(item.id),
              title: String(item.title ?? "模考成绩解读"),
              createdAt: String(item.createdAt),
              summary:
                typeof analysis?.summary === "string"
                  ? String(analysis.summary)
                  : analysisRaw
                  ? analysisRaw.slice(0, 120)
                  : "",
              overallAccuracy:
                typeof item.overallAccuracy === "number"
                  ? item.overallAccuracy
                  : null,
              timeTotalMinutes:
                typeof item.timeTotalMinutes === "number"
                  ? item.timeTotalMinutes
                  : null,
              metrics: Array.isArray(item.metrics)
                ? (item.metrics as Metric[])
                : [],
              analysis: (item.analysis ?? null) as AnalysisResponse | null,
              analysisRaw
            };
          })
        );
      }
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  useEffect(() => {
    const node = trendScrollRef.current;
    if (!node) {
      return;
    }
    const updateWidth = () => {
      setTrendViewportWidth(node.clientWidth || 0);
    };
    updateWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);
    return () => observer.disconnect();
  }, [history.length]);

  useEffect(() => {
    return () => {
      uploads.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [uploads]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }
    const next: UploadImage[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > 8) {
        continue;
      }
      next.push({
        id: makeId(),
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
    setUploads((prev) => [...prev, ...next].slice(0, 3));
    event.target.value = "";
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateManualEntry = (
    index: number,
    field: keyof ManualEntry,
    value: string
  ) => {
    setManualEntries((prev) =>
      prev.map((entry, current) =>
        current === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const buildHistoryPayload = () => {
    return history.slice(0, 3).map((item) => ({
      date: item.createdAt,
      metrics: item.metrics.map((metric) => ({
        subject: normalizeSubjectName(metric.subject),
        correct: metric.correct ?? undefined,
        total: metric.total ?? undefined,
        timeMinutes: metric.timeMinutes ?? undefined
      })),
      overallAccuracy: item.overallAccuracy ?? undefined,
      timeTotalMinutes: item.timeTotalMinutes ?? undefined
    }));
  };

  const handleDeleteHistory = async (id: string) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setMessage("请先登录后再删除记录。");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/mock/reports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "删除失败");
      }
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "删除失败");
    }
  };

  const buildShareContainer = (
    clone: HTMLElement,
    sourceEl: HTMLElement,
    options?: { maxWidth?: string; fixedWidth?: string }
  ) => {
    const sourceStyles = window.getComputedStyle(sourceEl);
    const rootStyles = window.getComputedStyle(document.documentElement);
    const cardBackground = sourceStyles.backgroundColor || "#ffffff";
    const cardRadius = sourceStyles.borderRadius || "16px";
    const brandColor = rootStyles.getPropertyValue("--brand").trim() || "#ff6b4a";
    const brandDark = rootStyles.getPropertyValue("--brand-dark").trim() || "#ff5333";

    clone.style.boxShadow = "none";
    clone.style.border = "none";
    clone.style.margin = "0";

    const container = document.createElement("div");
    container.style.cssText = `
      position: relative;
      display: inline-block;
      background: ${cardBackground};
      border-radius: ${cardRadius};
      overflow: hidden;
    `;

    if (options?.fixedWidth) {
      container.style.width = options.fixedWidth;
      clone.style.width = "100%";
    }

    if (options?.maxWidth) {
      container.style.maxWidth = options.maxWidth;
    }

    const contentArea = document.createElement("div");
    contentArea.style.cssText = `
      padding: 0;
      background: transparent;
    `;
    if (options?.fixedWidth) {
      contentArea.style.width = "100%";
    }
    contentArea.appendChild(clone);
    container.appendChild(contentArea);

    const watermarkBar = document.createElement("div");
    watermarkBar.style.cssText = `
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, ${brandColor} 0%, ${brandDark} 100%);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 18px;
    `;

    const brandCard = document.createElement("div");
    brandCard.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.9) 100%);
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
    `;

    const logoImg = document.createElement("img");
    logoImg.src = "/icon-96.png";
    logoImg.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 6px;
      object-fit: cover;
    `;

    const brandDomain = document.createElement("span");
    brandDomain.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      color: #7b7b80;
      letter-spacing: 0.04em;
    `;
    brandDomain.textContent = "学了么.com";

    brandCard.appendChild(logoImg);
    brandCard.appendChild(brandDomain);
    watermarkBar.appendChild(brandCard);
    container.appendChild(watermarkBar);

    return container;
  };

  const handleShareTrend = async () => {
    if (!trendCardRef.current) return;

    setShareGenerating(true);
    try {
      // 动态导入 html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // 克隆趋势图卡片
      const clone = trendCardRef.current.cloneNode(true) as HTMLElement;

      // 移除克隆中的分享按钮
      const shareBtn = clone.querySelector('.share-button');
      if (shareBtn?.parentElement) {
        shareBtn.parentElement.removeChild(shareBtn);
      }

      const trendScroll = clone.querySelector('.mock-trend-scroll') as HTMLElement | null;
      if (trendScroll) {
        trendScroll.style.width = "100%";
        trendScroll.style.marginLeft = "0";
        trendScroll.style.marginRight = "0";
      }

      const captureWidth =
        trendViewportWidth || (typeof window !== "undefined" ? window.innerWidth : 0);

      // 创建容器
      const container = buildShareContainer(clone, trendCardRef.current, {
        fixedWidth: captureWidth ? `${captureWidth}px` : undefined
      });

      // 临时添加到DOM
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // 生成截图
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      // 清理临时DOM
      document.body.removeChild(container);

      // 转换为图片URL
      const imageUrl = canvas.toDataURL('image/png');
      setShareImageUrl(imageUrl);
      setShareModalOpen(true);
    } catch (err) {
      console.error('生成分享图片失败:', err);
      setMessage('生成分享图片失败，请重试');
    } finally {
      setShareGenerating(false);
    }
  };

  const handleShareAnalysis = async () => {
    if (!analysisCardRef.current) return;

    setShareAnalysisGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      const clone = analysisCardRef.current.cloneNode(true) as HTMLElement;

      // 移除克隆中的分享按钮
      const shareBtn = clone.querySelector('.share-button');
      if (shareBtn?.parentElement) {
        shareBtn.parentElement.removeChild(shareBtn);
      }

      const container = buildShareContainer(clone, analysisCardRef.current, {
        maxWidth: "800px"
      });

      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      document.body.removeChild(container);

      const imageUrl = canvas.toDataURL('image/png');
      setShareImageUrl(imageUrl);
      setShareModalOpen(true);
    } catch (err) {
      console.error('生成分享图片失败:', err);
      setMessage('生成分享图片失败，请重试');
    } finally {
      setShareAnalysisGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!shareImageUrl) return;

    try {
      const blob = await (await fetch(shareImageUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedSuccess(true);
      setMessage('已复制到剪贴板');
      setTimeout(() => {
        setCopiedSuccess(false);
        setMessage(null);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      setMessage('复制失败，请使用下载功能');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleDownloadImage = async () => {
    if (!shareImageUrl) return;

    const filename = `学了么-模考正确率走势-${new Date().toLocaleDateString('zh-CN')}.png`;

    try {
      const blob = await (await fetch(shareImageUrl)).blob();
      const file = new File([blob], filename, { type: blob.type || "image/png" });

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        let canShareFiles = false;
        try {
          canShareFiles = navigator.canShare({ files: [file] });
        } catch {
          canShareFiles = false;
        }
        if (canShareFiles) {
          try {
            await navigator.share({
              files: [file],
              title: "模考成绩解读",
              text: "分享模考解读结果"
            });
            setMessage("已打开分享");
            setTimeout(() => setMessage(null), 1500);
            return;
          } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
              return;
            }
          }
        }
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (err) {
      console.error("保存失败:", err);
      setMessage("保存失败，请重试");
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleAnalyze = async () => {
    if (state === "loading") {
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setState("error");
      setMessage("请先登录后使用模考解读。");
      return;
    }
    if (!uploads.length && !manualMetrics.length) {
      setState("error");
      setMessage("请上传图片或填写手动数据。");
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const images = await Promise.all(
        uploads.map(
          (item) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error("读取图片失败"));
              reader.readAsDataURL(item.file);
            })
        )
      );
      const res = await fetch(`${apiBase}/ai/mock/analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          images,
          metrics: manualMetrics,
          title: title.trim() || undefined,
          note: note.trim() || undefined,
          history: buildHistoryPayload()
        })
      });
      const data = (await res.json()) as AnalysisResponse;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "解析失败");
      }
      setAnalysis(data);
      setState("idle");
      setFocusColumn("result"); // 切换焦点到结果列
      const markdown = buildAnalysisMarkdown(data);
      const overallAccuracy =
        typeof data.overall?.accuracy === "number" ? data.overall.accuracy : null;
      const timeTotalMinutes =
        typeof data.overall?.timeTotalMinutes === "number"
          ? data.overall.timeTotalMinutes
          : null;
      const metrics = Array.isArray(data.metrics) ? data.metrics : [];
      if (data.historyId) {
        await loadHistory();
      } else {
        setHistory((prev) => [
          {
            id: makeId(),
            title: title.trim() || "模考成绩解读",
            createdAt: new Date().toISOString(),
            summary: data.summary || markdown.slice(0, 120),
            overallAccuracy,
            timeTotalMinutes,
            metrics,
            analysis: data,
            analysisRaw: data.raw ?? null
          },
          ...prev
        ].slice(0, 30));
      }
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "解析失败");
    }
  };

  const analysisMarkdown = useMemo(
    () => (analysis ? buildAnalysisMarkdown(analysis) : ""),
    [analysis]
  );

  const trendData = useMemo(() => {
    const sorted = [...history]
      .filter((item) => item.createdAt)
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    const normalizedHistory = sorted.map((item) => ({
      ...item,
      normalizedMetrics: item.metrics
        .map((metric) => ({
          ...metric,
          subject: normalizeSubjectName(metric.subject)
        }))
        .filter((metric) => metric.subject)
    }));
    const labels = normalizedHistory.map((item) => formatTrendDate(item.createdAt));
    const subjectSet = new Set<string>();
    normalizedHistory.forEach((item) => {
      item.normalizedMetrics.forEach((metric) => {
        if (metric.subject) {
          subjectSet.add(metric.subject);
        }
      });
    });
    const extraSubjects = Array.from(subjectSet)
      .filter((subject) => !manualSubjects.includes(subject))
      .sort();
    const subjects = [
      ...manualSubjects,
      ...extraSubjects.filter((subject) => !manualSubjects.includes(subject))
    ].filter((subject, index, list) => list.indexOf(subject) === index);

    const overallValues = normalizedHistory.map((item) =>
      getHistoryOverallAccuracy(item)
    );
    const overallHasData = overallValues.some((value) => value !== null);
    const seriesList = [
      {
        key: "overall",
        label: "整体",
        color: trendSeriesColors.overall,
        values: overallValues,
        hasData: overallHasData,
        latest: getLastValue(overallValues)
      },
      ...subjects.map((subject, index) => {
        const values = normalizedHistory.map((item) => {
          const metric = item.normalizedMetrics.find(
            (entry) => entry.subject === subject
          );
          return getMetricAccuracy(metric ?? null);
        });
        return {
          key: subject,
          label: subject,
          color:
            trendSeriesColors[subject] ??
            trendFallbackColors[index % trendFallbackColors.length],
          values,
          hasData: values.some((value) => value !== null),
          latest: getLastValue(values)
        };
      })
    ];

    const rangeText =
      normalizedHistory.length > 1
        ? `${formatTrendDate(normalizedHistory[0].createdAt)} - ${formatTrendDate(
            normalizedHistory[normalizedHistory.length - 1].createdAt
          )}`
        : normalizedHistory.length === 1
        ? formatTrendDate(normalizedHistory[0].createdAt)
        : "暂无记录";

    const entries = normalizedHistory.map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: item.createdAt,
      overallAccuracy: getHistoryOverallAccuracy(item),
      metrics: item.normalizedMetrics
    }));

    return {
      labels,
      records: normalizedHistory.length,
      seriesList,
      rangeText,
      entries
    };
  }, [history]);

  const chartLayout = useMemo(() => {
    const fallbackViewportWidth =
      typeof window !== "undefined" && window.innerWidth
        ? window.innerWidth
        : 680;
    const height = 240;
    const padding = { top: 20, right: 16, bottom: 32, left: 44 };
    const count = trendData.labels.length;
    const viewportWidth = Math.max(
      0,
      Math.floor(trendViewportWidth || fallbackViewportWidth)
    );
    const maxVisibleCount = getMaxVisibleCount(viewportWidth);
    const plotWidthForVisible = Math.max(
      1,
      viewportWidth - padding.left - padding.right
    );
    const slotSpacing = plotWidthForVisible / Math.max(1, maxVisibleCount - 1);
    const plotWidth = slotSpacing * Math.max(0, count - 1);
    const rawChartWidth = padding.left + padding.right + plotWidth;
    const chartWidth =
      count <= maxVisibleCount ? viewportWidth : Math.max(viewportWidth, rawChartWidth);
    const plotHeight = height - padding.top - padding.bottom;
    const getX = (index: number) => {
      if (count <= 1) {
        return padding.left;
      }
      return padding.left + slotSpacing * index;
    };
    const getY = (value: number) => padding.top + (1 - value) * plotHeight;
    const seriesWithPoints = trendData.seriesList.map((series) => ({
      ...series,
      points: series.values.map((value, index) => ({
        value,
        x: getX(index),
        y: value === null ? null : getY(value)
      }))
    }));
    return {
      chartWidth,
      viewportWidth,
      maxVisibleCount,
      slotSpacing,
      height,
      padding,
      count,
      seriesWithPoints,
      xLabelIndices: getXAxisLabelIndices(count, maxVisibleCount),
      shouldScroll: chartWidth > viewportWidth + 1
    };
  }, [trendData, trendViewportWidth]);

  const availableSeries = useMemo(
    () => chartLayout.seriesWithPoints.filter((series) => series.hasData),
    [chartLayout.seriesWithPoints]
  );

  const visibleSeries = useMemo(() => {
    if (trendFilter === "all") {
      return availableSeries;
    }
    const selected = availableSeries.find((series) => series.key === trendFilter);
    return selected ? [selected] : availableSeries;
  }, [availableSeries, trendFilter]);

  const activeTrendIndex = useMemo(() => {
    if (!trendData.entries.length) {
      return null;
    }
    const fallbackIndex = trendData.entries.length - 1;
    if (selectedTrendIndex === null || selectedTrendIndex > fallbackIndex) {
      return fallbackIndex;
    }
    return selectedTrendIndex;
  }, [selectedTrendIndex, trendData.entries.length]);

  const activeTrendEntry = useMemo(() => {
    if (activeTrendIndex === null) {
      return null;
    }
    return trendData.entries[activeTrendIndex] ?? null;
  }, [activeTrendIndex, trendData.entries]);

  const trendDelta = useMemo(() => {
    if (activeTrendIndex === null) {
      return { text: "—", direction: "none" as const };
    }
    const current = trendData.entries[activeTrendIndex]?.overallAccuracy ?? null;
    let previous: number | null = null;
    for (let index = activeTrendIndex - 1; index >= 0; index -= 1) {
      const value = trendData.entries[index]?.overallAccuracy ?? null;
      if (typeof value === "number") {
        previous = value;
        break;
      }
    }
    return formatAccuracyDelta(current, previous, 1);
  }, [activeTrendIndex, trendData.entries]);

  useEffect(() => {
    if (!trendData.entries.length) {
      setSelectedTrendIndex(null);
      return;
    }
    setSelectedTrendIndex((prev) => {
      if (prev === null || prev >= trendData.entries.length) {
        return trendData.entries.length - 1;
      }
      return prev;
    });
  }, [trendData.entries.length]);

  const handleTrendClick = (event: MouseEvent<SVGSVGElement>) => {
    if (!trendData.entries.length) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const rawIndex = Math.round(
      (x - chartLayout.padding.left) / Math.max(1, chartLayout.slotSpacing)
    );
    const clamped = Math.min(
      Math.max(rawIndex, 0),
      Math.max(0, trendData.entries.length - 1)
    );
    setSelectedTrendIndex(clamped);
  };

  const activeX =
    activeTrendIndex === null
      ? null
      : chartLayout.padding.left + chartLayout.slotSpacing * activeTrendIndex;

  useEffect(() => {
    const node = trendScrollRef.current;
    if (!node) {
      return;
    }
    if (trendData.records > chartLayout.maxVisibleCount) {
      requestAnimationFrame(() => {
        node.scrollLeft = node.scrollWidth - node.clientWidth;
      });
    } else {
      node.scrollLeft = 0;
    }
  }, [
    trendData.records,
    chartLayout.chartWidth,
    chartLayout.viewportWidth,
    chartLayout.maxVisibleCount
  ]);

  return (
    <main className="main mock-page">
      <section className="mock-hero">
        <div>
          <p className="eyebrow">模考成绩解读</p>
          <h1>用数据还原你的模考表现</h1>
          <p className="lead">
            上传粉笔模考成绩截图或手动填写正确率/时间，AI 自动识别并给出整体
            点评、提速建议和下周训练计划。
          </p>
        </div>
        <div className="status-card">
          <div className="status-title">输入方式</div>
          <div className="status-lines">
            <span>图片识别：最多 3 张截图。</span>
            <span>手动输入：格式如“常识判断 13/20 7m”。</span>
            <span>会结合历史记录生成趋势建议。</span>
          </div>
        </div>
      </section>

      {/* 三列动态布局 */}
      <section
        className={`mock-three-column focus-${focusColumn}`}
        style={{
          gridTemplateColumns:
            focusColumn === 'input' ? '2fr 1fr 1fr' :
            focusColumn === 'result' ? '0.8fr 2.4fr 0.8fr' :
            '0.8fr 0.8fr 2.4fr'
        }}
      >
        {/* 第一列：输入区域 */}
        <div
          className={`mock-column mock-column-input ${focusColumn === 'input' ? 'is-focused' : ''}`}
          onClick={() => setFocusColumn('input')}
        >
          <div className="mock-card">
          <div className={`mock-card-header${analysis ? " has-share" : ""}`}>
              <div>
                <h3>成绩输入</h3>
                {focusColumn !== 'input' && (
                  <p className="form-message">点击展开输入</p>
                )}
              </div>
            </div>

            {/* 只在焦点时显示完整内容 */}
            {focusColumn === 'input' && (
              <>
                <div className="form-row">
                  <label htmlFor="mock-title-preset">模考名称</label>
                  <select
                    id="mock-title-preset"
                    value={titlePreset}
                    onChange={(event) => {
                      const newPreset = event.target.value as TitlePreset;
                      setTitlePreset(newPreset);
                      if (newPreset !== "custom") {
                        setTitle(defaultTitles[newPreset]);
                      }
                    }}
                  >
                    <option value="provincial">{defaultTitles.provincial}</option>
                    <option value="national">{defaultTitles.national}</option>
                    <option value="custom">自定义名称</option>
                  </select>
                  {titlePreset === "custom" && (
                    <input
                      id="mock-title-custom"
                      value={title}
                      placeholder="例如：粉笔 2025 国考模考一"
                      onChange={(event) => setTitle(event.target.value)}
                      className="mock-custom-input"
                    />
                  )}
                </div>

                {/* Tab Navigation */}
                <div className="input-method-tabs">
                  <button
                    type="button"
                    className={`input-method-tab ${inputMethod === "image" ? "active" : ""}`}
                    onClick={() => setInputMethod("image")}
                  >
                    <svg
                      className="input-method-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    图片识别
                  </button>
                  <button
                    type="button"
                    className={`input-method-tab ${inputMethod === "manual" ? "active" : ""}`}
                    onClick={() => setInputMethod("manual")}
                  >
                    <svg
                      className="input-method-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    手动填写
                  </button>
                </div>

                {/* Tab Content - Image Upload */}
                {inputMethod === "image" && (
                  <div className="input-method-content">
                    <div className="mock-upload">
                      <label className="upload-button">
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} />
                        <svg
                          className="upload-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        选择成绩截图
                      </label>
                      <span className="form-message">支持 JPG、PNG 格式，单张不超过 8MB，最多 3 张</span>
                    </div>

                    {uploads.length ? (
                      <div className="mock-upload-list">
                        {uploads.map((item) => (
                          <div key={item.id} className="mock-upload-item">
                            <img src={item.previewUrl} alt="模考截图" />
                            <button
                              type="button"
                              className="ghost danger"
                              onClick={() => removeUpload(item.id)}
                              aria-label="删除图片"
                            >
                              删除
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <svg
                          className="empty-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <p>暂无截图</p>
                        <span>AI 会自动识别图片中的成绩数据</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content - Manual Input */}
                {inputMethod === "manual" && (
                  <div className="input-method-content">
                    <div className="manual-input-header">
                      <p>请填写各科目的正确题数、总题数和用时（分钟）</p>
                      <span className="form-message">只需填写正确与总题数，时间可选填</span>
                    </div>

                    <div className="mock-manual-grid">
                      {manualEntries.map((entry, index) => (
                        <div key={entry.subject} className="mock-manual-row">
                          <span className="mock-manual-subject">{entry.subject}</span>
                          <div className="mock-manual-inputs">
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              placeholder="正确"
                              value={entry.correct}
                              onChange={(event) =>
                                updateManualEntry(index, "correct", event.target.value)
                              }
                              aria-label={`${entry.subject} 正确题数`}
                            />
                            <span>/</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              placeholder="总题"
                              value={entry.total}
                              onChange={(event) =>
                                updateManualEntry(index, "total", event.target.value)
                              }
                              aria-label={`${entry.subject} 总题数`}
                            />
                            <input
                              type="number"
                              min="0"
                              inputMode="decimal"
                              placeholder="分钟"
                              value={entry.timeMinutes}
                              onChange={(event) =>
                                updateManualEntry(index, "timeMinutes", event.target.value)
                              }
                              aria-label={`${entry.subject} 用时`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {manualMetrics.length > 0 && (
                      <div className="manual-summary">
                        <svg
                          className="summary-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        已填写 {manualMetrics.length} 个科目
                      </div>
                    )}
                  </div>
                )}

                <div className="form-row">
                  <label htmlFor="mock-note">补充说明</label>
                  <textarea
                    id="mock-note"
                    rows={3}
                    placeholder="例如：这次主要练习言语理解与表达，时间偏紧"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>

                <div className="assist-actions">
                  <LoadingButton
                    type="button"
                    className="primary"
                    loading={state === "loading"}
                    loadingText="生成中..."
                    onClick={handleAnalyze}
                  >
                    生成模考点评
                  </LoadingButton>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setAnalysis(null);
                      setMessage(null);
                      setState("idle");
                    }}
                  >
                    清空结果
                  </button>
                </div>

                {message ? <p className="form-message">{message}</p> : null}
                {state === "loading" ? (
                  <p className="form-message">AI 正在生成解析...</p>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* 第二列：分析结果 */}
        <div
          className={`mock-column mock-column-result ${focusColumn === 'result' ? 'is-focused' : ''}`}
          onClick={() => analysis && setFocusColumn('result')}
        >
          <div className="mock-card" ref={analysisCardRef}>
            <div className="mock-card-header">
              <h3>成绩点评</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {focusColumn !== 'result' && analysis && (
                  <span className="form-message">点击展开</span>
                )}
                {analysis && (
                  <button
                    type="button"
                    className="ghost share-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareAnalysis();
                    }}
                    disabled={shareAnalysisGenerating}
                    title="分享分析报告"
                  >
                    <span className="share-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        width="16"
                        height="16"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </span>
                    <span className="share-text">
                      {shareAnalysisGenerating ? '生成中...' : '分享'}
                    </span>
                  </button>
                )}
              </div>
            </div>
            {analysis ? (
              <div className="assist-output">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysisMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="knowledge-empty">提交数据后显示点评，或查看历史点评</div>
            )}
          </div>
        </div>

        {/* 第三列：历史记录 */}
        <div
          className={`mock-column mock-column-history ${focusColumn === 'history' ? 'is-focused' : ''}`}
        >
          <div className="mock-card" onClick={() => history.length > 0 && setFocusColumn('history')}>
            <div className="mock-card-header">
              <h3>历史记录</h3>
              {focusColumn !== 'history' && history.length > 0 && (
                <span className="form-message">点击展开</span>
              )}
            </div>
            <div className="mock-history-list" onClick={(e) => e.stopPropagation()}>
              {history.length ? (
                history.map((item) => (
                  <div
                    key={item.id}
                    className={`mock-history-item ${focusColumn === 'history' ? 'expanded' : 'compact'}`}
                    onClick={() => {
                      setAnalysis(
                        item.analysis ?? (item.analysisRaw ? { raw: item.analysisRaw } : null)
                      );
                      setFocusColumn('result');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mock-history-header">
                      <div>
                        <strong>{item.title}</strong>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      {focusColumn === 'history' && (
                        <div className="mock-history-actions">
                          <button
                            type="button"
                            className="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnalysis(
                                item.analysis ?? (item.analysisRaw ? { raw: item.analysisRaw } : null)
                              );
                              setFocusColumn('result');
                            }}
                          >
                            查看
                          </button>
                          <button
                            type="button"
                            className="ghost danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistory(item.id);
                            }}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                    {focusColumn === 'history' && <p>{item.summary}</p>}
                  </div>
                ))
              ) : (
                <div className="knowledge-empty">暂无历史记录</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 历史趋势图（保持不变）*/}
      <section className="mock-grid">
        <div className="mock-card mock-trend" ref={trendCardRef}>
          <div className="mock-card-header mock-trend-header has-share">
            <div>
              <h3>历史正确率走势</h3>
              <span className="form-message">
                覆盖常识判断、政治理论、言语理解与表达、数量关系、判断推理、资料分析
              </span>
            </div>
            <div className="mock-trend-header-actions">
              <div className="mock-trend-meta">
                <span>记录数：{trendData.records}</span>
                <span>区间：{trendData.rangeText}</span>
              </div>
              <button
                type="button"
                className="ghost share-button"
                onClick={handleShareTrend}
                disabled={shareGenerating || !trendData.records}
                title="分享走势图"
              >
                <span className="share-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </span>
                <span className="share-text">
                  {shareGenerating ? '生成中...' : '分享'}
                </span>
              </button>
            </div>
          </div>

          <div className="mock-trend-controls">
            <button
              type="button"
              className={`mock-trend-toggle ${trendFilter === "all" ? "active" : ""}`}
              onClick={() => setTrendFilter("all")}
              style={{ "--trend-color": trendSeriesColors.overall } as CSSProperties}
            >
              <span className="mock-trend-dot" />
              全部
            </button>
            {chartLayout.seriesWithPoints.map((series) => (
              <button
                key={series.key}
                type="button"
                className={`mock-trend-toggle ${
                  trendFilter === series.key ? "active" : ""
                }`}
                onClick={() => setTrendFilter(series.key)}
                disabled={!series.hasData}
                style={{ "--trend-color": series.color } as CSSProperties}
              >
                <span className="mock-trend-dot" />
                {series.label}
              </button>
            ))}
          </div>

          {trendData.records ? (
            <div
              className="mock-trend-scroll"
              ref={trendScrollRef}
              style={{ overflowX: chartLayout.shouldScroll ? "auto" : "hidden" }}
            >
              <div className="mock-trend-chart">
              <svg
                width={chartLayout.chartWidth}
                height={chartLayout.height}
                viewBox={`0 0 ${chartLayout.chartWidth} ${chartLayout.height}`}
                role="img"
                aria-label="模考历史正确率趋势"
                className="mock-trend-svg"
                onClick={handleTrendClick}
              >
                <rect
                  x="0"
                  y="0"
                  width={chartLayout.chartWidth}
                  height={chartLayout.height}
                  rx="14"
                  ry="14"
                  className="mock-trend-bg"
                />
                <g className="mock-trend-grid">
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                    const y =
                      chartLayout.padding.top +
                      (1 - tick) *
                        (chartLayout.height -
                          chartLayout.padding.top -
                          chartLayout.padding.bottom);
                    return (
                      <line
                        key={`grid-${tick}`}
                        x1={chartLayout.padding.left}
                        y1={y}
                        x2={chartLayout.chartWidth - chartLayout.padding.right}
                        y2={y}
                      />
                    );
                  })}
                </g>
                <g className="mock-trend-axis">
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                    const y =
                      chartLayout.padding.top +
                      (1 - tick) *
                        (chartLayout.height -
                          chartLayout.padding.top -
                          chartLayout.padding.bottom);
                    return (
                      <text
                        key={`label-${tick}`}
                        x={chartLayout.padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                      >
                        {(tick * 100).toFixed(0)}%
                      </text>
                    );
                  })}
                  {chartLayout.xLabelIndices.map((index) => (
                    <text
                      key={`x-${index}`}
                      x={
                        chartLayout.padding.left +
                        (chartLayout.count <= 1 ? 0 : chartLayout.slotSpacing * index)
                      }
                      y={chartLayout.height - 10}
                      textAnchor="middle"
                    >
                      {trendData.labels[index]}
                    </text>
                  ))}
                </g>
                {activeX !== null ? (
                  <g className="mock-trend-focus">
                    <line
                      x1={activeX}
                      y1={chartLayout.padding.top}
                      x2={activeX}
                      y2={chartLayout.height - chartLayout.padding.bottom}
                    />
                  </g>
                ) : null}
                <g className="mock-trend-lines">
                  {visibleSeries.map((series) => (
                    <path
                      key={`line-${series.key}`}
                      d={buildLinePath(
                        series.points.map((point) => ({
                          x: point.x,
                          y: point.y
                        }))
                      )}
                      className={`mock-trend-line ${
                        series.key === "overall" ? "overall" : ""
                      }`}
                      style={{ stroke: series.color }}
                    />
                  ))}
                </g>
                <g className="mock-trend-points">
                  {visibleSeries.map((series) =>
                    series.points.map((point, index) =>
                      point.y === null ? null : (
                        <circle
                          key={`point-${series.key}-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r={activeTrendIndex === index ? 4.5 : 3.5}
                          className="mock-trend-point"
                          style={{ fill: series.color }}
                        >
                          <title>
                            {`${series.label} ${trendData.labels[index]} ${formatAccuracy(
                              point.value,
                              1
                            )}`}
                          </title>
                        </circle>
                      )
                    )
                  )}
                </g>
              </svg>
            </div>
            </div>
          ) : (
            <div className="knowledge-empty">暂无历史记录，先生成一次解读。</div>
          )}

          {activeTrendEntry ? (
            <div className="mock-trend-detail">
              <div className="mock-trend-detail-header">
                <div className="mock-trend-detail-title">
                  <strong>当日正确率</strong>
                  <span
                    className={`mock-trend-detail-delta is-${trendDelta.direction}`}
                  >
                    （{trendDelta.text}）
                  </span>
                </div>
                <span>{formatTrendDate(activeTrendEntry.createdAt)}</span>
              </div>
              <div className="mock-trend-detail-grid">
                {chartLayout.seriesWithPoints.map((series) => {
                  const value =
                    activeTrendIndex === null ? null : series.values[activeTrendIndex];
                  return (
                    <div key={`detail-${series.key}`} className="mock-trend-detail-item">
                      <span className="mock-trend-detail-label">
                        <span
                          className="mock-trend-detail-dot"
                          style={{ backgroundColor: series.color }}
                        />
                        {series.label}
                      </span>
                      <span className="mock-trend-detail-value">
                        {typeof value === "number" ? formatAccuracy(value, 1) : "暂无"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

        </div>
      </section>

      {/* 分享弹窗 */}
      {shareModalOpen && (
        <div className="share-modal-overlay" onClick={() => setShareModalOpen(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>分享走势图</h3>
              <button
                type="button"
                className="ghost"
                onClick={() => setShareModalOpen(false)}
                aria-label="关闭"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="20"
                  height="20"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="share-modal-body">
              {shareImageUrl && (
                <img src={shareImageUrl} alt="走势图分享" className="share-preview" />
              )}
            </div>
            <div className="share-modal-actions">
              <button
                type="button"
                className={`primary ${copiedSuccess ? 'success' : ''}`}
                onClick={handleCopyImage}
              >
                {copiedSuccess ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="16"
                      height="16"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    复制成功
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="16"
                      height="16"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    复制图片
                  </>
                )}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={handleDownloadImage}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                下载保存
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
