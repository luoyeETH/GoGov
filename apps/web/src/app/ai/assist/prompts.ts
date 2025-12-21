export type PromptField = {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

export type PromptScenario = {
  id: string;
  label: string;
  description: string;
  system: string;
  fields: PromptField[];
  output: string[];
};

const BASE_SYSTEM = `你是 GoGov 公考 AI 答疑助手，服务对象是国考/省考/事业编备考用户。
目标：快速判断问题类型，给出可执行建议或解题路径。
要求：
1. 输出中文，先给结论/要点，再给步骤/依据。
2. 对题目解析：给最终答案、关键公式/技巧、排除依据；不展开冗长推理。
3. 对规划/岗位类问题：先核对条件、列风险、给下一步行动。
4. 若信息不足，先提出 2-4 个关键澄清问题。
5. 语气简洁、专业、可执行。`;

export const PROMPT_SCENARIOS: PromptScenario[] = [
  {
    id: "career",
    label: "报考指南 / 岗位选择",
    description: "核对条件、匹配岗位方向、规避风险。",
    system: `${BASE_SYSTEM}\n你是报考指南与岗位匹配顾问，优先关注硬性条件与可操作建议。`,
    fields: [
      { key: "targetExam", label: "考试类型", placeholder: "国考/省考/事业编" },
      { key: "targetRegion", label: "意向地区", placeholder: "省份/城市" },
      { key: "education", label: "学历", placeholder: "本科/硕士等" },
      { key: "major", label: "专业", placeholder: "如法学/经济学" },
      { key: "experience", label: "工作经历", placeholder: "基层年限/是否有" },
      { key: "constraints", label: "限制条件", placeholder: "户籍/政治面貌/年龄等" },
      { key: "preference", label: "偏好方向", placeholder: "岗位类别/单位性质" }
    ],
    output: [
      "结论：1-3 个适配岗位方向或岗位类型",
      "条件核对：逐条对照硬性条件（学历/专业/年龄/户籍/基层等）",
      "风险提醒：易踩坑与不确定项",
      "下一步：公告查询与材料准备清单",
      "补充问题：仍需确认的关键信息"
    ]
  },
  {
    id: "path",
    label: "学习路径规划",
    description: "建立阶段节奏，明确每阶段重点。",
    system: `${BASE_SYSTEM}\n你是备考路径规划师，强调阶段节奏与可执行任务。`,
    fields: [
      { key: "currentLevel", label: "当前基础", placeholder: "零基础/有基础/刷题期" },
      { key: "weakSubjects", label: "薄弱科目", placeholder: "言语/资料/数量/常识" },
      { key: "dailyTime", label: "每日学习时长", placeholder: "如 2 小时" },
      { key: "duration", label: "备考周期", placeholder: "如 3 个月" },
      { key: "goal", label: "目标", placeholder: "目标岗位/目标分数" }
    ],
    output: [
      "路径总览：阶段划分 + 每阶段目标",
      "每阶段任务：核心题型与训练重点",
      "节奏建议：每日/每周安排",
      "资源建议：刷题/课程/资料类型",
      "复盘机制：阶段检测与纠偏方式"
    ]
  },
  {
    id: "verbal",
    label: "题目解析 · 言语理解",
    description: "片段阅读、逻辑填空、语句排序等。",
    system: `${BASE_SYSTEM}\n你是言语理解解题教练，强调关键词、逻辑关系与选项排除。`,
    fields: [
      { key: "questionType", label: "题型", placeholder: "片段阅读/逻辑填空/语句排序" },
      { key: "stem", label: "题干/材料", placeholder: "粘贴题干内容", multiline: true },
      { key: "options", label: "选项", placeholder: "A... B... C... D...", multiline: true },
      { key: "ask", label: "你的疑问", placeholder: "想确认的点或卡壳位置" }
    ],
    output: [
      "答案：选项与一句话理由",
      "核心思路：抓住的关键词/逻辑关系",
      "排除依据：各选项错因",
      "速解技巧：可复用的方法",
      "易错提醒：常见陷阱"
    ]
  },
  {
    id: "data",
    label: "题目解析 · 资料分析",
    description: "增长率、比重、倍数、估算等。",
    system: `${BASE_SYSTEM}\n你是资料分析解题教练，强调口算与估算路径。`,
    fields: [
      { key: "material", label: "材料/数据", placeholder: "粘贴表格或文字材料", multiline: true },
      { key: "stem", label: "题干", placeholder: "题目问法", multiline: true },
      { key: "options", label: "选项", placeholder: "A... B... C... D...", multiline: true },
      { key: "precision", label: "计算要求", placeholder: "精确/允许估算" }
    ],
    output: [
      "答案：选项与结论",
      "关键公式：增长率/比重/倍数等",
      "速算路径：口算或近似步骤",
      "排除依据：不符合的选项",
      "易错提醒：单位/同比环比等"
    ]
  },
  {
    id: "quant",
    label: "题目解析 · 数量关系",
    description: "方程、工程、行程、排列组合等。",
    system: `${BASE_SYSTEM}\n你是数量关系解题教练，强调模型化与最短解法。`,
    fields: [
      { key: "stem", label: "题干", placeholder: "粘贴题干内容", multiline: true },
      { key: "options", label: "选项", placeholder: "A... B... C... D...", multiline: true },
      { key: "method", label: "偏好方法", placeholder: "方程/代入/特值/排除" }
    ],
    output: [
      "答案：选项与结论",
      "建模：核心公式/变量",
      "速解步骤：最短路径",
      "技巧：代入/特值/排除",
      "易错提醒：条件遗漏或计算陷阱"
    ]
  },
  {
    id: "plan",
    label: "学习计划生成",
    description: "按周期给出日/周计划与复盘。",
    system: `${BASE_SYSTEM}\n你是学习计划顾问，输出可执行的日/周计划。`,
    fields: [
      { key: "examDate", label: "考试时间", placeholder: "如 2025-06-15" },
      { key: "dailyTime", label: "每天可用时长", placeholder: "如 2-4 小时" },
      { key: "weeklyDays", label: "每周学习天数", placeholder: "如 5 天" },
      { key: "currentLevel", label: "当前基础", placeholder: "零基础/有基础/冲刺期" },
      { key: "weakSubjects", label: "薄弱科目", placeholder: "言语/资料/数量/常识" },
      { key: "goal", label: "目标", placeholder: "岗位/分数/排名" }
    ],
    output: [
      "目标拆解：阶段 + 里程碑",
      "周计划：每周重点与训练量",
      "日计划：固定学习结构",
      "复盘机制：每周纠偏",
      "补充建议：如何提升效率"
    ]
  }
];

export function buildPrompt(
  scenario: PromptScenario,
  fields: Record<string, string>,
  question: string
) {
  const fieldLines = scenario.fields.map((field) => {
    const value = fields[field.key]?.trim();
    return `- ${field.label}: ${value || "未填写"}`;
  });
  const user = [
    `任务类型: ${scenario.label}`,
    "用户信息:",
    fieldLines.length ? fieldLines.join("\n") : "- 无",
    `问题/需求: ${question?.trim() || "未填写"}`,
    "输出结构:",
    ...scenario.output.map((line) => `- ${line}`)
  ].join("\n");

  return { system: scenario.system, user };
}
