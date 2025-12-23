"use client";

import { useEffect, useMemo, useState } from "react";
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

const timeSlotOptions = [
  "全天可学（全职备考）",
  "工作日早晨",
  "工作日晚间",
  "午休时段",
  "周末上午",
  "周末下午",
  "周末晚上"
];

type StudyPlanProfile = {
  id: string;
  prepStartDate: string | null;
  totalStudyHours?: number | null;
  totalStudyDurationText?: string | null;
  currentProgress: string | null;
  targetExam: string | null;
  targetExamDate: string | null;
  plannedMaterials: string | null;
  interviewExperience: boolean | null;
  learningGoals: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type PlanMeta = {
  mockReportsUsed?: number;
  profileUpdatedAt?: string | null;
};

type PlanResponse = {
  summary?: string;
  longTermPlan?: string[];
  weeklyPlan?: string[];
  dailyPlan?: string[];
  focusAreas?: string[];
  materials?: string[];
  milestones?: string[];
  riskTips?: string[];
  followUpQuestions?: string[];
  model?: string | null;
  raw?: string;
  meta?: PlanMeta;
  historyId?: string;
};

type PlanHistoryItem = {
  id: string;
  summary?: string | null;
  createdAt: string;
  planData?: PlanResponse | null;
  planRaw?: string | null;
  progressUpdate?: string | null;
};

type RequestState = "idle" | "loading" | "error";

function formatDateInput(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
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

function parseJsonPlan(raw: string) {
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
  const sliced = start >= 0 && end > start ? candidate.slice(start, end + 1) : null;
  const payload = withBraces ?? sliced;
  if (!payload) {
    return null;
  }
  try {
    const parsed = JSON.parse(payload);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as PlanResponse;
  } catch {
    return null;
  }
}

function normalizePlan(data: PlanResponse) {
  if (data.raw) {
    const parsed = parseJsonPlan(data.raw);
    if (parsed) {
      return {
        ...data,
        summary:
          typeof data.summary === "string" && data.summary.trim()
            ? data.summary
            : parsed.summary,
        longTermPlan:
          Array.isArray(data.longTermPlan) && data.longTermPlan.length
            ? data.longTermPlan
            : parsed.longTermPlan,
        weeklyPlan:
          Array.isArray(data.weeklyPlan) && data.weeklyPlan.length
            ? data.weeklyPlan
            : parsed.weeklyPlan,
        dailyPlan:
          Array.isArray(data.dailyPlan) && data.dailyPlan.length
            ? data.dailyPlan
            : parsed.dailyPlan,
        focusAreas:
          Array.isArray(data.focusAreas) && data.focusAreas.length
            ? data.focusAreas
            : parsed.focusAreas,
        materials:
          Array.isArray(data.materials) && data.materials.length
            ? data.materials
            : parsed.materials,
        milestones:
          Array.isArray(data.milestones) && data.milestones.length
            ? data.milestones
            : parsed.milestones,
        riskTips:
          Array.isArray(data.riskTips) && data.riskTips.length
            ? data.riskTips
            : parsed.riskTips,
        followUpQuestions:
          Array.isArray(data.followUpQuestions) && data.followUpQuestions.length
            ? data.followUpQuestions
            : parsed.followUpQuestions,
        raw: undefined
      };
    }
  }
  return data;
}

function hasStructuredPlan(data: PlanResponse) {
  if (typeof data.summary === "string" && data.summary.trim()) {
    return true;
  }
  if (Array.isArray(data.longTermPlan) && data.longTermPlan.length) {
    return true;
  }
  if (Array.isArray(data.weeklyPlan) && data.weeklyPlan.length) {
    return true;
  }
  if (Array.isArray(data.dailyPlan) && data.dailyPlan.length) {
    return true;
  }
  if (Array.isArray(data.focusAreas) && data.focusAreas.length) {
    return true;
  }
  if (Array.isArray(data.materials) && data.materials.length) {
    return true;
  }
  if (Array.isArray(data.milestones) && data.milestones.length) {
    return true;
  }
  if (Array.isArray(data.riskTips) && data.riskTips.length) {
    return true;
  }
  if (Array.isArray(data.followUpQuestions) && data.followUpQuestions.length) {
    return true;
  }
  return false;
}

function buildPlanMarkdown(plan: PlanResponse) {
  const normalized = normalizePlan(plan);
  if (!hasStructuredPlan(normalized) && normalized.raw) {
    return normalized.raw;
  }
  const lines: string[] = [];
  if (normalized.summary) {
    lines.push("### 规划摘要");
    lines.push(normalized.summary);
  }
  if (normalized.longTermPlan && normalized.longTermPlan.length) {
    lines.push("");
    lines.push("### 长期规划");
    normalized.longTermPlan.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.weeklyPlan && normalized.weeklyPlan.length) {
    lines.push("");
    lines.push("### 本周计划");
    normalized.weeklyPlan.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.dailyPlan && normalized.dailyPlan.length) {
    lines.push("");
    lines.push("### 每日执行");
    normalized.dailyPlan.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.focusAreas && normalized.focusAreas.length) {
    lines.push("");
    lines.push("### 强化重点");
    normalized.focusAreas.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.materials && normalized.materials.length) {
    lines.push("");
    lines.push("### 资料与题库建议");
    normalized.materials.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.milestones && normalized.milestones.length) {
    lines.push("");
    lines.push("### 阶段检查点");
    normalized.milestones.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.riskTips && normalized.riskTips.length) {
    lines.push("");
    lines.push("### 风险提醒");
    normalized.riskTips.forEach((item) => lines.push(`- ${item}`));
  }
  if (normalized.followUpQuestions && normalized.followUpQuestions.length) {
    lines.push("");
    lines.push("### 需要补充的问题");
    normalized.followUpQuestions.forEach((item) => lines.push(`- ${item}`));
  }
  return lines.join("\n");
}

export default function StudyPlanPage() {
  const [profile, setProfile] = useState<StudyPlanProfile | null>(null);
  const [profileState, setProfileState] = useState<RequestState>("idle");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [prepStartDate, setPrepStartDate] = useState("");
  const [totalStudyDuration, setTotalStudyDuration] = useState("");
  const [currentProgress, setCurrentProgress] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [targetExamDate, setTargetExamDate] = useState("");
  const [studyResources, setStudyResources] = useState("");
  const [interviewExperience, setInterviewExperience] = useState("");
  const [notes, setNotes] = useState("");

  const [weeklyStudyHours, setWeeklyStudyHours] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [timeNote, setTimeNote] = useState("");
  const [focusGoal, setFocusGoal] = useState("");
  const [progressUpdate, setProgressUpdate] = useState("");
  const [followUpAnswers, setFollowUpAnswers] = useState("");

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [planState, setPlanState] = useState<RequestState>("idle");
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null);
  const [history, setHistory] = useState<PlanHistoryItem[]>([]);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);

  const planMarkdown = useMemo(() => (plan ? buildPlanMarkdown(plan) : ""), [plan]);
  const latestFollowUps = useMemo(() => {
    const questions = history[0]?.planData?.followUpQuestions;
    return Array.isArray(questions) ? questions : [];
  }, [history]);

  const loadProfile = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setProfile(null);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/study-plan/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "获取失败");
      }
      setProfile((data as { profile?: StudyPlanProfile | null }).profile ?? null);
    } catch (err) {
      setProfile(null);
      setProfileMessage(err instanceof Error ? err.message : "获取失败");
    }
  };

  const loadHistory = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistory([]);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/study-plan/history?limit=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.history)) {
        setHistoryMessage(null);
        setHistory(
          data.history.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            summary:
              typeof item.summary === "string"
                ? item.summary
                : typeof (item.planData as { summary?: string } | undefined)?.summary ===
                    "string"
                ? (item.planData as { summary?: string }).summary
                : null,
            createdAt: String(item.createdAt),
            planData: (item.planData ?? null) as PlanResponse | null,
            planRaw: typeof item.planRaw === "string" ? item.planRaw : null,
            progressUpdate:
              typeof item.progressUpdate === "string" ? item.progressUpdate : null
          }))
        );
      }
    } catch (err) {
      setHistory([]);
      setHistoryMessage(err instanceof Error ? err.message : "获取失败");
    }
  };

  useEffect(() => {
    void loadProfile();
    void loadHistory();
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      void loadProfile();
      void loadHistory();
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setPrepStartDate(formatDateInput(profile.prepStartDate));
    if (profile.totalStudyDurationText?.trim()) {
      setTotalStudyDuration(profile.totalStudyDurationText);
    } else if (typeof profile.totalStudyHours === "number") {
      setTotalStudyDuration(`${profile.totalStudyHours} 小时`);
    } else {
      setTotalStudyDuration("");
    }
    setCurrentProgress(profile.currentProgress ?? "");
    setTargetExam(profile.targetExam ?? "");
    setTargetExamDate(formatDateInput(profile.targetExamDate));
    const resourceParts = [
      profile.plannedMaterials ?? "",
      profile.learningGoals ?? ""
    ]
      .map((item) => item.trim())
      .filter(Boolean);
    const uniqueResources: string[] = [];
    for (const part of resourceParts) {
      if (!uniqueResources.includes(part)) {
        uniqueResources.push(part);
      }
    }
    setStudyResources(uniqueResources.join("\n"));
    setInterviewExperience(
      typeof profile.interviewExperience === "boolean"
        ? profile.interviewExperience
          ? "yes"
          : "no"
        : ""
    );
    setNotes(profile.notes ?? "");
  }, [profile]);

  const toggleSlot = (slot: string) => {
    setTimeSlots((prev) =>
      prev.includes(slot) ? prev.filter((item) => item !== slot) : [...prev, slot]
    );
  };

  const handleSaveProfile = async () => {
    if (profileState === "loading") {
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setProfileMessage("请先登录后保存档案。");
      setProfileState("error");
      return;
    }
    setProfileState("loading");
    setProfileMessage(null);
    try {
      const res = await fetch(`${apiBase}/study-plan/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prepStartDate: prepStartDate || null,
          totalStudyDuration: totalStudyDuration.trim() ? totalStudyDuration : null,
          currentProgress: currentProgress || null,
          targetExam: targetExam || null,
          targetExamDate: targetExamDate || null,
          studyResources: studyResources || null,
          interviewExperience:
            interviewExperience === "yes"
              ? true
              : interviewExperience === "no"
              ? false
              : null,
          notes: notes || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "保存失败");
      }
      setProfile((data as { profile?: StudyPlanProfile }).profile ?? null);
      setProfileState("idle");
      setProfileMessage("备考档案已更新，可随时修改。");
    } catch (err) {
      setProfileState("error");
      setProfileMessage(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handleGeneratePlan = async () => {
    if (planState === "loading") {
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setPlanMessage("请先登录后生成规划。");
      setPlanState("error");
      return;
    }
    setPlanState("loading");
    setPlanMessage(null);
    try {
      const res = await fetch(`${apiBase}/ai/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          weeklyStudyHours: weeklyStudyHours.trim() ? weeklyStudyHours : null,
          dailyStudyHours: dailyStudyHours.trim() ? dailyStudyHours : null,
          timeSlots,
          timeNote: timeNote || null,
          focusGoal: focusGoal || null,
          progressUpdate: progressUpdate || null,
          followUpAnswers: followUpAnswers || null
        })
      });
      const data = (await res.json()) as PlanResponse;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "生成失败");
      }
      setPlan(data);
      setPlanMeta(data.meta ?? null);
      setPlanState("idle");
      if (data.historyId) {
        void loadHistory();
      }
    } catch (err) {
      setPlanState("error");
      setPlanMessage(err instanceof Error ? err.message : "生成失败");
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistoryMessage("请先登录后再删除记录。");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/study-plan/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "删除失败");
      }
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setHistoryMessage(null);
    } catch (err) {
      setHistoryMessage(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <main className="main plan-page">
      <section className="plan-hero">
        <div>
          <p className="eyebrow">个性化备考规划</p>
          <h1>基于你的背景与模考数据，生成可执行学习路线</h1>
          <p className="lead">
            首次进入请完善备考档案，系统会结合目标考试时间、可学习时段与近期
            模考成绩，输出长期策略、每周节奏与每日任务清单。
          </p>
        </div>
        <div className="status-card">
          <div className="status-title">数据来源</div>
          <div className="status-lines">
            <span>备考档案：动态更新你的学习画像。</span>
            <span>模考成绩：自动引用近 3 次成绩。</span>
            <span>学习时间：由你选择可学习时段。</span>
          </div>
        </div>
      </section>

      <section className="plan-grid">
        <div className="plan-card">
          <div className="plan-card-header">
            <div>
              <h3>备考档案</h3>
              <p className="form-message">首次进入请完整填写，后续可随时更新。</p>
            </div>
            {profile?.updatedAt ? (
              <span className="plan-updated">更新于 {formatDateTime(profile.updatedAt)}</span>
            ) : null}
          </div>
          {!profile ? (
            <div className="plan-onboard">
              还没有备考档案，请填写你的学习状态与目标考试，我们会自动把信息
              融入规划。
            </div>
          ) : null}

          <div className="plan-form-grid">
            <div className="form-row">
              <label htmlFor="prep-start">初次备考时间</label>
              <input
                id="prep-start"
                type="date"
                value={prepStartDate}
                onChange={(event) => setPrepStartDate(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="total-hours">累计学习时间</label>
              <input
                id="total-hours"
                placeholder="例如 45天 / 2个月 / 两三个月"
                value={totalStudyDuration}
                onChange={(event) => setTotalStudyDuration(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="progress">当前学习进度</label>
              <textarea
                id="progress"
                rows={3}
                placeholder="例如：行测完成 2 轮，申论还在基础阶段"
                value={currentProgress}
                onChange={(event) => setCurrentProgress(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="target-exam">目标考试</label>
              <input
                id="target-exam"
                placeholder="例如：2026 国考 或 江苏省考"
                value={targetExam}
                onChange={(event) => setTargetExam(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="target-exam-date">目标考试时间</label>
              <input
                id="target-exam-date"
                type="date"
                value={targetExamDate}
                onChange={(event) => setTargetExamDate(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="materials">学习工具与进度</label>
              <textarea
                id="materials"
                rows={3}
                placeholder="例如：XX申论20课（已学3课）；XX行测题库（已完成120题）"
                value={studyResources}
                onChange={(event) => setStudyResources(event.target.value)}
              />
              <span className="form-message">
                描述可用资料/课程/题库与当前进度，AI 会在计划里安排对应任务。
              </span>
            </div>
            <div className="form-row">
              <label htmlFor="interview">是否进入过面试</label>
              <select
                id="interview"
                value={interviewExperience}
                onChange={(event) => setInterviewExperience(event.target.value)}
              >
                <option value="">请选择</option>
                <option value="yes">是</option>
                <option value="no">否</option>
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="notes">补充说明</label>
              <textarea
                id="notes"
                rows={2}
                placeholder="例如：白天上班，仅晚间可学习"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          <div className="assist-actions">
            <LoadingButton
              type="button"
              className="primary"
              loading={profileState === "loading"}
              loadingText="保存中..."
              onClick={handleSaveProfile}
            >
              保存备考档案
            </LoadingButton>
          </div>
          {profileMessage ? <p className="form-message">{profileMessage}</p> : null}
        </div>

        <div className="plan-card">
          <div className="plan-card-header">
            <div>
              <h3>规划设置</h3>
              <p className="form-message">补充时间与进度反馈，AI 会接续历史规划。</p>
            </div>
            {planMeta?.mockReportsUsed ? (
              <span className="plan-updated">
                已引用 {planMeta.mockReportsUsed} 次模考
              </span>
            ) : null}
          </div>

          <div className="plan-form-grid">
            <div className="form-row">
              <label htmlFor="weekly-hours">每周可学习时长（小时）</label>
              <input
                id="weekly-hours"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                placeholder="例如 20"
                value={weeklyStudyHours}
                onChange={(event) => setWeeklyStudyHours(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="daily-hours">每日可学习时长（小时）</label>
              <input
                id="daily-hours"
                type="number"
                min="0"
                step="0.5"
                inputMode="decimal"
                placeholder="例如 3"
                value={dailyStudyHours}
                onChange={(event) => setDailyStudyHours(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label>偏好学习时段</label>
              <div className="plan-slots">
                {timeSlotOptions.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`plan-slot${timeSlots.includes(slot) ? " active" : ""}`}
                    onClick={() => toggleSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <span className="form-message">
                可不选；若全职备考，可选“全天可学（全职备考）”。
              </span>
            </div>
            <div className="form-row">
              <label htmlFor="time-note">时间补充</label>
              <input
                id="time-note"
                placeholder="例如：周三只有 1 小时"
                value={timeNote}
                onChange={(event) => setTimeNote(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="focus-goal">本次规划重点</label>
              <textarea
                id="focus-goal"
                rows={2}
                placeholder="例如：强化数量关系 + 资料分析"
                value={focusGoal}
                onChange={(event) => setFocusGoal(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="progress-update">上周/最近完成情况</label>
              <textarea
                id="progress-update"
                rows={3}
                placeholder="例如：资料分析专项未完成 2 次；本周模考正确率 72%"
                value={progressUpdate}
                onChange={(event) => setProgressUpdate(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="followup-answers">回答上次规划追问</label>
              {latestFollowUps.length ? (
                <div className="plan-followups">
                  {latestFollowUps.map((item, index) => (
                    <span key={`${item}-${index}`}>{item}</span>
                  ))}
                </div>
              ) : null}
              <textarea
                id="followup-answers"
                rows={3}
                placeholder="例如：上周每天学习 2 小时；周末做完 1 套行测"
                value={followUpAnswers}
                onChange={(event) => setFollowUpAnswers(event.target.value)}
              />
            </div>
          </div>

          <div className="assist-actions">
            <LoadingButton
              type="button"
              className="primary"
              loading={planState === "loading"}
              loadingText="生成中..."
              onClick={handleGeneratePlan}
            >
              生成学习规划
            </LoadingButton>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setPlan(null);
                setPlanMeta(null);
                setPlanMessage(null);
                setPlanState("idle");
              }}
            >
              清空结果
            </button>
          </div>
          {planMessage ? <p className="form-message">{planMessage}</p> : null}
          {planState === "loading" ? (
            <p className="form-message">AI 正在生成规划，请稍候...</p>
          ) : null}
        </div>
      </section>

      <section className="plan-grid">
        <div className="plan-card plan-output">
          <div className="plan-card-header">
            <h3>规划建议</h3>
            <span className="form-message">长期策略 + 每周/每日执行</span>
          </div>
          {plan ? (
            <div className="assist-output">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{planMarkdown}</ReactMarkdown>
            </div>
          ) : (
            <div className="knowledge-empty">提交规划设置后显示结果。</div>
          )}
        </div>
        <div className="plan-card plan-insights">
          <div className="plan-card-header">
            <h3>规划提示</h3>
            <span className="form-message">快速补充关键信息</span>
          </div>
          <div className="plan-insight-list">
            <div>
              <strong>档案完整度</strong>
              <span>
                {profile
                  ? "已建立，可继续补充细节。"
                  : "未建立，建议先填写备考档案。"}
              </span>
            </div>
            <div>
              <strong>目标考试</strong>
              <span>{targetExam ? targetExam : "尚未填写"}</span>
            </div>
            <div>
              <strong>考试时间</strong>
              <span>{targetExamDate ? targetExamDate : "尚未填写"}</span>
            </div>
            <div>
              <strong>学习时长</strong>
              <span>
                {weeklyStudyHours || dailyStudyHours
                  ? `每周 ${weeklyStudyHours || "-"}h / 每日 ${
                      dailyStudyHours || "-"
                    }h`
                  : "尚未设置"}
              </span>
            </div>
            <div>
              <strong>模考引用</strong>
              <span>
                {planMeta?.mockReportsUsed
                  ? `近 ${planMeta.mockReportsUsed} 次模考已纳入。`
                  : "尚未生成规划"}
              </span>
            </div>
            <div>
              <strong>档案更新时间</strong>
              <span>
                {planMeta?.profileUpdatedAt
                  ? formatDateTime(planMeta.profileUpdatedAt)
                  : "尚未同步"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="plan-grid">
        <div className="plan-card plan-history">
          <div className="plan-card-header">
            <h3>规划历史</h3>
            <span className="form-message">最近 30 次规划记录</span>
          </div>
          <div className="plan-history-list">
            {history.length ? (
              history.map((item) => (
                <div key={item.id} className="plan-history-item">
                  <div className="plan-history-header">
                    <div>
                      <strong>备考规划</strong>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                    <div className="plan-history-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          setPlan(
                            item.planData ?? (item.planRaw ? { raw: item.planRaw } : null)
                          );
                          setPlanMeta(null);
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
                  <p>{item.summary ?? "未生成摘要。"}</p>
                </div>
              ))
            ) : (
              <div className="knowledge-empty">暂无历史记录。</div>
            )}
          </div>
          {historyMessage ? <p className="form-message">{historyMessage}</p> : null}
        </div>
      </section>
    </main>
  );
}
