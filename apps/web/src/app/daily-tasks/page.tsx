"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import DailyTasksModule from "../../components/daily-tasks";
import CustomTasksModule from "../../components/custom-tasks";

const pwaViewKey = "gogov_pwa_daily_view";

function detectCompactTaskMode() {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function DailyTasksPage() {
  const [isCompact, setIsCompact] = useState(false);
  const [view, setView] = useState<"daily" | "custom">(() => {
    if (typeof window === "undefined") {
      return "daily";
    }
    try {
      const saved = window.localStorage.getItem(pwaViewKey);
      if (saved === "daily" || saved === "custom") {
        return saved;
      }
    } catch {
      // Ignore storage errors.
    }
    return "daily";
  });
  const [maxSectionHeight, setMaxSectionHeight] = useState<number | null>(null);
  const [hasSwitched, setHasSwitched] = useState(false);
  const dailyRef = useRef<HTMLDivElement>(null);
  const customRef = useRef<HTMLDivElement>(null);
  const showCustom = isCompact && view === "custom";

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const update = () => setIsCompact(detectCompactTaskMode());
    update();
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const compactQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = () => update();
    const addListener = (query: MediaQueryList) => {
      if (query.addEventListener) {
        query.addEventListener("change", handleChange);
      } else if (query.addListener) {
        query.addListener(handleChange);
      }
    };
    const removeListener = (query: MediaQueryList) => {
      if (query.removeEventListener) {
        query.removeEventListener("change", handleChange);
      } else if (query.removeListener) {
        query.removeListener(handleChange);
      }
    };
    addListener(standaloneQuery);
    addListener(compactQuery);
    if (typeof window.addEventListener === "function") {
      window.addEventListener("resize", handleChange, { passive: true });
    }
    return () => {
      removeListener(standaloneQuery);
      removeListener(compactQuery);
      if (typeof window.removeEventListener === "function") {
        window.removeEventListener("resize", handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isCompact || typeof window === "undefined") {
      return;
    }
    try {
      const saved = window.localStorage.getItem(pwaViewKey);
      if ((saved === "daily" || saved === "custom") && saved !== view) {
        setView(saved);
      }
    } catch {
      // Ignore storage errors.
    }
  }, [isCompact, view]);

  useEffect(() => {
    if (!isCompact || typeof window === "undefined" || typeof ResizeObserver === "undefined") {
      return;
    }
    const dailyNode = dailyRef.current;
    const customNode = customRef.current;
    if (!dailyNode || !customNode) {
      return;
    }
    const updateHeight = () => {
      const activeNode = showCustom ? customNode : dailyNode;
      const inactiveNode = showCustom ? dailyNode : customNode;
      const activeHeight = activeNode.offsetHeight;
      const next = hasSwitched
        ? Math.max(activeHeight, inactiveNode.offsetHeight)
        : activeHeight;
      if (Number.isFinite(next) && next > 0) {
        setMaxSectionHeight(next);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(dailyNode);
    observer.observe(customNode);
    return () => observer.disconnect();
  }, [isCompact, showCustom, hasSwitched]);

  const switchView = (next: "daily" | "custom") => {
    if (next !== view) {
      setHasSwitched(true);
    }
    setView(next);
    if (!isCompact) {
      return;
    }
    try {
      window.localStorage.setItem(pwaViewKey, next);
    } catch {
      // Ignore storage errors.
    }
  };

  const heroEyebrow = showCustom ? "待办清单" : "每日任务";
  const heroTitle = showCustom ? "待办清单" : "今日学习清单";
  const heroLead = showCustom
    ? "管理周期性或单次任务，未完成任务会按日期顺序补齐。"
    : "根据备考规划自动生成，可随时调整任务与勾选完成进度。";
  const statusLines = showCustom
    ? [
        "可设置单次、每天、每周或间隔任务。",
        "未完成任务会进入红色未完成列表。",
        "按顺序完成后才会出现下一次。"
      ]
    : [
        "可提交调整需求让 AI 重新安排。",
        "支持任务拆解与完成打卡。",
        "任务每日自动更新。"
      ];

  return (
    <main className="main daily-page">
      {isCompact ? (
        <section className="daily-switch-top">
          <div className="daily-mode-switch">
            <button
              type="button"
              className={view === "daily" ? "active" : ""}
              onClick={() => switchView("daily")}
            >
              每日任务
            </button>
            <button
              type="button"
              className={view === "custom" ? "active" : ""}
              onClick={() => switchView("custom")}
            >
              待办清单
            </button>
          </div>
        </section>
      ) : null}
      <section className="daily-hero">
        <div>
          <p className="eyebrow">{heroEyebrow}</p>
          <h1>{heroTitle}</h1>
          <p className="lead">{heroLead}</p>
        </div>
        <div className="status-card">
          <div className="status-title">操作提示</div>
          <div className="status-lines">
            {statusLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="daily-section">
        {isCompact ? (
          <div
            className="daily-view-stack"
            style={maxSectionHeight ? { minHeight: `${maxSectionHeight}px` } : undefined}
          >
            <div
              ref={dailyRef}
              className={`daily-view-panel ${showCustom ? "is-hidden" : "is-active"}`}
              aria-hidden={showCustom}
            >
              <DailyTasksModule variant="standalone" />
            </div>
            <div
              ref={customRef}
              className={`daily-view-panel ${showCustom ? "is-active" : "is-hidden"}`}
              aria-hidden={!showCustom}
            >
              <CustomTasksModule variant="standalone" />
            </div>
          </div>
        ) : (
          <DailyTasksModule variant="standalone" />
        )}
      </section>
    </main>
  );
}
