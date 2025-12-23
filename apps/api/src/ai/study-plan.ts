type StudyPlanProfileInput = {
  prepStartDate?: Date | null;
  totalStudyHours?: number | null;
  totalStudyDurationText?: string | null;
  currentProgress?: string | null;
  targetExam?: string | null;
  targetExamDate?: Date | null;
  plannedMaterials?: string | null;
  interviewExperience?: boolean | null;
  learningGoals?: string | null;
  notes?: string | null;
};

type StudyPlanPreferenceInput = {
  weeklyStudyHours?: number | null;
  dailyStudyHours?: number | null;
  timeSlots?: string[] | null;
  timeNote?: string | null;
  focusGoal?: string | null;
};

type MockMetricInput = {
  subject?: string | null;
  correct?: number | null;
  total?: number | null;
  timeMinutes?: number | null;
  accuracy?: number | null;
};

type MockReportInput = {
  title?: string | null;
  createdAt?: Date | string | null;
  overallAccuracy?: number | null;
  timeTotalMinutes?: number | null;
  metrics?: MockMetricInput[] | null;
};

type PlanHistoryInput = {
  date?: Date | string | null;
  summary?: string | null;
  longTermPlan?: string[] | null;
  weeklyPlan?: string[] | null;
  dailyPlan?: string[] | null;
  followUpQuestions?: string[] | null;
  progressUpdate?: string | null;
  followUpAnswers?: string | null;
};

function getBeijingDate(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + 8 * 60 * 60 * 1000);
}

function formatDateOnly(value?: Date | string | null) {
  if (!value) {
    return "";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const beijing = getBeijingDate(date);
  return beijing.toISOString().slice(0, 10);
}

function formatDateTime(value: Date) {
  const beijing = getBeijingDate(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(beijing);
}

function formatMockMetric(metric: MockMetricInput) {
  const subject = metric.subject?.trim() || "未知科目";
  const correct = Number.isFinite(metric.correct ?? NaN)
    ? metric.correct
    : null;
  const total = Number.isFinite(metric.total ?? NaN) ? metric.total : null;
  const time = Number.isFinite(metric.timeMinutes ?? NaN)
    ? metric.timeMinutes
    : null;
  const accuracyValue =
    typeof correct === "number" && typeof total === "number" && total > 0
      ? correct / total
      : typeof metric.accuracy === "number" && Number.isFinite(metric.accuracy)
      ? metric.accuracy
      : null;
  const accuracy =
    typeof accuracyValue === "number"
      ? `${Math.round(accuracyValue * 1000) / 10}%`
      : "未知";
  return `${subject} ${correct ?? "-"}/${total ?? "-"} 题 · 用时 ${
    time ?? "-"
  } 分钟 · 正确率 ${accuracy}`;
}

function formatMockReport(report: MockReportInput) {
  const date = formatDateOnly(report.createdAt) || "未知日期";
  const title = report.title?.trim() || "模考";
  const accuracy =
    typeof report.overallAccuracy === "number" &&
    Number.isFinite(report.overallAccuracy)
      ? `${Math.round(report.overallAccuracy * 1000) / 10}%`
      : "未知";
  const time =
    typeof report.timeTotalMinutes === "number" &&
    Number.isFinite(report.timeTotalMinutes)
      ? `${Math.round(report.timeTotalMinutes)} 分钟`
      : "未知";
  const metrics = Array.isArray(report.metrics) && report.metrics.length
    ? report.metrics.map(formatMockMetric).join("；")
    : "无分科数据";
  return `${date} ${title}：整体正确率 ${accuracy}，总用时 ${time}。分科：${metrics}`;
}

function formatTimeBudget(preference: StudyPlanPreferenceInput) {
  const pieces: string[] = [];
  if (typeof preference.weeklyStudyHours === "number") {
    pieces.push(`每周可学习 ${preference.weeklyStudyHours} 小时`);
  }
  if (typeof preference.dailyStudyHours === "number") {
    pieces.push(`每日可学习 ${preference.dailyStudyHours} 小时`);
  }
  if (Array.isArray(preference.timeSlots) && preference.timeSlots.length) {
    pieces.push(`偏好时段：${preference.timeSlots.join("、")}`);
  }
  if (preference.timeNote?.trim()) {
    pieces.push(`补充：${preference.timeNote.trim()}`);
  }
  return pieces.length ? pieces.join("；") : "未填写可学习时间";
}

function formatStudyDuration(profile: StudyPlanProfileInput) {
  if (profile.totalStudyDurationText?.trim()) {
    return profile.totalStudyDurationText.trim();
  }
  if (typeof profile.totalStudyHours === "number") {
    return `${profile.totalStudyHours} 小时`;
  }
  return "";
}

function formatStudyResources(profile: StudyPlanProfileInput) {
  const resources: string[] = [];
  if (profile.plannedMaterials?.trim()) {
    resources.push(profile.plannedMaterials.trim());
  }
  if (profile.learningGoals?.trim()) {
    const value = profile.learningGoals.trim();
    if (!resources.includes(value)) {
      resources.push(value);
    }
  }
  return resources.join("\n");
}

function formatPlanHistory(history: PlanHistoryInput[]) {
  if (!history.length) {
    return ["无历史规划记录。"];
  }
  return history.map((record, index) => {
    const date = formatDateOnly(record.date) || `记录 ${index + 1}`;
    const summary = record.summary?.trim() || "无摘要";
    const weekly = Array.isArray(record.weeklyPlan) && record.weeklyPlan.length
      ? `本周计划：${record.weeklyPlan.join("；")}`
      : "";
    const daily = Array.isArray(record.dailyPlan) && record.dailyPlan.length
      ? `每日安排：${record.dailyPlan.join("；")}`
      : "";
    const followUps =
      Array.isArray(record.followUpQuestions) && record.followUpQuestions.length
        ? `待补充问题：${record.followUpQuestions.join("；")}`
        : "";
    const progress = record.progressUpdate?.trim()
      ? `完成反馈：${record.progressUpdate.trim()}`
      : "";
    const answers = record.followUpAnswers?.trim()
      ? `追问回答：${record.followUpAnswers.trim()}`
      : "";
    return [date, summary, weekly, daily, progress, answers, followUps]
      .filter(Boolean)
      .join("，");
  });
}

export function buildStudyPlanPrompt(params: {
  profile?: StudyPlanProfileInput | null;
  preferences?: StudyPlanPreferenceInput | null;
  mockReports?: MockReportInput[] | null;
  planHistory?: PlanHistoryInput[] | null;
  weeklyTaskProgress?: string[] | null;
  progressUpdate?: string | null;
  followUpAnswers?: string | null;
  now?: Date;
}) {
  const profile = params.profile ?? null;
  const preferences = params.preferences ?? null;
  const mockReports = Array.isArray(params.mockReports) ? params.mockReports : [];
  const planHistory = Array.isArray(params.planHistory) ? params.planHistory : [];
  const weeklyTaskProgress = Array.isArray(params.weeklyTaskProgress)
    ? params.weeklyTaskProgress
    : [];
  const progressUpdate = params.progressUpdate?.trim() ?? "";
  const followUpAnswers = params.followUpAnswers?.trim() ?? "";
  const now = params.now ?? new Date();
  const nowText = formatDateTime(now);
  const examDateText = formatDateOnly(profile?.targetExamDate);
  const examDateValue = profile?.targetExamDate ?? null;
  const daysToExam = examDateValue
    ? Math.ceil((examDateValue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const system = [
    "你是公考备考规划师，擅长制定可执行的长期/每周/每日计划。",
    "请结合用户背景信息、模考成绩、可学习时间和考试日期。",
    "输出必须是 JSON，禁止添加额外说明文字。",
    "计划需具体可操作，包含时间分配与重点科目安排。",
    "请把学习工具与进度拆解为可执行任务，写入周计划。",
    "若有完成情况反馈，请说明未完成任务如何调整到本周。",
    "如信息不足，请在 followUpQuestions 中提出 2-4 个追问。"
  ].join("\n");

  const profileLines = profile
    ? [
        profile.prepStartDate
          ? `备考开始时间：${formatDateOnly(profile.prepStartDate)}`
          : "备考开始时间：未填写",
        formatStudyDuration(profile)
          ? `累计学习时间：${formatStudyDuration(profile)}`
          : "累计学习时间：未填写",
        profile.currentProgress?.trim()
          ? `当前学习进度：${profile.currentProgress.trim()}`
          : "当前学习进度：未填写",
        profile.targetExam?.trim()
          ? `目标考试：${profile.targetExam.trim()}`
          : "目标考试：未填写",
        examDateText
          ? `目标考试时间：${examDateText}${
              typeof daysToExam === "number" ? `（距离 ${daysToExam} 天）` : ""
            }`
          : "目标考试时间：未填写",
        formatStudyResources(profile)
          ? `学习工具与进度：${formatStudyResources(profile)}`
          : "学习工具与进度：未填写",
        typeof profile.interviewExperience === "boolean"
          ? `是否进入过面试：${profile.interviewExperience ? "是" : "否"}`
          : "是否进入过面试：未填写",
        profile.notes?.trim() ? `补充说明：${profile.notes.trim()}` : ""
      ].filter(Boolean)
    : ["暂无备考档案信息，请根据常见备考节奏给出基础规划。"];

  const mockLines = mockReports.length
    ? mockReports.map(formatMockReport)
    : ["暂无近期模考成绩。"];

  const preferenceLines = preferences
    ? [
        formatTimeBudget(preferences),
        preferences.focusGoal?.trim() ? `本次规划重点：${preferences.focusGoal}` : ""
      ].filter(Boolean)
    : ["未填写可学习时间。"];

  const historyLines = formatPlanHistory(planHistory.slice(0, 2));
  const weeklyTaskLines = weeklyTaskProgress.length
    ? weeklyTaskProgress
    : ["无本周任务记录。"];

  const user = [
    `当前时间：${nowText}`,
    profileLines.join("\n"),
    "可学习时间与偏好：",
    preferenceLines.join("\n"),
    "近期规划回顾：",
    historyLines.join("\n"),
    "本周每日任务完成情况：",
    weeklyTaskLines.join("\n"),
    progressUpdate ? `完成情况反馈：${progressUpdate}` : "完成情况反馈：未填写",
    followUpAnswers ? `对上次追问的回答：${followUpAnswers}` : "对上次追问的回答：未填写",
    "近期模考成绩：",
    mockLines.join("\n"),
    [
      "请输出以下 JSON 结构：",
      "{",
      '"summary":"...",',
      '"longTermPlan":["..."],',
      '"weeklyPlan":["..."],',
      '"dailyPlan":["..."],',
      '"focusAreas":["..."],',
      '"materials":["..."],',
      '"milestones":["..."],',
      '"riskTips":["..."],',
      '"followUpQuestions":["..."]',
      "}"
    ].join("\n")
  ].join("\n\n");

  return { system, user };
}
