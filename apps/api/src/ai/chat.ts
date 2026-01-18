type UserSnapshot = {
  username?: string | null;
  gender?: string | null;
  age?: number | null;
  examStartDate?: Date | null;
};

type StudyPlanProfileSnapshot = {
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

type MockReportSnapshot = {
  title?: string | null;
  overallAccuracy?: number | null;
  timeTotalMinutes?: number | null;
  analysis?: unknown | null;
  analysisRaw?: string | null;
  createdAt: Date;
};

function formatText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "未提供";
}

function formatGender(value?: string | null) {
  if (!value) {
    return "未提供";
  }
  if (value === "male") {
    return "男";
  }
  if (value === "female") {
    return "女";
  }
  if (value === "hidden") {
    return "隐藏";
  }
  return value;
}

function formatNumber(value?: number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.round(value * 10) / 10}`;
  }
  return "未提供";
}

function formatDate(value?: Date | null) {
  if (!value || Number.isNaN(value.getTime())) {
    return "未提供";
  }
  return value.toISOString().slice(0, 10);
}

function formatBoolean(value?: boolean | null) {
  if (value === true) {
    return "是";
  }
  if (value === false) {
    return "否";
  }
  return "未提供";
}

function formatAccuracy(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "未知";
  }
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}%`;
}

function formatMinutes(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "未知";
  }
  return `${Math.round(value)} 分钟`;
}

function truncateText(value: string, limit = 80) {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit)}…`;
}

function extractMockSummary(report: MockReportSnapshot) {
  const analysis = report.analysis as { summary?: string } | null;
  const summary =
    typeof analysis?.summary === "string" ? analysis.summary.trim() : "";
  if (summary) {
    return truncateText(summary);
  }
  if (report.analysisRaw) {
    return truncateText(report.analysisRaw.trim());
  }
  return "";
}

export function buildChatSystemPrompt(params: {
  user: UserSnapshot;
  studyPlanProfile: StudyPlanProfileSnapshot | null;
  planSummary: string | null;
  mockReports: MockReportSnapshot[];
}) {
  const baseSystem = [
    "你是 GoGov 公考 AI 伴学助手，负责长期跟踪用户备考并提供指导。",
    "回答要求：中文、简洁、可执行。先给结论/要点，再给步骤或建议。",
    "回复尽量控制在 200 字以内，避免长篇大论。",
    "如信息不足，提出 1-3 个关键澄清问题。",
    "若用户当下输入与记忆冲突，以用户最新输入为准，并提醒更新档案。",
    "不要编造未提供的信息。"
  ].join("\n");

  const profileLines = [
    `- 昵称: ${formatText(params.user.username)}`,
    `- 性别: ${formatGender(params.user.gender)}`,
    `- 年龄: ${formatNumber(params.user.age)}`,
    `- 备考起始: ${formatDate(params.user.examStartDate)}`
  ].join("\n");

  const plan = params.studyPlanProfile;
  const totalStudyHours =
    typeof plan?.totalStudyHours === "number" && Number.isFinite(plan.totalStudyHours)
      ? `${Math.round(plan.totalStudyHours * 10) / 10} 小时`
      : "未提供";
  const planLines = [
    `- 目标考试: ${formatText(plan?.targetExam)}`,
    `- 目标考试日期: ${formatDate(plan?.targetExamDate)}`,
    `- 当前进度: ${formatText(plan?.currentProgress)}`,
    `- 备考周期: ${formatText(plan?.totalStudyDurationText)}`,
    `- 累计学习时长: ${totalStudyHours}`,
    `- 计划资料: ${formatText(plan?.plannedMaterials)}`,
    `- 面试经验: ${formatBoolean(plan?.interviewExperience)}`,
    `- 学习目标: ${formatText(plan?.learningGoals)}`,
    `- 备注: ${formatText(plan?.notes)}`
  ].join("\n");

  const planSummary = params.planSummary?.trim()
    ? truncateText(params.planSummary.trim(), 160)
    : "暂无";

  const mockReportLines = params.mockReports.map((report, index) => {
    const title = report.title?.trim() || `模考记录 ${index + 1}`;
    const summary = extractMockSummary(report);
    return [
      `- ${formatDate(report.createdAt)} | ${title}`,
      `正确率 ${formatAccuracy(report.overallAccuracy)} | 用时 ${formatMinutes(
        report.timeTotalMinutes
      )}`,
      summary ? `总结: ${summary}` : null
    ]
      .filter(Boolean)
      .join(" | ");
  });

  return [
    baseSystem,
    "以下是可用的用户记忆信息（可能不完整）：",
    "【用户档案】",
    profileLines,
    "【学习规划】",
    planLines,
    `【最新计划摘要】${planSummary}`,
    "【最近模考（最多 3 次）】",
    mockReportLines.length ? mockReportLines.join("\n") : "- 暂无",
    "请在回答中结合用户目标、薄弱项与模考表现。"
  ].join("\n");
}
