"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LoadingButton from "./loading-button";

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
const autoTaskKey = "gogov_daily_task_auto_date";

type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  durationMinutes?: number | null;
  notes?: string | null;
  subtasks?: Subtask[];
};

type DailyTaskRecord = {
  id: string;
  date: string;
  summary?: string | null;
  adjustNote?: string | null;
  tasks: TaskItem[];
  updatedAt: string;
};

type DailyTaskHistoryRecord = {
  id: string;
  date: string;
  tasks: TaskItem[];
};

type RequestState = "idle" | "loading" | "error";

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

function getWeekdayLabel(label: string) {
  const [year, month, day] = label.split("-").map((value) => Number(value));
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const labels = ["日", "一", "二", "三", "四", "五", "六"];
  return labels[utcDay] ?? "";
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return getBeijingDateString(date);
}

function ensureTasks(value: unknown): TaskItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title : "";
      if (!title.trim()) {
        return null;
      }
      const subtasks = Array.isArray(record.subtasks)
        ? record.subtasks
            .map((sub) => {
              if (!sub || typeof sub !== "object") {
                return null;
              }
              const subRecord = sub as Record<string, unknown>;
              const subTitle = typeof subRecord.title === "string" ? subRecord.title : "";
              if (!subTitle.trim()) {
                return null;
              }
              return {
                id:
                  typeof subRecord.id === "string" && subRecord.id.trim()
                    ? subRecord.id
                    : `sub-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
                title: subTitle,
                done: Boolean(subRecord.done)
              } as Subtask;
            })
            .filter(Boolean)
        : [];
      return {
        id:
          typeof record.id === "string" && record.id.trim()
            ? record.id
            : `task-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        title: title.trim(),
        done: Boolean(record.done),
        durationMinutes:
          typeof record.durationMinutes === "number" &&
          Number.isFinite(record.durationMinutes)
            ? record.durationMinutes
            : null,
        notes: typeof record.notes === "string" ? record.notes : null,
        subtasks: subtasks.length ? (subtasks as Subtask[]) : []
      } as TaskItem;
    })
    .filter(Boolean) as TaskItem[];
}

type DailyTasksModuleProps = {
  variant?: "standalone" | "embedded" | "summary";
};

export default function DailyTasksModule({ variant = "standalone" }: DailyTasksModuleProps) {
  const [taskRecord, setTaskRecord] = useState<DailyTaskRecord | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [adjustNote, setAdjustNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [breakdownTaskId, setBreakdownTaskId] = useState<string | null>(null);
  const [autoRequested, setAutoRequested] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<DailyTaskHistoryRecord[]>([]);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);

  const today = useMemo(() => getBeijingDateString(), []);
  const dateWindow = useMemo(() => {
    const [year, month, day] = today.split("-").map((value) => Number(value));
    const baseUtc = Date.UTC(year, month - 1, day);
    const dayOfWeek = new Date(baseUtc).getUTCDay();
    const diff = (dayOfWeek + 6) % 7;
    const weekStart = shiftDateLabel(today, -diff);
    const labels: string[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      labels.push(shiftDateLabel(weekStart, offset));
    }
    return labels;
  }, [today]);
  const historyDays = dateWindow.length;
  const historyAnchorDate = dateWindow[dateWindow.length - 1];
  const [token, setToken] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);

  const loadTask = async () => {
    if (!token) {
      setTaskRecord(null);
      return;
    }
    setHasLoaded(false);
    try {
      const res = await fetch(`${apiBase}/study-plan/daily?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "获取失败");
      }
      if (!data.task) {
        setTaskRecord(null);
        return;
      }
      setTaskRecord({
        id: String(data.task.id),
        date: String(data.task.date),
        summary: typeof data.task.summary === "string" ? data.task.summary : null,
        adjustNote: typeof data.task.adjustNote === "string" ? data.task.adjustNote : null,
        tasks: ensureTasks(data.task.tasks),
        updatedAt: String(data.task.updatedAt)
      });
      try {
        window.localStorage.setItem(autoTaskKey, today);
      } catch {
        // Ignore storage errors.
      }
      setMessage(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "获取失败");
    } finally {
      setHasLoaded(true);
    }
  };

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
      setTaskRecord(null);
      setHistoryRecords([]);
      setHistoryMessage(null);
      return;
    }
    void loadTask();
  }, [token]);

  useEffect(() => {
    setAutoRequested(false);
  }, [token, today]);

  useEffect(() => {
    if (!token || taskRecord || autoRequested || !hasLoaded) {
      return;
    }
    try {
      const lastAuto = window.localStorage.getItem(autoTaskKey);
      if (lastAuto === today) {
        return;
      }
    } catch {
      // Ignore storage errors.
    }
    if (state === "loading") {
      return;
    }
    setAutoRequested(true);
    void generateTask({ auto: true });
  }, [token, taskRecord, autoRequested, hasLoaded, state, today]);

  useEffect(() => {
    if (!dateWindow.includes(selectedDate)) {
      setSelectedDate(today);
    }
  }, [dateWindow, selectedDate, today]);

  const loadHistory = async () => {
    if (!token) {
      return;
    }
    setHistoryLoading(true);
    setHistoryMessage(null);
    try {
      const res = await fetch(
        `${apiBase}/study-plan/daily/history?days=${historyDays}&date=${historyAnchorDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "获取失败");
      }
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const nextRecords = tasks
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const record = item as Record<string, unknown>;
          return {
            id: typeof record.id === "string" ? record.id : "",
            date: typeof record.date === "string" ? record.date : "",
            tasks: ensureTasks(record.tasks)
          } as DailyTaskHistoryRecord;
        })
        .filter((item) => item && item.id && item.date);
      setHistoryRecords(nextRecords);
    } catch (err) {
      setHistoryMessage(err instanceof Error ? err.message : "获取失败");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    void loadHistory();
  }, [token, historyAnchorDate]);

  const generateTask = async (options?: { note?: string | null; auto?: boolean }) => {
    if (!token) {
      setMessage("请先登录后生成任务。");
      return;
    }
    if (state === "loading") {
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/ai/study-plan/daily`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: today,
          adjustNote: options?.note ?? null,
          tasks: taskRecord?.tasks ?? null,
          auto: Boolean(options?.auto)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "生成失败");
      }
      if (data.task) {
        setTaskRecord({
          id: String(data.task.id),
          date: String(data.task.date),
          summary: typeof data.task.summary === "string" ? data.task.summary : null,
          adjustNote: typeof data.task.adjustNote === "string" ? data.task.adjustNote : null,
          tasks: ensureTasks(data.task.tasks),
          updatedAt: String(data.task.updatedAt)
        });
      }
      try {
        window.localStorage.setItem(autoTaskKey, today);
      } catch {
        // Ignore storage errors.
      }
      setAdjustNote("");
      setState("idle");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "生成失败");
    }
  };

  const saveTasks = async (tasks: TaskItem[]) => {
    if (!token || !taskRecord) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/study-plan/daily/${taskRecord.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tasks })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "保存失败");
      }
      if (data.task) {
        setTaskRecord({
          id: String(data.task.id),
          date: String(data.task.date),
          summary: typeof data.task.summary === "string" ? data.task.summary : null,
          adjustNote: typeof data.task.adjustNote === "string" ? data.task.adjustNote : null,
          tasks: ensureTasks(data.task.tasks),
          updatedAt: String(data.task.updatedAt)
        });
      }
      setSaving(false);
    } catch (err) {
      setSaving(false);
      setMessage(err instanceof Error ? err.message : "保存失败");
    }
  };

  const toggleTask = (taskId: string) => {
    if (!taskRecord) {
      return;
    }
    const next = taskRecord.tasks.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task
    );
    setTaskRecord({ ...taskRecord, tasks: next });
    void saveTasks(next);
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    if (!taskRecord) {
      return;
    }
    const next = taskRecord.tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }
      const nextSubs = (task.subtasks ?? []).map((sub) =>
        sub.id === subId ? { ...sub, done: !sub.done } : sub
      );
      return { ...task, subtasks: nextSubs };
    });
    setTaskRecord({ ...taskRecord, tasks: next });
    void saveTasks(next);
  };

  const handleBreakdown = async (task: TaskItem) => {
    if (!token || !taskRecord) {
      return;
    }
    setBreakdownTaskId(task.id);
    try {
      const res = await fetch(`${apiBase}/ai/study-plan/task-breakdown`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ task: task.title, context: taskRecord.summary ?? "" })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "拆解失败");
      }
      const subtasks = Array.isArray(data.subtasks)
        ? data.subtasks.filter((item: unknown) => typeof item === "string")
        : [];
      if (subtasks.length) {
        const next = taskRecord.tasks.map((item) => {
          if (item.id !== task.id) {
            return item;
          }
          return {
            ...item,
            subtasks: subtasks.map((sub: string) => ({
              id: `sub-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
              title: sub,
              done: false
            }))
          };
        });
        setTaskRecord({ ...taskRecord, tasks: next });
        void saveTasks(next);
      }
      setBreakdownTaskId(null);
    } catch (err) {
      setBreakdownTaskId(null);
      setMessage(err instanceof Error ? err.message : "拆解失败");
    }
  };

  const wrapperClass = [
    "daily-card",
    variant === "embedded" || variant === "summary" ? "daily-card-embedded" : "",
    variant === "summary" ? "daily-card-summary" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const taskCount = taskRecord?.tasks.length ?? 0;
  const previewTasks = taskRecord?.tasks.slice(0, 3) ?? [];
  const historyByDate = useMemo(() => {
    const map = new Map<string, DailyTaskHistoryRecord>();
    for (const record of historyRecords) {
      map.set(formatHistoryDate(record.date), record);
    }
    return map;
  }, [historyRecords]);
  const selectedIsToday = selectedDate === today;
  const selectedIsFuture = selectedDate > today;
  const selectedHistory = historyByDate.get(selectedDate) ?? null;
  const selectedTasks = selectedIsToday
    ? taskRecord?.tasks ?? []
    : selectedHistory?.tasks ?? [];

  if (!token && variant === "summary") {
    return (
      <section className={wrapperClass}>
        <div className="daily-summary-header">
          <div>
            <div className="card-title">今日任务概览</div>
            <p className="form-message">登录后同步规划任务。</p>
          </div>
          <Link className="ghost button-link" href="/login">
            去登录
          </Link>
        </div>
        <p className="daily-summary-text">登录后自动生成今日任务清单。</p>
      </section>
    );
  }

  if (variant === "summary") {
    return (
      <section className={wrapperClass}>
        <div className="daily-summary-header">
          <div>
            <div className="card-title">今日任务概览</div>
          </div>
          <Link className="ghost button-link" href="/daily-tasks">
            查看详情
          </Link>
        </div>
        {state === "loading" ? (
          <p className="form-message">正在生成今日任务...</p>
        ) : null}
        {taskRecord ? (
          <div className="daily-summary-body">
            {taskRecord.summary ? (
              <p className="daily-summary-text">{taskRecord.summary}</p>
            ) : null}
            {previewTasks.length ? (
              <ul className="daily-summary-list">
                {previewTasks.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
                {taskCount > previewTasks.length ? <li>…</li> : null}
              </ul>
            ) : (
              <p className="daily-summary-text">今日暂无任务。</p>
            )}
          </div>
        ) : (
          <p className="daily-summary-text">今日任务未生成。</p>
        )}
      </section>
    );
  }

  if (!token) {
    return (
      <section className={wrapperClass}>
        <div className="daily-card-header">
          <div>
            {variant === "standalone" ? <p className="eyebrow">每日任务</p> : null}
            <h3>今日学习任务</h3>
            <p className="form-message">登录后生成今日任务清单。</p>
          </div>
          <Link className="ghost button-link" href="/login">
            去登录
          </Link>
        </div>
        <div className="knowledge-empty">登录后即可生成今日任务。</div>
      </section>
    );
  }

  return (
    <section className={wrapperClass}>
      <div className="daily-card-header">
        <div>
          {variant === "standalone" ? <p className="eyebrow">每日任务</p> : null}
          <h3>今日学习任务</h3>
          <p className="form-message">基于备考规划自动生成，可随时调整。</p>
        </div>
        <div className="daily-meta">
          <span>{today}</span>
          {saving ? <span>保存中...</span> : null}
        </div>
      </div>

      {variant === "standalone" ? (
        <div className="daily-date-strip">
          {dateWindow.map((label) => {
            const isToday = label === today;
            const isActive = label === selectedDate;
            const isFuture = label > today;
            return (
              <button
                key={label}
                type="button"
                className={[
                  "daily-date-button",
                  isActive ? "is-active" : "",
                  isToday ? "is-today" : "",
                  isFuture ? "is-future" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDate(label)}
              >
                <span className="daily-date-weekday">{getWeekdayLabel(label)}</span>
                <span className="daily-date-day">
                  {Number.parseInt(label.slice(8), 10)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedIsToday ? (
        taskRecord ? (
          <>
            {taskRecord.summary ? (
              <div className="daily-summary">{taskRecord.summary}</div>
            ) : null}
            <div className="daily-task-list">
              {taskRecord.tasks.map((task) => (
                <div key={task.id} className={`daily-task ${task.done ? "done" : ""}`}>
                  <label className="daily-task-main">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span>{task.title}</span>
                  </label>
                  <div className="daily-task-meta">
                    {typeof task.durationMinutes === "number" ? (
                      <span>{Math.round(task.durationMinutes)} 分钟</span>
                    ) : null}
                    {task.notes ? <span>{task.notes}</span> : null}
                  </div>
                  <div className="daily-task-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => handleBreakdown(task)}
                      disabled={breakdownTaskId === task.id}
                    >
                      {breakdownTaskId === task.id ? "拆解中..." : "拆解"}
                    </button>
                  </div>
                  {task.subtasks && task.subtasks.length ? (
                    <div className="daily-subtasks">
                      {task.subtasks.map((sub) => (
                        <label key={sub.id}>
                          <input
                            type="checkbox"
                            checked={sub.done}
                            onChange={() => toggleSubtask(task.id, sub.id)}
                          />
                          <span>{sub.title}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="knowledge-empty">暂无任务，可先生成今日任务。</div>
        )
      ) : historyMessage ? (
        <div className="knowledge-empty">{historyMessage}</div>
      ) : historyLoading ? (
        <div className="knowledge-empty">加载中...</div>
      ) : selectedIsFuture ? (
        <div className="knowledge-empty">
          暂无任务，将根据学习情况和整体规划安排后续任务。
        </div>
      ) : selectedHistory && selectedTasks.length ? (
        <div className="daily-task-list">
          {selectedTasks.map((task) => (
            <div
              key={task.id}
              className={`daily-task daily-task-readonly ${task.done ? "done" : ""}`}
            >
              <label className="daily-task-main">
                <input type="checkbox" checked={task.done} disabled />
                <span>{task.title}</span>
              </label>
              {task.subtasks && task.subtasks.length ? (
                <div className="daily-subtasks">
                  {task.subtasks.map((sub) => (
                    <label key={sub.id}>
                      <input type="checkbox" checked={sub.done} disabled />
                      <span>{sub.title}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="knowledge-empty">当日计划未生成。</div>
      )}

      {selectedIsToday ? (
        <>
          <div className="form-row">
            <label htmlFor="daily-adjust">调整任务需求</label>
            <textarea
              id="daily-adjust"
              rows={2}
              placeholder="例如：今晚只能学习 1 小时，请调整任务"
              value={adjustNote}
              onChange={(event) => setAdjustNote(event.target.value)}
            />
          </div>

          <div className="assist-actions">
            <LoadingButton
              type="button"
              className="primary"
              loading={state === "loading"}
              loadingText="生成中..."
              onClick={() =>
                generateTask({ note: adjustNote.trim() ? adjustNote : null, auto: false })
              }
            >
              {taskRecord ? "调整今日任务" : "生成今日任务"}
            </LoadingButton>
            {message ? <span className="form-message">{message}</span> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
