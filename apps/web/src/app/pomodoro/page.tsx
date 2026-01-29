"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type LoadState = "loading" | "idle" | "error";

type PomodoroStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "abandoned";

type PomodoroMode = "countdown" | "timer";

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

type PomodoroCustomSubject = {
  id: string;
  name: string;
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
const PAUSE_LIMIT_SECONDS = 5 * 60;
const HEATMAP_DAYS = 84;
const MAX_CUSTOM_SUBJECTS = 5;
const PIE_COLORS = [
  "#4c7ef3",
  "#44bba4",
  "#f2c94c",
  "#ef6c57",
  "#9b51e0",
  "#2d9cdb"
];

function getSubjectColor(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i += 1) {
    hash = (hash * 31 + subject.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PIE_COLORS.length;
  return PIE_COLORS[index];
}

const SUBJECTS = [
  { value: "常识", hint: "政策与常识积累" },
  { value: "政治理论", hint: "理论框架巩固" },
  { value: "言语理解", hint: "语感与逻辑" },
  { value: "数量关系", hint: "运算与数量思维" },
  { value: "判断推理", hint: "图形与逻辑" },
  { value: "资料分析", hint: "数据速算" },
  { value: "专业知识", hint: "专项深入" },
  { value: "申论", hint: "表达与结构" }
];

const DURATION_PRESETS = [5, 15, 25, 35, 45, 60];

function formatSeconds(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

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

function formatMinutesCompact(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0m";
  }
  if (minutes >= 60) {
    const rounded = Math.round(minutes);
    const hours = Math.floor(rounded / 60);
    const rest = rounded % 60;
    return `${hours}h${rest}m`;
  }
  return `${Math.round(minutes)}m`;
}

function formatMinutesText(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0分钟";
  }
  const rounded = Math.round(minutes);
  if (rounded >= 60) {
    const hours = Math.floor(rounded / 60);
    const rest = rounded % 60;
    return `${hours}小时${rest}分钟`;
  }
  return `${rounded}分钟`;
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

export default function PomodoroPage() {
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<PomodoroStatus>("idle");
  const [mode, setMode] = useState<PomodoroMode>("countdown");
  const [subject, setSubject] = useState<string>(SUBJECTS[0].value);
  const [plannedMinutes, setPlannedMinutes] = useState<number>(25);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [pauseElapsedSeconds, setPauseElapsedSeconds] = useState<number>(0);
  const [segments, setSegments] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<{
    status: PomodoroStatus;
    focusMinutes: number;
    pauseMinutes: number;
    pauseCount: number;
    subject: string;
    plannedMinutes: number;
    mode: PomodoroMode;
    segments: number[];
  } | null>(null);
  const [insights, setInsights] = useState<PomodoroInsights | null>(null);
  const [insightsState, setInsightsState] = useState<LoadState>("loading");
  const [heatSubject, setHeatSubject] = useState<string>("全部");
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{
    date: string;
    minutes: number;
  } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<PomodoroCustomSubject[]>(
    []
  );
  const [customName, setCustomName] = useState("");
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [customSaving, setCustomSaving] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const pausedTotalMsRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const pauseCountRef = useRef<number>(0);
  const finishingRef = useRef<boolean>(false);
  const lastSegmentElapsedRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Wake lock request failed (e.g., low battery mode)
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore release errors
      }
      wakeLockRef.current = null;
    }
  };

  const normalizedPlannedMinutes = Math.max(1, Math.round(plannedMinutes || 1));
  const plannedSeconds = useMemo(() => {
    if (mode !== "countdown") {
      return 0;
    }
    return Math.max(60, normalizedPlannedMinutes * 60);
  }, [mode, normalizedPlannedMinutes]);
  const builtInSubjectSet = useMemo(
    () => new Set(SUBJECTS.map((item) => item.value)),
    []
  );
  const subjectOptions = useMemo<
    {
      id: string;
      name: string;
      hint: string;
      isCustom: boolean;
      subjectId?: string;
    }[]
  >(() => {
    return [
      ...SUBJECTS.map((item) => ({
        id: `builtin:${item.value}`,
        name: item.value,
        hint: item.hint,
        isCustom: false,
        subjectId: undefined
      })),
      ...customSubjects.map((item) => ({
        id: `custom:${item.id}`,
        name: item.name,
        hint: "自定义",
        isCustom: true,
        subjectId: item.id
      }))
    ];
  }, [customSubjects]);

  const remainingSeconds =
    mode === "countdown" ? Math.max(0, plannedSeconds - elapsedSeconds) : 0;
  const progress =
    mode === "countdown" && plannedSeconds ? elapsedSeconds / plannedSeconds : 0;
  const isImmersive = status === "running" || status === "paused";
  const segmentsTotalSeconds = useMemo(
    () => segments.reduce((sum, value) => sum + value, 0),
    [segments]
  );
  const currentSegmentSeconds = Math.max(
    0,
    elapsedSeconds - segmentsTotalSeconds
  );
  const displaySeconds =
    mode === "countdown" ? remainingSeconds : elapsedSeconds;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(sessionKey);
    if (!stored) {
      setMessage("请先登录后开启番茄钟。");
      setToken(null);
      setInsightsState("idle");
      return;
    }
    setToken(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.body.classList.toggle("pomodoro-immersive", isImmersive);
    if (!isImmersive && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    return () => {
      document.body.classList.remove("pomodoro-immersive");
    };
  }, [isImmersive]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && status === "running") {
        pauseSession();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [status]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status === "running") {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status]);

  useEffect(() => {
    if (!token) {
      return;
    }
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
        setInsights(data);
        setInsightsState("idle");
      } catch (err) {
        setInsightsState("error");
        setMessage(
          err instanceof Error ? err.message : "无法获取学习地图数据"
        );
      }
    };

    void loadInsights();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    const loadCustomSubjects = async () => {
      try {
        const res = await fetch(`${apiBase}/pomodoro/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "无法获取自定义科目");
        }
        setCustomSubjects(data.subjects ?? []);
      } catch (err) {
        setCustomMessage(
          err instanceof Error ? err.message : "无法获取自定义科目"
        );
      }
    };

    void loadCustomSubjects();
  }, [token]);

  useEffect(() => {
    if (builtInSubjectSet.has(subject)) {
      return;
    }
    const exists = customSubjects.some((item) => item.name === subject);
    if (!exists) {
      setSubject(SUBJECTS[0].value);
    }
  }, [builtInSubjectSet, customSubjects, subject]);

  useEffect(() => {
    if (status !== "running" && status !== "paused") {
      return;
    }
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (!startTimeRef.current) {
        return;
      }
      if (status === "running") {
        const elapsed = Math.floor(
          (now - startTimeRef.current - pausedTotalMsRef.current) / 1000
        );
        setElapsedSeconds(elapsed);
        if (mode === "countdown" && elapsed >= plannedSeconds) {
          void finishSession("completed");
        }
      }
      if (status === "paused" && pauseStartRef.current) {
        const pauseElapsed = Math.floor((now - pauseStartRef.current) / 1000);
        setPauseElapsedSeconds(pauseElapsed);
        if (pauseElapsed >= PAUSE_LIMIT_SECONDS) {
          void finishSession("failed", "pause_timeout");
        }
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, [mode, status, plannedSeconds]);

  const resetSessionState = () => {
    setElapsedSeconds(0);
    setPauseElapsedSeconds(0);
    pauseCountRef.current = 0;
    pausedTotalMsRef.current = 0;
    pauseStartRef.current = null;
    startTimeRef.current = null;
    finishingRef.current = false;
    lastSegmentElapsedRef.current = 0;
    setSegments([]);
    setSessionId(null);
  };

  const startSession = async () => {
    if (!token) {
      setMessage("请先登录后开启番茄钟。");
      return;
    }
    if (!subject) {
      setMessage("请选择学习科目。");
      return;
    }
    if (mode === "countdown" && plannedMinutes <= 0) {
      setMessage("请设置专注时长。");
      return;
    }
    setIsStarting(true);
    setMessage(null);
    setLastResult(null);
    resetSessionState();
    try {
      const res = await fetch(`${apiBase}/pomodoro/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          plannedMinutes: normalizedPlannedMinutes
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "无法开启番茄钟");
      }
      setSessionId(data.id);
      startTimeRef.current = Date.now();
      pausedTotalMsRef.current = 0;
      pauseStartRef.current = null;
      lastSegmentElapsedRef.current = 0;
      setSegments([]);
      setStatus("running");
      void requestWakeLock();
      if (document.documentElement.requestFullscreen) {
        void document.documentElement.requestFullscreen().catch(() => undefined);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "无法开启番茄钟");
    } finally {
      setIsStarting(false);
    }
  };

  const pauseSession = () => {
    if (status !== "running") {
      return;
    }
    pauseStartRef.current = Date.now();
    pauseCountRef.current += 1;
    setPauseElapsedSeconds(0);
    setStatus("paused");
    void releaseWakeLock();
  };

  const resumeSession = () => {
    if (status !== "paused" || !pauseStartRef.current) {
      return;
    }
    const pausedMs = Date.now() - pauseStartRef.current;
    pausedTotalMsRef.current += pausedMs;
    pauseStartRef.current = null;
    setPauseElapsedSeconds(0);
    setStatus("running");
    void requestWakeLock();
    if (document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  };

  const addSegment = () => {
    if (status !== "running") {
      return;
    }
    const segmentSeconds = Math.max(
      0,
      elapsedSeconds - lastSegmentElapsedRef.current
    );
    if (segmentSeconds <= 0) {
      return;
    }
    setSegments((prev) => [...prev, segmentSeconds]);
    lastSegmentElapsedRef.current = elapsedSeconds;
  };

  const finishSession = async (
    finalStatus: "completed" | "failed" | "abandoned",
    reason?: string
  ) => {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    void releaseWakeLock();
    const segmentsSnapshot =
      mode === "timer"
        ? segments.length
          ? [
              ...segments,
              ...(currentSegmentSeconds > 0 ? [currentSegmentSeconds] : [])
            ]
          : []
        : [];
    const now = Date.now();
    const totalPausedMs =
      pausedTotalMsRef.current +
      (pauseStartRef.current ? now - pauseStartRef.current : 0);
    const totalPausedSeconds = Math.floor(totalPausedMs / 1000);
    const durationSeconds = Math.max(
      0,
      Math.floor((now - (startTimeRef.current ?? now) - totalPausedMs) / 1000)
    );
    const focusMinutes = Math.round(durationSeconds / 60);
    const pauseMinutes = Math.round(totalPausedSeconds / 60);

    setStatus(finalStatus);
    setLastResult({
      status: finalStatus,
      focusMinutes,
      pauseMinutes,
      pauseCount: pauseCountRef.current,
      subject,
      plannedMinutes: normalizedPlannedMinutes,
      mode,
      segments: segmentsSnapshot
    });

    if (!token || !sessionId) {
      resetSessionState();
      return;
    }

    try {
      await fetch(`${apiBase}/pomodoro/${sessionId}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: finalStatus,
          durationSeconds,
          pauseSeconds: totalPausedSeconds,
          pauseCount: pauseCountRef.current,
          failureReason: reason
        })
      });
      setInsightsState("loading");
      const res = await fetch(
        `${apiBase}/pomodoro/insights?days=${HEATMAP_DAYS}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (res.ok) {
        setInsights(data);
        setInsightsState("idle");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存失败，请稍后重试");
    } finally {
      resetSessionState();
    }
  };

  const addCustomSubject = async () => {
    if (!token) {
      setCustomMessage("请先登录后添加。");
      return;
    }
    const trimmed = customName.trim();
    if (!trimmed) {
      setCustomMessage("请输入学习项目名称。");
      return;
    }
    if (trimmed.length > 20) {
      setCustomMessage("名称不超过 20 个字符。");
      return;
    }
    if (customSubjects.length >= MAX_CUSTOM_SUBJECTS) {
      setCustomMessage("最多添加 5 个自定义科目。");
      return;
    }
    if (
      customSubjects.some((item) => item.name === trimmed) ||
      builtInSubjectSet.has(trimmed)
    ) {
      setCustomMessage("学习项目已存在。");
      return;
    }
    setCustomSaving(true);
    setCustomMessage(null);
    try {
      const res = await fetch(`${apiBase}/pomodoro/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "添加失败");
      }
      setCustomSubjects((prev) => [...prev, { id: data.id, name: data.name }]);
      setCustomName("");
    } catch (err) {
      setCustomMessage(err instanceof Error ? err.message : "添加失败");
    } finally {
      setCustomSaving(false);
    }
  };

  const removeCustomSubject = async (id: string, name: string) => {
    if (!token) {
      setCustomMessage("请先登录后操作。");
      return;
    }
    setCustomMessage(null);
    try {
      const res = await fetch(`${apiBase}/pomodoro/subjects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "删除失败");
      }
      setCustomSubjects((prev) => prev.filter((item) => item.id !== id));
      if (subject === name) {
        setSubject(SUBJECTS[0].value);
      }
    } catch (err) {
      setCustomMessage(err instanceof Error ? err.message : "删除失败");
    }
  };

  const selectedHeatmapSubject = useMemo(() => {
    if (!insights?.subjects?.length) {
      return ["全部"];
    }
    return ["全部", ...insights.subjects];
  }, [insights]);

  const heatmapValues = useMemo(() => {
    const days = insights?.heatmap?.days ?? [];
    return days.map((day) => {
      const minutes =
        heatSubject === "全部"
          ? day.totalMinutes
          : day.totals?.[heatSubject] ?? 0;
      return {
        date: day.date,
        minutes
      };
    });
  }, [insights, heatSubject]);

  const maxHeatMinutes = useMemo(() => {
    return heatmapValues.reduce((max, item) => Math.max(max, item.minutes), 0);
  }, [heatmapValues]);

  const radarPoints = useMemo(() => {
    const radar = insights?.radar ?? [];
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
  }, [insights]);

  const radarPolygon = radarPoints.points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const pauseRemaining = Math.max(0, PAUSE_LIMIT_SECONDS - pauseElapsedSeconds);
  const todayLabel = getBeijingDateString();
  const todayRecord = useMemo(() => {
    if (!insights?.heatmap?.days) {
      return null;
    }
    return (
      insights.heatmap.days.find((day) => day.date === todayLabel) ?? null
    );
  }, [insights, todayLabel]);
  const todayBreakdown = useMemo(() => {
    const totals = todayRecord?.totals ?? {};
    return Object.entries(totals)
      .filter(([, minutes]) => minutes > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([subjectName, minutes]) => ({
        subject: subjectName,
        minutes,
        color: getSubjectColor(subjectName)
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

  return (
    <main className="main pomodoro-page">
      <section className="pomodoro-header app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">专注训练</p>
          <h1 className="app-page-title">番茄钟</h1>
          <p className="lead app-page-subtitle">
            选择学习科目，进入沉浸模式，用专注时长换来稳定提升。
          </p>
        </div>
        <Link href="/leaderboard" className="pomodoro-leaderboard-link" title="今日排行榜">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21V11M16 21V7M12 21V3" />
          </svg>
        </Link>
        <div className="pomodoro-summary app-page-metrics">
          <div className="app-page-metric">
            <span className="app-page-metric-label">近 12 周场次</span>
            <strong className="app-page-metric-value">
              {insights?.totals?.sessions ?? "--"}
            </strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">完成次数</span>
            <strong className="app-page-metric-value">
              {insights?.totals?.completed ?? "--"}
            </strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">累计专注</span>
            <strong className="app-page-metric-value">
              {insights ? formatMinutesText(insights.totals.focusMinutes) : "--"}
            </strong>
          </div>
        </div>
      </section>

      {message ? <div className="practice-error">{message}</div> : null}

      {lastResult ? (
        <section className="pomodoro-result">
          <div>
            <p className="eyebrow">本次结果</p>
            <h2>
              {lastResult.status === "completed"
                ? lastResult.mode === "timer"
                  ? "计时完成"
                  : "专注完成"
                : lastResult.status === "failed"
                ? lastResult.mode === "timer"
                  ? "计时失败"
                  : "番茄钟失败"
                : "提前结束"}
            </h2>
            <p className="lead app-page-subtitle">
              {lastResult.subject} ·
              {lastResult.mode === "countdown"
                ? `计划 ${lastResult.plannedMinutes} 分钟 · `
                : ""}
              实际专注 {lastResult.focusMinutes} 分钟
            </p>
            <p className="pomodoro-result-note">
              暂停 {lastResult.pauseMinutes} 分钟 · 共 {lastResult.pauseCount} 次
              {lastResult.mode === "timer" && lastResult.segments.length
                ? ` · 分段 ${lastResult.segments.length} 段`
                : ""}
            </p>
            {lastResult.mode === "timer" && lastResult.segments.length ? (
              <div className="pomodoro-result-segments">
                {lastResult.segments.map((segment, index) => (
                  <div key={`${segment}-${index}`}>
                    <span>第 {index + 1} 段</span>
                    <strong>{formatSeconds(segment)}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="primary button-link"
            onClick={() => {
              setLastResult(null);
              setStatus("idle");
            }}
          >
            继续下一轮
          </button>
        </section>
      ) : null}

      <section className="pomodoro-setup">
        <div className="pomodoro-setup-card">
          <div className="pomodoro-card-header">
            <h3>选择学习科目</h3>
            <span>专注开始前锁定学习主题</span>
          </div>
          <div className="pomodoro-subject-grid">
            {subjectOptions.map((item) => (
              <div key={item.id} className="pomodoro-subject-card">
                <button
                  type="button"
                  className={`pomodoro-subject ${
                    subject === item.name ? "active" : ""
                  } ${item.isCustom ? "custom" : ""}`}
                  onClick={() => setSubject(item.name)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.hint}</span>
                </button>
                {item.isCustom ? (
                  <button
                    type="button"
                    className="pomodoro-subject-remove"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (item.subjectId) {
                        void removeCustomSubject(item.subjectId, item.name);
                      }
                    }}
                    aria-label={`删除${item.name}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="pomodoro-custom">
            <div className="pomodoro-custom-header">
              <h4>自定义学习项目</h4>
              <span className="pomodoro-custom-counter">
                {customSubjects.length}/{MAX_CUSTOM_SUBJECTS}
              </span>
            </div>
            <div className="pomodoro-custom-row">
              <input
                type="text"
                value={customName}
                maxLength={20}
                placeholder="例如：时政汇总"
                onChange={(event) => {
                  setCustomName(event.target.value);
                  setCustomMessage(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addCustomSubject();
                  }
                }}
              />
              <button
                type="button"
                className="ghost button-link"
                onClick={addCustomSubject}
                disabled={
                  customSaving || customSubjects.length >= MAX_CUSTOM_SUBJECTS
                }
              >
                {customSaving ? "添加中..." : "添加"}
              </button>
            </div>
            {customMessage ? (
              <div className="pomodoro-custom-message">{customMessage}</div>
            ) : null}
          </div>
        </div>
        <div className="pomodoro-setup-card">
          <div className="pomodoro-card-header">
            <h3>计时方式</h3>
            <span>
              {mode === "countdown"
                ? "番茄钟模式，时间到自动完成"
                : "计时器模式，手动停止保存"}
            </span>
          </div>
          <div className="pomodoro-mode">
            <button
              type="button"
              className={`pomodoro-chip ${
                mode === "countdown" ? "active" : ""
              }`}
              onClick={() => setMode("countdown")}
            >
              番茄钟
            </button>
            <button
              type="button"
              className={`pomodoro-chip ${mode === "timer" ? "active" : ""}`}
              onClick={() => setMode("timer")}
            >
              计时器
            </button>
          </div>
          {mode === "countdown" ? (
            <div className="pomodoro-duration">
              <label>
                <span>分钟</span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={plannedMinutes}
                  onChange={(event) =>
                    setPlannedMinutes(Number(event.target.value))
                  }
                />
              </label>
              <div className="pomodoro-duration-presets">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`pomodoro-chip ${
                      plannedMinutes === preset ? "active" : ""
                    }`}
                    onClick={() => setPlannedMinutes(preset)}
                  >
                    {preset} 分钟
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pomodoro-timer-note">
              计时器将持续累计专注时间，可随时暂停或停止保存，并支持分段记录。
            </div>
          )}
          <button
            type="button"
            className="primary button-link pomodoro-start"
            onClick={startSession}
            disabled={isStarting}
          >
            {isStarting
              ? "正在开启..."
              : mode === "timer"
              ? "开始计时"
              : "开始专注"}
          </button>
        </div>
      </section>

      <section className="pomodoro-map">
        <div className="pomodoro-map-header">
          <h2>学习地图</h2>
          <p>把时间可视化，找到你的高效节奏与偏科风险。</p>
        </div>
        {token && insightsState === "loading" ? (
          <div className="practice-loading">正在加载学习地图...</div>
        ) : null}
        {token && insightsState === "error" ? (
          <div className="practice-error">学习地图加载失败</div>
        ) : null}
        {insights && insightsState === "idle" ? (
          <div className="pomodoro-map-grid">
            <div className="pomodoro-map-card">
              <div className="pomodoro-card-header">
                <h3>今日学习分布</h3>
                <span>专注时长按科目拆解</span>
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
                        ? Math.round((item.minutes / todayTotalMinutes) * 1000) /
                          10
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

            <div className="pomodoro-map-card">
              <div className="pomodoro-card-header">
                <h3>学习热力图</h3>
                <span>最近 12 周每日投入</span>
              </div>
              <div className="pomodoro-heatmap-controls">
                {selectedHeatmapSubject.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`pomodoro-chip ${
                      heatSubject === item ? "active" : ""
                    }`}
                    onClick={() => setHeatSubject(item)}
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
                    onClick={() =>
                      setSelectedHeatmapDay({ date: day.date, minutes: day.minutes })
                    }
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

            <div className="pomodoro-map-card">
              <div className="pomodoro-card-header">
                <h3>高效时段</h3>
                <span>哪段时间完成番茄钟最多</span>
              </div>
              <div className="pomodoro-buckets">
                {insights.timeBuckets.map((bucket) => {
                  const maxCount = insights.timeBuckets.reduce(
                    (max, item) => Math.max(max, item.count),
                    1
                  );
                  const width = maxCount ? (bucket.count / maxCount) * 100 : 0;
                  return (
                    <div key={bucket.key} className="pomodoro-bucket">
                      <div>
                        <strong>{bucket.label}</strong>
                        <span>{bucket.range}</span>
                      </div>
                      <div className="pomodoro-bucket-bar">
                        <div style={{ width: `${width}%` }} />
                      </div>
                      <div className="pomodoro-bucket-meta">
                        {bucket.count} 次 · {bucket.minutes} 分钟
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pomodoro-map-card">
              <div className="pomodoro-card-header">
                <h3>科目雷达</h3>
                <span>专注时间占比</span>
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
                        const x =
                          radarPoints.center + Math.cos(angle) * r;
                        const y =
                          radarPoints.center + Math.sin(angle) * r;
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
                  {insights.radar.map((item) => (
                    <div key={item.subject}>
                      <strong>{item.subject}</strong>
                      <span>{formatMinutesCompact(item.minutes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {selectedHeatmapDay ? (
        <div
          className="heatmap-tooltip-overlay"
          onClick={() => setSelectedHeatmapDay(null)}
        >
          <div
            className="heatmap-tooltip"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="heatmap-tooltip-header">
              <h4>{selectedHeatmapDay.date}</h4>
              <button
                type="button"
                onClick={() => setSelectedHeatmapDay(null)}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="heatmap-tooltip-content">
              <p className="heatmap-tooltip-time">
                {formatMinutes(selectedHeatmapDay.minutes)}
              </p>
              <p className="heatmap-tooltip-label">学习时长</p>
            </div>
          </div>
        </div>
      ) : null}

      {isImmersive ? (
        <div className="pomodoro-overlay">
          <div className="pomodoro-overlay-card">
            <span className="pomodoro-overlay-subject">{subject}</span>
            <div className="pomodoro-overlay-timer">
              {formatSeconds(displaySeconds)}
            </div>
            {mode === "countdown" ? (
              <div className="pomodoro-overlay-progress">
                <div
                  className="pomodoro-overlay-progress-fill"
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
            ) : null}
            {status === "paused" ? (
              <div className="pomodoro-overlay-state">
                已暂停 {formatSeconds(pauseElapsedSeconds)} ·
                {mode === "countdown"
                  ? `剩余 ${formatSeconds(pauseRemaining)}`
                  : `已计时 ${formatSeconds(elapsedSeconds)}`}
              </div>
            ) : (
              <div className="pomodoro-overlay-state">
                {mode === "countdown"
                  ? `已专注 ${formatSeconds(elapsedSeconds)}`
                  : `已计时 ${formatSeconds(elapsedSeconds)} · 当前段 ${formatSeconds(
                      currentSegmentSeconds
                    )}`}
              </div>
            )}
            {mode === "timer" ? (
              <div className="pomodoro-segments">
                <div className="pomodoro-segments-header">
                  <span>分段 {segments.length}</span>
                  <span>当前段 {formatSeconds(currentSegmentSeconds)}</span>
                </div>
                {segments.length ? (
                  <div className="pomodoro-segments-list">
                    {segments.map((segment, index) => (
                      <div key={`${segment}-${index}`}>
                        <span>第 {index + 1} 段</span>
                        <strong>{formatSeconds(segment)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pomodoro-segments-empty">
                    点击“分段”记录每一段专注时间。
                  </div>
                )}
              </div>
            ) : null}
            <div className="pomodoro-overlay-actions">
              {status === "running" ? (
                <button
                  type="button"
                  className="primary button-link"
                  onClick={pauseSession}
                >
                  暂时离开
                </button>
              ) : (
                <button
                  type="button"
                  className="primary button-link"
                  onClick={resumeSession}
                >
                  返回继续
                </button>
              )}
              {mode === "timer" && status === "running" ? (
                <button
                  type="button"
                  className="ghost button-link"
                  onClick={addSegment}
                >
                  分段
                </button>
              ) : null}
              <button
                type="button"
                className="ghost button-link"
                onClick={() =>
                  finishSession(mode === "timer" ? "completed" : "abandoned")
                }
              >
                {mode === "timer" ? "停止并保存" : "结束本次"}
              </button>
            </div>
            <p className="pomodoro-overlay-tip">
              退出全屏会自动暂停，暂停超过 5 分钟将判定失败。
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
