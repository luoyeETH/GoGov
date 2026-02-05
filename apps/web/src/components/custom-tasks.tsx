"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

type CustomTaskRecurrence = "once" | "daily" | "weekly" | "interval";

type CustomTask = {
  id: string;
  title: string;
  notes?: string | null;
  startDate: string;
  recurrenceType: CustomTaskRecurrence;
  intervalDays?: number | null;
  weekdays?: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CustomTaskOccurrence = {
  taskId: string;
  title: string;
  notes?: string | null;
  occurrenceDate: string;
  recurrenceType: CustomTaskRecurrence;
  intervalDays?: number | null;
  weekdays?: number[];
};

type RequestState = "idle" | "loading" | "error";

type CustomTasksModuleProps = {
  variant?: "standalone" | "embedded";
};

const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];
const weekdayOptions = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 0, label: "日" }
];

function getBeijingDateString(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  const year = beijing.getFullYear();
  const month = `${beijing.getMonth() + 1}`.padStart(2, "0");
  const day = `${beijing.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeRecurrence(value: unknown): CustomTaskRecurrence {
  if (value === "daily" || value === "weekly" || value === "interval") {
    return value;
  }
  return "once";
}

function normalizeWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<number>();
  value.forEach((item) => {
    if (typeof item === "number" && Number.isFinite(item)) {
      unique.add(Math.max(0, Math.min(6, Math.floor(item))));
    }
  });
  return Array.from(unique).sort((a, b) => a - b);
}

function formatWeekdays(value: number[]) {
  if (!value.length) {
    return "每周";
  }
  return `每周${value.map((day) => weekdayLabels[day] ?? "").join("、")}`;
}

function formatRecurrence(task: {
  recurrenceType: CustomTaskRecurrence;
  intervalDays?: number | null;
  weekdays?: number[];
}) {
  if (task.recurrenceType === "daily") {
    return "每天";
  }
  if (task.recurrenceType === "weekly") {
    return formatWeekdays(normalizeWeekdays(task.weekdays));
  }
  if (task.recurrenceType === "interval") {
    const days =
      typeof task.intervalDays === "number" && task.intervalDays > 0
        ? Math.floor(task.intervalDays)
        : 1;
    return `每隔 ${days} 天`;
  }
  return "单次";
}

function detectPwaMode() {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function CustomTasksModule({ variant = "standalone" }: CustomTasksModuleProps) {
  const [token, setToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [todayTasks, setTodayTasks] = useState<CustomTaskOccurrence[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<CustomTaskOccurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<CustomTaskRecurrence>("once");
  const [startDate, setStartDate] = useState(getBeijingDateString());
  const [intervalDays, setIntervalDays] = useState("1");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPwa, setIsPwa] = useState(() => detectPwaMode());
  const [openPanel, setOpenPanel] = useState<
    "overdue" | "today" | "create" | "library" | null
  >("today");

  const today = useMemo(() => getBeijingDateString(), []);

  const wrapperClass = [
    "custom-task-card",
    variant === "embedded" ? "custom-task-card-embedded" : "daily-card"
  ]
    .filter(Boolean)
    .join(" ");

  const loadTasks = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/custom-tasks?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "获取失败");
      }
      const rawTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const parsedTasks = rawTasks
        .map((item: unknown) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const record = item as Record<string, unknown>;
          const id = typeof record.id === "string" ? record.id : "";
          const title = typeof record.title === "string" ? record.title : "";
          if (!id || !title.trim()) {
            return null;
          }
          return {
            id,
            title: title.trim(),
            notes: typeof record.notes === "string" ? record.notes : null,
            startDate: typeof record.startDate === "string" ? record.startDate : today,
            recurrenceType: normalizeRecurrence(record.recurrenceType),
            intervalDays:
              typeof record.intervalDays === "number" && Number.isFinite(record.intervalDays)
                ? record.intervalDays
                : null,
            weekdays: normalizeWeekdays(record.weekdays),
            isActive: Boolean(record.isActive),
            createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
            updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : ""
          } as CustomTask;
        })
        .filter(Boolean) as CustomTask[];
      const parseOccurrence = (item: unknown) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const record = item as Record<string, unknown>;
        const taskId = typeof record.taskId === "string" ? record.taskId : "";
        const title = typeof record.title === "string" ? record.title : "";
        const occurrenceDate =
          typeof record.occurrenceDate === "string" ? record.occurrenceDate : "";
        if (!taskId || !title.trim() || !occurrenceDate) {
          return null;
        }
        return {
          taskId,
          title: title.trim(),
          notes: typeof record.notes === "string" ? record.notes : null,
          occurrenceDate,
          recurrenceType: normalizeRecurrence(record.recurrenceType),
          intervalDays:
            typeof record.intervalDays === "number" && Number.isFinite(record.intervalDays)
              ? record.intervalDays
              : null,
          weekdays: normalizeWeekdays(record.weekdays)
        } as CustomTaskOccurrence;
      };
      const rawToday = Array.isArray(data.today) ? data.today : [];
      const rawOverdue = Array.isArray(data.overdue) ? data.overdue : [];
      setTasks(parsedTasks);
      setTodayTasks(rawToday.map(parseOccurrence).filter(Boolean) as CustomTaskOccurrence[]);
      setOverdueTasks(
        rawOverdue.map(parseOccurrence).filter(Boolean) as CustomTaskOccurrence[]
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "获取失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const updatePwa = () => setIsPwa(detectPwaMode());
    updatePwa();
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = () => updatePwa();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
    setToken(window.localStorage.getItem(sessionKey));
    const handleAuthChange = () => {
      setToken(window.localStorage.getItem(sessionKey));
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setTasks([]);
      setTodayTasks([]);
      setOverdueTasks([]);
      return;
    }
    void loadTasks();
  }, [token, today]);

  const handleCreate = async () => {
    if (!token) {
      setMessage("请先登录后添加任务。");
      return;
    }
    if (!title.trim()) {
      setMessage("请输入任务名称。");
      return;
    }
    if (recurrenceType === "weekly" && weekdays.length === 0) {
      setMessage("请选择每周重复的日期。");
      return;
    }
    const intervalValue = Number.parseInt(intervalDays, 10);
    if (recurrenceType === "interval" && (!intervalValue || intervalValue < 1)) {
      setMessage("间隔天数至少为 1 天。");
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/custom-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() ? notes.trim() : null,
          recurrenceType,
          startDate,
          intervalDays: recurrenceType === "interval" ? intervalValue : null,
          weekdays: recurrenceType === "weekly" ? weekdays : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "创建失败");
      }
      setTitle("");
      setNotes("");
      setMessage(null);
      setState("idle");
      void loadTasks();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "创建失败");
    }
  };

  const handleComplete = async (item: CustomTaskOccurrence) => {
    if (!token) {
      setMessage("请先登录后完成任务。");
      return;
    }
    const key = `${item.taskId}-${item.occurrenceDate}`;
    setCompletingKey(key);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/custom-tasks/${item.taskId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: item.occurrenceDate })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "更新失败");
      }
      void loadTasks();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "更新失败");
    } finally {
      setCompletingKey(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!token) {
      return;
    }
    setDeletingId(taskId);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/custom-tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "删除失败");
      }
      void loadTasks();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleWeekday = (value: number) => {
    setWeekdays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((day) => day !== value);
      }
      return [...prev, value].sort((a, b) => a - b);
    });
  };

  if (!token) {
    return (
      <section className={wrapperClass}>
        <div className="daily-card-header">
          <div>
            {variant === "standalone" ? <p className="eyebrow">待办清单</p> : null}
            <h3>待办清单</h3>
          </div>
          <Link className="ghost button-link" href="/login">
            去登录
          </Link>
        </div>
        <div className="knowledge-empty">登录后即可创建待办任务。</div>
      </section>
    );
  }

  const renderBlock = ({
    id,
    title,
    description,
    content
  }: {
    id: "overdue" | "today" | "create" | "library";
    title: string;
    description?: string;
    content: ReactNode;
  }) => {
    const expanded = !isPwa || openPanel === id;
    const contentId = `custom-task-panel-${id}`;
    const headerContent = (
      <div>
        <h4>{title}</h4>
        {description ? <p className="form-message">{description}</p> : null}
      </div>
    );

    return (
      <div
        className={[
          "custom-task-block",
          isPwa ? "custom-task-block-accordion" : "",
          expanded ? "is-open" : "is-collapsed"
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isPwa ? (
          <button
            type="button"
            className="custom-task-block-header custom-task-block-toggle"
            onClick={() =>
              setOpenPanel((prev) => (prev === id ? null : id))
            }
            aria-expanded={expanded}
            aria-controls={contentId}
          >
            {headerContent}
            <span className="custom-task-chevron" aria-hidden="true" />
          </button>
        ) : (
          <div className="custom-task-block-header">{headerContent}</div>
        )}
        <div
          id={contentId}
          className="custom-task-block-body"
          aria-hidden={!expanded}
        >
          <div className="custom-task-block-content">{content}</div>
        </div>
      </div>
    );
  };

  return (
    <section className={wrapperClass}>
      <div className="daily-card-header">
        <div>
          {variant === "standalone" ? <p className="eyebrow">待办清单</p> : null}
          <h3>待办清单</h3>
        </div>
        <div className="daily-meta">
          <span>{today}</span>
          {loading ? <span>同步中...</span> : null}
        </div>
      </div>

      {renderBlock({
        id: "overdue",
        title: "未完成列表",
        description: "按日期依次补齐，完成后才会刷新下一次。",
        content: overdueTasks.length ? (
          <div className="custom-task-list">
            {overdueTasks.map((item) => {
              const key = `${item.taskId}-${item.occurrenceDate}`;
              const isCompleting = completingKey === key;
              return (
                <div key={key} className="custom-task-item is-overdue">
                  <button
                    type="button"
                    className="custom-task-check"
                    onClick={() => handleComplete(item)}
                    disabled={Boolean(isCompleting)}
                    aria-label="完成任务"
                  >
                    <span>{isCompleting ? "…" : "✓"}</span>
                  </button>
                  <div className="custom-task-content">
                    <div className="custom-task-title is-overdue">{item.title}</div>
                    <div className="custom-task-meta">
                      <span>应完成：{item.occurrenceDate}</span>
                      <span>{formatRecurrence(item)}</span>
                      {item.notes ? <span>{item.notes}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="knowledge-empty">暂无未完成任务。</div>
        )
      })}

      {renderBlock({
        id: "today",
        title: "今日任务",
        description: "完成后会进入下一次周期。",
        content: todayTasks.length ? (
          <div className="custom-task-list">
            {todayTasks.map((item) => {
              const key = `${item.taskId}-${item.occurrenceDate}`;
              const isCompleting = completingKey === key;
              return (
                <div key={key} className="custom-task-item">
                  <button
                    type="button"
                    className="custom-task-check"
                    onClick={() => handleComplete(item)}
                    disabled={Boolean(isCompleting)}
                    aria-label="完成任务"
                  >
                    <span>{isCompleting ? "…" : "✓"}</span>
                  </button>
                  <div className="custom-task-content">
                    <div className="custom-task-title">{item.title}</div>
                    <div className="custom-task-meta">
                      <span>{formatRecurrence(item)}</span>
                      {item.notes ? <span>{item.notes}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="knowledge-empty">今日暂无待办任务。</div>
        )
      })}

      {renderBlock({
        id: "create",
        title: "创建待办任务",
        description: "可设置单次、每天、每周或间隔任务。",
        content: (
          <>
            <div className="plan-form-grid">
              <div className="form-row">
                <label htmlFor="custom-task-title">任务名称</label>
                <input
                  id="custom-task-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例如：整理错题"
                />
              </div>
              <div className="form-row">
                <label htmlFor="custom-task-notes">备注</label>
                <input
                  id="custom-task-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="可选：资料/课程/时长"
                />
              </div>
              <div className="form-row">
                <label htmlFor="custom-task-recurrence">重复规则</label>
                <select
                  id="custom-task-recurrence"
                  value={recurrenceType}
                  onChange={(event) =>
                    setRecurrenceType(event.target.value as CustomTaskRecurrence)
                  }
                >
                  <option value="once">单次任务</option>
                  <option value="daily">每天重复</option>
                  <option value="weekly">每周指定</option>
                  <option value="interval">间隔天数</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="custom-task-date">
                  {recurrenceType === "once" ? "任务日期" : "开始日期"}
                </label>
                <input
                  id="custom-task-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              {recurrenceType === "weekly" ? (
                <div className="form-row">
                  <label>每周重复</label>
                  <div className="custom-task-weekdays">
                    {weekdayOptions.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={
                          weekdays.includes(item.value)
                            ? "custom-task-weekday active"
                            : "custom-task-weekday"
                        }
                        onClick={() => toggleWeekday(item.value)}
                      >
                        周{item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {recurrenceType === "interval" ? (
                <div className="form-row">
                  <label htmlFor="custom-task-interval">间隔天数</label>
                  <input
                    id="custom-task-interval"
                    type="number"
                    min={1}
                    value={intervalDays}
                    onChange={(event) => setIntervalDays(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <div className="assist-actions">
              <LoadingButton
                type="button"
                className="primary"
                loading={state === "loading"}
                loadingText="添加中..."
                onClick={handleCreate}
              >
                添加任务
              </LoadingButton>
              {message ? <span className="form-message">{message}</span> : null}
            </div>
          </>
        )
      })}

      {renderBlock({
        id: "library",
        title: "已创建任务",
        description: "管理正在生效的待办任务。",
        content: tasks.length ? (
          <div className="custom-task-library">
            {tasks.map((task) => (
              <div key={task.id} className="custom-task-library-item">
                <div>
                  <div className="custom-task-title">{task.title}</div>
                  <div className="custom-task-meta">
                    <span>{formatRecurrence(task)}</span>
                    <span>
                      {task.recurrenceType === "once"
                        ? `日期 ${task.startDate}`
                        : `开始于 ${task.startDate}`}
                    </span>
                    {task.notes ? <span>{task.notes}</span> : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost danger"
                  onClick={() => handleDelete(task.id)}
                  disabled={deletingId === task.id}
                >
                  {deletingId === task.id ? "删除中..." : "删除"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="knowledge-empty">暂无已创建任务。</div>
        )
      })}
    </section>
  );
}
