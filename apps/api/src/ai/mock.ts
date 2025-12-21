type MockMetricInput = {
  subject: string;
  correct?: number;
  total?: number;
  timeMinutes?: number;
};

type MockHistoryInput = {
  date?: string;
  metrics?: MockMetricInput[];
  overallAccuracy?: number;
  timeTotalMinutes?: number;
};

const MAX_HISTORY = 3;

function formatMetric(metric: MockMetricInput) {
  const subject = metric.subject?.trim() || "未知科目";
  const correct = Number.isFinite(metric.correct) ? metric.correct : null;
  const total = Number.isFinite(metric.total) ? metric.total : null;
  const time = Number.isFinite(metric.timeMinutes) ? metric.timeMinutes : null;
  const accuracy =
    typeof correct === "number" && typeof total === "number" && total > 0
      ? `${Math.round((correct / total) * 100)}%`
      : "未知";
  return `${subject} ${correct ?? "-"} / ${total ?? "-"} 题 · 用时 ${
    time ?? "-"
  } 分钟 · 正确率 ${accuracy}`;
}

export function buildMockAnalysisPrompt(params: {
  title?: string | null;
  metrics?: MockMetricInput[] | null;
  note?: string | null;
  history?: MockHistoryInput[] | null;
}) {
  const title = params.title?.trim() ?? "";
  const metrics = Array.isArray(params.metrics) ? params.metrics : [];
  const history = Array.isArray(params.history) ? params.history : [];
  const note = params.note?.trim() ?? "";
  const historyLines = history.slice(0, MAX_HISTORY).map((item, index) => {
    const date = item.date?.trim() || `记录 ${index + 1}`;
    const overall =
      typeof item.overallAccuracy === "number"
        ? `整体正确率 ${Math.round(item.overallAccuracy * 100)}%`
        : "整体正确率未知";
    const time =
      typeof item.timeTotalMinutes === "number"
        ? `总用时 ${Math.round(item.timeTotalMinutes)} 分钟`
        : "总用时未知";
    const metricsLine = Array.isArray(item.metrics)
      ? item.metrics.map(formatMetric).join("；")
      : "无分科数据";
    return `${date}：${overall}，${time}。分科：${metricsLine}`;
  });

  const system = [
    "你是公考模考成绩分析师。",
    "请根据图片识别结果和/或手动数据进行分析。",
    "仅输出 JSON，不要输出多余文字。",
    "请给出整体点评、细节点评、提速建议、练习建议、强化目标、下周计划。",
    "如有历史数据，请结合趋势给出建议。"
  ].join("\n");

  const user = [
    title ? `考试名称：${title}` : "",
    metrics.length
      ? `手动数据（优先使用）：\n${metrics.map(formatMetric).join("\n")}`
      : "未提供手动数据，请从图片中识别。",
    historyLines.length
      ? `历史记录（最近 ${historyLines.length} 次）：\n${historyLines.join("\n")}`
      : "无历史记录。",
    note ? `用户补充说明：${note}` : "",
    [
      "请输出以下 JSON 结构：",
      "{",
      '"summary":"...",',
      '"details":["..."],',
      '"speedFocus":["..."],',
      '"practiceFocus":["..."],',
      '"targets":["..."],',
      '"nextWeekPlan":["..."],',
      '"metrics":[{"subject":"...","correct":0,"total":0,"timeMinutes":0,"accuracy":0.0}],',
      '"overall":{"accuracy":0.0,"timeTotalMinutes":0,"strongSubjects":[],"weakSubjects":[]}',
      "}"
    ].join("\n")
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system, user };
}
