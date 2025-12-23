"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

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

type UserProfile = {
  username?: string | null;
  email?: string | null;
  walletAddress?: string | null;
};

type StudyPlanProfile = {
  targetExam?: string | null;
  targetExamDate?: string | null;
};

type TaskItem = {
  durationMinutes?: number | null;
};

function getBeijingDateString(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  const year = beijing.getFullYear();
  const month = `${beijing.getMonth() + 1}`.padStart(2, "0");
  const day = `${beijing.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBeijingHour(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  return beijing.getHours();
}

function parseBeijingDateLabel(label: string) {
  return new Date(`${label}T00:00:00+08:00`);
}

function getGreetingLabel() {
  const hour = getBeijingHour();
  if (hour >= 5 && hour < 11) {
    return "早上";
  }
  if (hour >= 11 && hour < 13) {
    return "中午";
  }
  if (hour >= 13 && hour < 18) {
    return "下午";
  }
  return "晚上";
}

function getTextLength(value: string) {
  return Array.from(value).length;
}

function formatHours(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0";
  }
  const hours = totalMinutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export default function HomeHeroCopy() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<StudyPlanProfile | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const today = useMemo(() => getBeijingDateString(), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setToken(window.localStorage.getItem(sessionKey));
    const handleAuthChange = () => {
      setToken(window.localStorage.getItem(sessionKey));
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setProfile(null);
      setTasks([]);
      return;
    }
    const loadHeroData = async () => {
      try {
        const [meRes, profileRes, taskRes] = await Promise.all([
          fetch(`${apiBase}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiBase}/study-plan/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiBase}/study-plan/daily?date=${today}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (meRes.ok) {
          const data = await meRes.json();
          setUser((data.user ?? null) as UserProfile | null);
        } else {
          setUser(null);
        }
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile((data.profile ?? null) as StudyPlanProfile | null);
        } else {
          setProfile(null);
        }
        if (taskRes.ok) {
          const data = await taskRes.json();
          const record = (data.task ?? null) as { tasks?: unknown } | null;
          const items = Array.isArray(record?.tasks)
            ? record?.tasks.filter((item: unknown) => item && typeof item === "object")
            : [];
          setTasks(items as TaskItem[]);
        } else {
          setTasks([]);
        }
      } catch {
        setUser(null);
        setProfile(null);
        setTasks([]);
      }
    };
    void loadHeroData();
  }, [token, today]);

  const shouldPersonalize = Boolean(profile?.targetExamDate);

  if (!shouldPersonalize) {
    return (
      <>
        <p className="eyebrow">AI 优先 · 公考全流程辅助</p>
        <h1>让学习、练习与答疑进入同一条智能流水线</h1>
        <p className="lead">
          从常识积累到速算训练，从错题复盘到试卷排版，全部由可插拔 AI
          能力贯穿。
        </p>
      </>
    );
  }

  const username =
    user?.username?.trim() || user?.email?.trim() || user?.walletAddress?.trim();
  const greetingName = username || "同学";
  const greetingText = `${getGreetingLabel()}好，${greetingName}`;
  const examLabel = profile?.targetExam?.trim() || "目标考试";
  const examDateLabel = profile?.targetExamDate
    ? getBeijingDateString(new Date(profile.targetExamDate))
    : today;
  const examStart = parseBeijingDateLabel(examDateLabel);
  const todayStart = parseBeijingDateLabel(today);
  const diffMs = examStart.getTime() - todayStart.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const countdownText = `距离${examLabel}还有 ${daysLeft} 天`;

  const taskCount = tasks.length;
  let totalMinutes = 0;
  tasks.forEach((task) => {
    if (typeof task.durationMinutes === "number" && Number.isFinite(task.durationMinutes)) {
      totalMinutes += task.durationMinutes;
    } else {
      totalMinutes += 30;
    }
  });
  const hoursText = formatHours(totalMinutes);
  const summaryText = `今天你有 ${taskCount} 个任务，预计需要学习 ${hoursText} 小时`;

  const greetingLength = getTextLength(greetingText);
  const countdownLength = getTextLength(countdownText);
  const summaryLength = getTextLength(summaryText);

  return (
    <>
      <p className="eyebrow">AI 优先 · 公考全流程辅助</p>
      <h1 className="hero-title">
        <span
          className="hero-typing"
          style={
            {
              "--typing-width": greetingLength,
              "--typing-steps": greetingLength,
              "--typing-delay": "0s"
            } as CSSProperties
          }
        >
          {greetingText}
        </span>
        <span
          className="hero-typing"
          style={
            {
              "--typing-width": countdownLength,
              "--typing-steps": countdownLength,
              "--typing-delay": "0.9s"
            } as CSSProperties
          }
        >
          距离{examLabel}还有{" "}
          <span className="hero-number">{daysLeft}</span> 天
        </span>
      </h1>
      <p className="lead">
        <span
          className="hero-typing hero-typing-lead"
          style={
            {
              "--typing-width": summaryLength,
              "--typing-steps": summaryLength,
              "--typing-delay": "1.8s"
            } as CSSProperties
          }
        >
          今天你有 <span className="hero-number">{taskCount}</span> 个任务，预计需要学习{" "}
          <span className="hero-number">{hoursText}</span> 小时
        </span>
      </p>
    </>
  );
}
