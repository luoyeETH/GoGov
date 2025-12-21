type DailyTask = {
  title: string;
  durationMinutes?: number | null;
  notes?: string | null;
  subtasks?: string[] | null;
};

type DailyTaskContext = {
  dateLabel: string;
  planSummary?: string | null;
  weeklyPlan?: string[] | null;
  dailyPlan?: string[] | null;
  focusAreas?: string[] | null;
  materials?: string[] | null;
  preferencesText?: string | null;
  mockReportsText?: string | null;
  adjustNote?: string | null;
  progressUpdate?: string | null;
  followUpAnswers?: string | null;
  existingTasks?: DailyTask[] | null;
};

function formatTask(task: DailyTask) {
  const base = task.title.trim();
  const duration =
    typeof task.durationMinutes === "number" && Number.isFinite(task.durationMinutes)
      ? `（${Math.round(task.durationMinutes)} 分钟）`
      : "";
  const notes = task.notes?.trim() ? `备注：${task.notes.trim()}` : "";
  const subtasks = Array.isArray(task.subtasks) && task.subtasks.length
    ? `拆解：${task.subtasks.join("；")}`
    : "";
  return [base + duration, notes, subtasks].filter(Boolean).join("，");
}

export function buildDailyTaskPrompt(context: DailyTaskContext) {
  const system = [
    "你是公考备考执行助手，负责生成当天可执行的学习任务清单。",
    "任务清单需要细化到具体课程/题目/资料，并给出可执行时长。",
    "输出必须是 JSON，禁止添加额外说明文字。",
    "如有调整需求，需要基于已有任务进行修订。"
  ].join("\n");

  const userLines = [
    `当前日期：${context.dateLabel}`,
    context.planSummary ? `规划摘要：${context.planSummary}` : "规划摘要：未提供",
    context.weeklyPlan?.length ? `本周计划：${context.weeklyPlan.join("；")}` : "本周计划：未提供",
    context.dailyPlan?.length ? `每日计划：${context.dailyPlan.join("；")}` : "每日计划：未提供",
    context.focusAreas?.length ? `重点方向：${context.focusAreas.join("；")}` : "重点方向：未提供",
    context.materials?.length ? `资料/工具：${context.materials.join("；")}` : "资料/工具：未提供",
    context.preferencesText ? `学习时间偏好：${context.preferencesText}` : "学习时间偏好：未提供",
    context.mockReportsText ? `近期模考：${context.mockReportsText}` : "近期模考：未提供",
    context.progressUpdate ? `完成反馈：${context.progressUpdate}` : "完成反馈：未提供",
    context.followUpAnswers ? `追问回答：${context.followUpAnswers}` : "追问回答：未提供",
    context.adjustNote ? `调整需求：${context.adjustNote}` : "调整需求：无",
    context.existingTasks?.length
      ? `已有任务：${context.existingTasks.map(formatTask).join("；")}`
      : "已有任务：无",
    [
      "请输出以下 JSON 结构：",
      "{",
      '"summary":"...",',
      '"tasks":[',
      "  {",
      '    "title":"...",',
      '    "durationMinutes":30,',
      '    "notes":"...",',
      '    "subtasks":["...","..."]',
      "  }",
      "]",
      "}"
    ].join("\n")
  ];

  return { system, user: userLines.join("\n\n") };
}

export function buildTaskBreakdownPrompt(task: string, context?: string | null) {
  const system = [
    "你是公考学习任务拆解助手。",
    "请把单一任务拆解为 3-6 条可执行子任务。",
    "输出必须是 JSON，禁止添加额外说明文字。"
  ].join("\n");

  const user = [
    `任务：${task}`,
    context ? `背景：${context}` : "背景：未提供",
    [
      "请输出以下 JSON 结构：",
      "{",
      '"subtasks":["...","...","..."]',
      "}"
    ].join("\n")
  ].join("\n\n");

  return { system, user };
}
