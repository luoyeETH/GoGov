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
  const trendScrollRef = useRef<HTMLDivElement | null>(null);

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

      <section className="mock-grid">
        <div className="mock-card">
          <div className="mock-card-header">
            <div>
              <h3>成绩输入</h3>
              <p className="form-message">图片与手动数据可同时使用。</p>
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="mock-title">模考名称</label>
            <select
              id="mock-title-preset"
              value={titlePreset}
              onChange={(event) => {
                setTitlePreset(event.target.value as TitlePreset);
              }}
            >
              <option value="provincial">{defaultTitles.provincial}</option>
              <option value="national">{defaultTitles.national}</option>
              <option value="custom">自定义</option>
            </select>
            <input
              id="mock-title"
              value={title}
              placeholder="例如：粉笔 2025 国考模考一"
              onChange={(event) => {
                setTitle(event.target.value);
                setTitlePreset("custom");
              }}
            />
            <span className="form-message">可选择默认名称或自行填写。</span>
          </div>

          <div className="mock-upload">
            <label className="upload-button">
              <input type="file" accept="image/*" multiple onChange={handleImageChange} />
              上传成绩截图
            </label>
            <span className="form-message">单张不超过 8MB。</span>
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
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="knowledge-empty">暂无截图，可直接输入数据。</div>
          )}

          <div className="form-row">
            <label>手动输入（正确/总题 + 用时）</label>
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
                    />
                  </div>
                </div>
              ))}
            </div>
            {!manualMetrics.length ? (
              <span className="form-message">
                只填写正确与总题即可触发解析，时间可选填。
              </span>
            ) : null}
          </div>

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
        </div>

        <div className="mock-card">
          <div className="mock-card-header">
            <h3>成绩点评</h3>
            <span className="form-message">支持历史趋势分析</span>
          </div>
          {analysis ? (
            <div className="assist-output">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysisMarkdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="knowledge-empty">提交数据后显示点评。</div>
          )}
        </div>
      </section>

      <section className="mock-grid">
        <div className="mock-card mock-trend">
          <div className="mock-card-header mock-trend-header">
            <div>
              <h3>历史正确率走势</h3>
              <span className="form-message">
                覆盖常识判断、政治理论、言语理解与表达、数量关系、判断推理、资料分析
              </span>
            </div>
            <div className="mock-trend-meta">
              <span>记录数：{trendData.records}</span>
              <span>区间：{trendData.rangeText}</span>
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
                <strong>当日正确率</strong>
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

      <section className="mock-grid">
        <div className="mock-card mock-history">
          <div className="mock-card-header">
            <h3>历史记录</h3>
            <span className="form-message">最近 30 次</span>
          </div>
          <div className="mock-history-list">
            {history.length ? (
              history.map((item) => (
                <div key={item.id} className="mock-history-item">
                  <div className="mock-history-header">
                    <div>
                      <strong>{item.title}</strong>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="mock-history-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          setAnalysis(
                            item.analysis ?? (item.analysisRaw ? { raw: item.analysisRaw } : null)
                          );
                        }}
                      >
                        查看
                      </button>
                      <button
                        type="button"
                        className="ghost danger"
                        onClick={() => handleDeleteHistory(item.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <p>{item.summary}</p>
                </div>
              ))
            ) : (
              <div className="knowledge-empty">暂无历史记录。</div>
            )}
          </div>
        </div>
        <div className="mock-card mock-tips">
          <div className="mock-card-header">
            <h3>填写说明</h3>
            <span className="form-message">快速理解手动输入</span>
          </div>
          <div className="mock-sample">
            <code>正确 / 总题：例如 13 / 20</code>
            <code>用时：分钟数，可留空</code>
            <code>图片与手动数据可同时提交</code>
          </div>
        </div>
      </section>
    </main>
  );
}
