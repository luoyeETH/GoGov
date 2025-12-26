function getBeijingDate(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + 8 * 60 * 60 * 1000);
}

function formatBeijingDate(value: Date) {
  return getBeijingDate(value).toISOString().slice(0, 10);
}

function formatBeijingDateTime(value: Date) {
  const beijing = getBeijingDate(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(beijing);
}

export function buildExpenseParsePrompt(params: {
  input: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const nowText = formatBeijingDateTime(now);
  const today = formatBeijingDate(now);

  const system = [
    "你是考试支出记账助手，负责把自然语言消费描述解析为结构化结果。",
    "必须输出 JSON，禁止附加说明文字或 Markdown。",
    "若日期使用“今天/昨天/前天/明天”等相对表达，请以给定的北京时间为基准换算。",
    "若只有月日（如 3月2日），默认使用当前年份。",
    "项目名称要简洁，如“报名费/报班/教材/交通/住宿/打印”。",
    "金额必须是数字（支持小数），不要带货币符号。",
    "无论单条或多条，都统一输出 items 数组。",
    "若无法识别某字段，请填 null。"
  ].join("\n");

  const user = [
    `当前北京时间：${nowText}`,
    `今日日期：${today}`,
    "请解析以下输入：",
    params.input.trim(),
    [
      "输出 JSON 格式：",
      "{",
      '"items": [',
      "  {",
      '    "date":"YYYY-MM-DD",',
      '    "item":"...",',
      '    "amount":120',
      "  }",
      "]",
      "}"
    ].join("\n")
  ].join("\n\n");

  return { system, user };
}
