import type { QuickPracticeCategory, QuickPracticeQuestion } from "@gogov/shared";

const categories: QuickPracticeCategory[] = [
  {
    id: "basic-add-2",
    name: "两位数加减",
    group: "基础速算",
    description: "两位数加减心算与凑整练习。"
  },
  {
    id: "basic-add-3",
    name: "三位数加减",
    group: "基础速算",
    description: "三位数加减拆分与进位训练。"
  },
  {
    id: "basic-sum",
    name: "多数组合加减",
    group: "基础速算",
    description: "多项数字的拆分与快速求和。"
  },
  {
    id: "basic-mixed",
    name: "混合加减",
    group: "基础速算",
    description: "加减混合连算保持数感。"
  },
  {
    id: "basic-mul-2x1",
    name: "两位数乘一位数",
    group: "基础速算",
    description: "两位数乘一位数的拆分心算。"
  },
  {
    id: "basic-mul-3x1",
    name: "三位数乘一位数",
    group: "基础速算",
    description: "三位数乘一位数的拆分心算。"
  },
  {
    id: "basic-mul-11",
    name: "两位数乘11",
    group: "基础速算",
    description: "11 倍乘法的首尾相加技巧。"
  },
  {
    id: "basic-mul-15",
    name: "两位数乘15",
    group: "基础速算",
    description: "拆成 10% + 5% 的乘法心算。"
  },
  {
    id: "basic-square",
    name: "常见平方数",
    group: "基础速算",
    description: "11-30 的常见平方数记忆。"
  },
  {
    id: "basic-div",
    name: "三位数除以1/2位数",
    group: "基础速算",
    description: "整除与估算的分拆练习。"
  },
  {
    id: "percent-precision",
    name: "百分数精准转化",
    group: "基础速算",
    description: "带小数百分数与小数的快速互化。"
  },
  {
    id: "tail-digit",
    name: "尾数判定",
    group: "资料分析专项",
    description: "通过末位数字快速判断乘积或和的尾数。"
  },
  {
    id: "percent-decimal",
    name: "分数与百分数互化",
    group: "资料分析专项",
    description: "1/1-1/20 与百分数的快速互化。"
  },
  {
    id: "base-period",
    name: "基期计算",
    group: "资料分析专项",
    description: "已知现期与增长率快速估算基期。"
  },
  {
    id: "trunc-division-2",
    name: "截位直除（左二位）",
    group: "资料分析专项",
    description: "左二位截位的比值快速估算。"
  },
  {
    id: "trunc-division-3",
    name: "截位直除（左三位）",
    group: "资料分析专项",
    description: "左三位截位的高精度估算。"
  },
  {
    id: "split-multiply",
    name: "乘法拆分（1+r）",
    group: "资料分析专项",
    description: "1+r 拆分叠加的心算训练。"
  },
  {
    id: "growth-nplus1",
    name: "增长量快速计算",
    group: "资料分析专项",
    description: "r=1/n 时增长量 A/(n+1)。"
  },
  {
    id: "growth-two-year",
    name: "隔年增长率计算",
    group: "资料分析专项",
    description: "r1 + r2 + r1×r2 快速估算。"
  },
  {
    id: "growth-mix-weight",
    name: "混合增长率判定",
    group: "资料分析专项",
    description: "给出总增速判断权重大小。"
  },
  {
    id: "growth-average-approx",
    name: "年均增长率近似",
    group: "资料分析专项",
    description: "小 r 下使用 1+nr 估算。"
  },
  {
    id: "ratio-change",
    name: "比重变化量计算",
    group: "资料分析专项",
    description: "比重变化量公式的快速估算。"
  },
  {
    id: "ratio-compare",
    name: "现期倍数对比",
    group: "资料分析专项",
    description: "现期倍数与基期倍数的大小判断。"
  },
  {
    id: "growth-rate",
    name: "增长率估算",
    group: "资料分析专项",
    description: "现期与基期大数快速估算增长率。"
  },
  {
    id: "proportion",
    name: "比重估算",
    group: "资料分析专项",
    description: "大数比重的截位直除与百分数估算。"
  },
  {
    id: "formula-memory",
    name: "公式记忆（双向）",
    group: "资料分析专项",
    description: "资料分析核心公式混合记忆：名称选公式、公式选名称。"
  }
];

const generators: Record<string, () => QuickPracticeQuestion> = {
  "basic-add-2": generateBasicAddTwo,
  "basic-add-3": generateBasicAddThree,
  "basic-sum": generateBasicSum,
  "basic-mixed": generateBasicMixed,
  "basic-mul-2x1": generateBasicMulTwoByOne,
  "basic-mul-3x1": generateBasicMulThreeByOne,
  "basic-mul-11": generateBasicMulEleven,
  "basic-mul-15": generateBasicMulFifteen,
  "basic-square": generateBasicSquare,
  "basic-div": generateBasicDivision,
  "percent-precision": generatePercentPrecision,
  "tail-digit": generateTailDigit,
  "percent-decimal": generatePercentDecimal,
  "base-period": generateBasePeriod,
  "trunc-division-2": generateTruncDivisionTwo,
  "trunc-division-3": generateTruncDivisionThree,
  "split-multiply": generateSplitMultiply,
  "growth-nplus1": generateGrowthNPlusOne,
  "growth-two-year": generateGrowthTwoYear,
  "growth-mix-weight": generateGrowthMixWeight,
  "growth-average-approx": generateGrowthAverageApprox,
  "ratio-change": generateRatioChange,
  "ratio-compare": generateRatioCompare,
  "growth-rate": generateGrowthRate,
  proportion: generateProportion,
  "formula-memory": generateFormulaMemory
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildChoices(correct: string, pool: string[]) {
  const options = new Set([correct]);
  const candidates = pool.filter((item) => item !== correct);
  while (options.size < 4 && candidates.length > 0) {
    const index = randInt(0, candidates.length - 1);
    options.add(candidates.splice(index, 1)[0]);
  }
  return shuffle(Array.from(options));
}

function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

function buildPercentChoices(value: number, decimals = 1) {
  const options = new Set([formatPercent(value, decimals)]);
  let attempts = 0;
  while (options.size < 4 && attempts < 40) {
    const delta = randInt(5, 30) / 10;
    const direction = Math.random() > 0.5 ? 1 : -1;
    let candidate = value + direction * delta;
    candidate = Math.max(0.1, Math.min(99.9, candidate));
    options.add(formatPercent(candidate, decimals));
    attempts += 1;
  }
  return shuffle(Array.from(options));
}

const UNIT_DENOMINATORS = Array.from({ length: 20 }, (_, index) => index + 1);
const FRACTION_POOL = UNIT_DENOMINATORS.map((denom) => `1/${denom}`);
const PERCENT_POOL = UNIT_DENOMINATORS.map((denom) =>
  formatPercent(100 / denom, 1)
);

function formatNumber(value: number, decimals = 0) {
  if (decimals > 0) {
    return value.toFixed(decimals);
  }
  return Math.round(value).toString();
}

function buildNumberChoices(value: number, decimals = 0, step = 5) {
  const options = new Set([formatNumber(value, decimals)]);
  let attempts = 0;
  while (options.size < 4 && attempts < 60) {
    const magnitude = step * randInt(1, 4);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const candidate = value + direction * magnitude;
    if (candidate >= 0) {
      options.add(formatNumber(candidate, decimals));
    }
    attempts += 1;
  }
  return shuffle(Array.from(options));
}

function formatDecimal(value: number, decimals = 3) {
  return value.toFixed(decimals);
}

function buildDecimalChoices(value: number, decimals = 3) {
  const options = new Set([formatDecimal(value, decimals)]);
  const step = Math.pow(10, -decimals);
  let attempts = 0;
  while (options.size < 4 && attempts < 60) {
    const magnitude = step * randInt(1, 8);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const candidate = Math.max(0, value + direction * magnitude);
    options.add(formatDecimal(candidate, decimals));
    attempts += 1;
  }
  return shuffle(Array.from(options));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

type FormulaMemoryCard = {
  id: string;
  name: string;
  formula: string;
  variableHint?: string;
  explanation: string;
  shortcut: string;
  distractors: string[];
};

const FORMULA_MEMORY_CARDS: FormulaMemoryCard[] = [
  {
    id: "growth-rate",
    name: "增长率",
    formula: "(现期-基期)/基期",
    variableHint: "现期为本期值，基期为上期值。",
    explanation: "增长率表示相对增长幅度。",
    shortcut: "差值除以基期。",
    distractors: ["(基期-现期)/基期", "(现期-基期)/现期", "现期/基期"]
  },
  {
    id: "current-period",
    name: "现期量",
    formula: "基期 × (1+r)",
    variableHint: "r 为增长率（小数形式）。",
    explanation: "已知基期和增速时可直接得到现期。",
    shortcut: "基期乘以 1+r。",
    distractors: ["基期 ÷ (1+r)", "现期 ÷ (1+r)", "基期 × (1-r)"]
  },
  {
    id: "base-period",
    name: "基期量",
    formula: "现期 ÷ (1+r)",
    variableHint: "r 为增长率（小数形式）。",
    explanation: "已知现期和增速时回推基期。",
    shortcut: "现期除以 1+r。",
    distractors: ["现期 × (1+r)", "基期 × (1+r)", "现期 ÷ (1-r)"]
  },
  {
    id: "growth-amount",
    name: "增长量",
    formula: "现期-基期 = 现期 × r/(1+r)",
    variableHint: "r 为增长率（小数形式）。",
    explanation: "增长量也可写作基期×r。",
    shortcut: "已知现期时常用现期×r/(1+r)。",
    distractors: [
      "现期-基期 = 现期 × r",
      "现期-基期 = 基期 × r/(1+r)",
      "增长量 = 基期-现期"
    ]
  },
  {
    id: "two-year-growth",
    name: "间隔增长率",
    formula: "r1 + r2 + r1×r2",
    variableHint: "r1、r2 分别为相邻两年的增长率（小数形式）。",
    explanation: "两期连乘展开后得到隔年增速。",
    shortcut: "先加再补交叉项。",
    distractors: ["r1 + r2 - r1×r2", "(r1 + r2)/2", "r1×r2"]
  },
  {
    id: "current-share",
    name: "现期比重",
    formula: "A/B",
    variableHint: "A 为部分量，B 为总体量。",
    explanation: "部分占总体的份额。",
    shortcut: "部分除以总体。",
    distractors: ["B/A", "A/(A+B)", "(A-B)/B"]
  },
  {
    id: "base-share",
    name: "基期比重",
    formula: "(A/B) × ((1+b)/(1+a))",
    variableHint: "A、B 为现期部分/总体量，a、b 为对应增速。",
    explanation: "基期比重由现期比重乘修正系数得到。",
    shortcut: "先算 A/B，再乘 (1+b)/(1+a)。",
    distractors: [
      "(A/B) × ((1+a)/(1+b))",
      "(B/A) × ((1+b)/(1+a))",
      "(A/B) × ((a-b)/(1+a))"
    ]
  },
  {
    id: "two-period-share-gap",
    name: "比重差",
    formula: "(A/B) × ((a-b)/(1+a))",
    variableHint: "A、B 为现期部分/总体量，a、b 为对应增速。",
    explanation: "常用于求“比重上升/下降多少个百分点”。",
    shortcut: "先看 a-b 判断正负，再算大小。",
    distractors: [
      "(A/B) × ((b-a)/(1+b))",
      "(A/B) × ((a-b)/(1+b))",
      "(B/A) × ((a-b)/(1+a))"
    ]
  },
  {
    id: "base-multiple",
    name: "基期倍数",
    formula: "现期倍数 × ((1+b)/(1+a))",
    variableHint: "a、b 为分子和分母对应增速。",
    explanation: "基期倍数由现期倍数按增速差异修正。",
    shortcut: "现期倍数乘以 (1+b)/(1+a)。",
    distractors: [
      "现期倍数 × ((1+a)/(1+b))",
      "现期倍数 × ((a-b)/(1+a))",
      "现期倍数 ÷ ((1+b)/(1+a))"
    ]
  },
  {
    id: "avg-growth-precise",
    name: "年均增长率（精确）",
    formula: "(现期/基期)^(1/n)-1",
    variableHint: "n 为年数。",
    explanation: "即复合增长率（CAGR）公式。",
    shortcut: "先求倍数，再开 n 次方。",
    distractors: [
      "((现期-基期)/基期) ÷ n",
      "(现期/基期)-1/n",
      "(基期/现期)^(1/n)-1"
    ]
  },
  {
    id: "growth-contribution",
    name: "增长贡献率",
    formula: "部分增长量/整体增长量",
    variableHint: "分子分母都用“增长量”而不是“现期量”。",
    explanation: "用于比较各部分对总体增长的贡献。",
    shortcut: "谁的增长量占总体增长量更多。",
    distractors: ["部分现期量/整体现期量", "部分基期量/整体基期量", "整体增长量/部分增长量"]
  },
  {
    id: "growth-multiple",
    name: "增长倍数",
    formula: "现期/基期 = 1+r",
    variableHint: "r 为增长率（小数形式）。",
    explanation: "增长倍数常用于多期连乘。",
    shortcut: "先转成 1+r 再连乘。",
    distractors: ["基期/现期 = 1+r", "现期/基期 = r", "1+r = 基期/现期"]
  },
  {
    id: "decline-rate",
    name: "下降率",
    formula: "(基期-现期)/基期",
    variableHint: "当现期小于基期时使用。",
    explanation: "下降率是相对减少幅度。",
    shortcut: "减少量除以基期。",
    distractors: ["(现期-基期)/基期", "(基期-现期)/现期", "(现期-基期)/现期"]
  },
  {
    id: "average",
    name: "平均数",
    formula: "总量/总份数",
    variableHint: "典型如人均、单价、客单价。",
    explanation: "平均数是总量除以数量。",
    shortcut: "总量 ÷ 份数。",
    distractors: ["总份数/总量", "(总量-总份数)/总份数", "总量/(总量+总份数)"]
  },
  {
    id: "average-growth",
    name: "平均数变化",
    formula: "(1+a)/(1+b)-1",
    variableHint: "a 为总量增速，b 为份数增速。",
    explanation: "平均数=总量/份数，增长率需做比值修正。",
    shortcut: "先比 1+a 与 1+b，再减 1。",
    distractors: ["(1+a)/(1+b)", "(1+b)/(1+a)-1", "(a-b)/(1+a)"]
  },
  {
    id: "average-base",
    name: "基期平均数",
    formula: "现期平均数 ÷ (1+r)",
    variableHint: "r 为平均数增长率（小数形式）。",
    explanation: "平均数也遵循现期/基期换算。",
    shortcut: "现期平均数除以 1+r。",
    distractors: ["现期平均数 × (1+r)", "现期平均数 ÷ (1-r)", "基期平均数 × (1+r)"]
  },
  {
    id: "growth-diff",
    name: "同比增速差",
    formula: "a-b",
    variableHint: "a、b 分别为两个对象的同比增速。",
    explanation: "用于快速比较谁更快以及快多少。",
    shortcut: "直接相减看正负。",
    distractors: ["b-a", "a+b", "a/b"]
  },
  {
    id: "growth-pull",
    name: "增长贡献值（拉动）",
    formula: "部分增长量/总体基期量",
    variableHint: "结果常写为百分点。",
    explanation: "衡量某部分对总体增速的拉动。",
    shortcut: "分子用部分增量，分母用总体基期。",
    distractors: ["部分增长量/整体增长量", "部分现期量/整体现期量", "总体增长量/部分基期量"]
  },
  {
    id: "share-change-rate",
    name: "比重变化率",
    formula: "(a-b)/(1+b)",
    variableHint: "a、b 为部分与总体增速（小数形式）。",
    explanation: "常用于快速判断比重变化幅度。",
    shortcut: "先算 a-b，再除 1+b。",
    distractors: ["(a-b)/(1+a)", "(b-a)/(1+b)", "(a+b)/(1+b)"]
  },
  {
    id: "multiple-ratio",
    name: "倍数对比修正系数",
    formula: "(1+a)/(1+b)",
    variableHint: "a、b 为分子分母对应增速。",
    explanation: "用于现期倍数与基期倍数之间换算。",
    shortcut: "谁在分子谁放上面。",
    distractors: ["(1+b)/(1+a)", "(a-b)/(1+a)", "(a+b)/(1+b)"]
  },
  {
    id: "avg-growth-approx",
    name: "年均增长率（近似）",
    formula: "((现期/基期)-1)/n",
    variableHint: "n 为年数，适用于小增速近似。",
    explanation: "把复合增长近似为线性增长。",
    shortcut: "总增幅除以年数。",
    distractors: ["(现期/基期)^(1/n)-1", "(现期/基期)-1/n", "((基期/现期)-1)/n"]
  },
  {
    id: "mix-growth-rate",
    name: "混合增长率",
    formula: "r = w1×r1 + w2×r2 (w1+w2=1)",
    variableHint: "w1、w2 为权重，r1、r2 为各部分增速。",
    explanation: "总体增速是分项增速的加权平均。",
    shortcut: "总增速介于各分项增速之间。",
    distractors: [
      "r = r1 + r2",
      "r = w1×r1 - w2×r2",
      "r = (r1+r2)/2"
    ]
  },
  {
    id: "two-period-share",
    name: "两期比重",
    formula: "基期比重 = 现期比重 × ((1+b)/(1+a))",
    variableHint: "a、b 为部分与总体增速（小数形式）。",
    explanation: "两期比重换算本质是现期比重乘修正系数。",
    shortcut: "先算现期比重，再乘 (1+b)/(1+a)。",
    distractors: [
      "基期比重 = 现期比重 × ((1+a)/(1+b))",
      "基期比重 = 现期比重 × ((a-b)/(1+a))",
      "基期比重 = 现期比重 ÷ ((1+b)/(1+a))"
    ]
  }
];

const NAME_TO_FORMULA_PROMPT_TEMPLATES = [
  "{name}的公式是哪个？{hint}",
  "下列哪个是{name}的标准公式？{hint}",
  "若要求{name}，应优先使用哪一个式子？{hint}",
  "关于{name}，正确公式是？{hint}"
];

const FORMULA_TO_NAME_PROMPT_TEMPLATES = [
  "公式 {formula} 对应哪个资料分析公式？{hint}",
  "看到公式 {formula}，应判定为哪个公式名称？{hint}",
  "下列给出的公式是 {formula}，它属于哪一类公式？{hint}",
  "公式识别：{formula} 是什么公式？{hint}"
];

type FormulaVariant = {
  cardIndex: number;
  askNameToFormula: boolean;
  templateIndex: number;
};

function createFormulaPrompt(
  card: FormulaMemoryCard,
  askNameToFormula: boolean,
  templateIndex: number
) {
  const hintText = card.variableHint ? `（${card.variableHint}）` : "";
  const templates = askNameToFormula
    ? NAME_TO_FORMULA_PROMPT_TEMPLATES
    : FORMULA_TO_NAME_PROMPT_TEMPLATES;
  const pickedTemplate = templates[templateIndex] ?? templates[0];
  return pickedTemplate
    .replaceAll("{name}", card.name)
    .replaceAll("{formula}", card.formula)
    .replaceAll("{hint}", hintText)
    .replace(/\s+$/, "");
}

function generateFormulaMemoryByVariant(
  card: FormulaMemoryCard,
  askNameToFormula: boolean,
  templateIndex: number
): QuickPracticeQuestion {
  if (askNameToFormula) {
    const formulaPool = [
      ...card.distractors,
      ...FORMULA_MEMORY_CARDS.filter((item) => item.id !== card.id).map(
        (item) => item.formula
      )
    ];
    return {
      id: makeId("formula-memory"),
      categoryId: "formula-memory",
      prompt: createFormulaPrompt(card, true, templateIndex),
      answer: card.formula,
      choices: buildChoices(card.formula, formulaPool),
      explanation: `${card.name}：${card.explanation} 标准写法为 ${card.formula}。`,
      shortcut: card.shortcut
    };
  }

  const namePool = FORMULA_MEMORY_CARDS.filter((item) => item.id !== card.id).map(
    (item) => item.name
  );
  return {
    id: makeId("formula-memory"),
    categoryId: "formula-memory",
    prompt: createFormulaPrompt(card, false, templateIndex),
    answer: card.name,
    choices: buildChoices(card.name, namePool),
    explanation: `该公式对应“${card.name}”。${card.explanation}`,
    shortcut: card.shortcut
  };
}

function buildFormulaVariants() {
  const variants: FormulaVariant[] = [];
  FORMULA_MEMORY_CARDS.forEach((_, cardIndex) => {
    NAME_TO_FORMULA_PROMPT_TEMPLATES.forEach((__, templateIndex) => {
      variants.push({
        cardIndex,
        askNameToFormula: true,
        templateIndex
      });
    });
    FORMULA_TO_NAME_PROMPT_TEMPLATES.forEach((__, templateIndex) => {
      variants.push({
        cardIndex,
        askNameToFormula: false,
        templateIndex
      });
    });
  });
  return variants;
}

function generateFormulaMemory(): QuickPracticeQuestion {
  const cardIndex = randInt(0, FORMULA_MEMORY_CARDS.length - 1);
  const askNameToFormula = Math.random() > 0.5;
  const templates = askNameToFormula
    ? NAME_TO_FORMULA_PROMPT_TEMPLATES
    : FORMULA_TO_NAME_PROMPT_TEMPLATES;
  const templateIndex = randInt(0, templates.length - 1);
  return generateFormulaMemoryByVariant(
    FORMULA_MEMORY_CARDS[cardIndex],
    askNameToFormula,
    templateIndex
  );
}

function generateFormulaMemoryBatch(count: number) {
  const variants = shuffle(buildFormulaVariants());
  const questions: QuickPracticeQuestion[] = [];
  for (let i = 0; i < count; i += 1) {
    const variant = variants[i % variants.length];
    const card = FORMULA_MEMORY_CARDS[variant.cardIndex];
    questions.push(
      generateFormulaMemoryByVariant(
        card,
        variant.askNameToFormula,
        variant.templateIndex
      )
    );
  }
  return questions;
}

function generateBasicAddTwo(): QuickPracticeQuestion {
  const a = randInt(12, 98);
  const b = randInt(11, 89);
  const isAdd = Math.random() > 0.4;
  const left = isAdd ? a : Math.max(a, b);
  const right = isAdd ? b : Math.min(a, b);
  const answerValue = isAdd ? left + right : left - right;
  const op = isAdd ? "+" : "-";
  return {
    id: makeId("basic-add2"),
    categoryId: "basic-add-2",
    prompt: `计算 ${left} ${op} ${right}。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 3),
    explanation: "拆分十位与个位，先凑整再回补。",
    shortcut: "先凑整再回补。"
  };
}

function generateBasicAddThree(): QuickPracticeQuestion {
  const a = randInt(120, 980);
  const b = randInt(110, 890);
  const isAdd = Math.random() > 0.4;
  const left = isAdd ? a : Math.max(a, b);
  const right = isAdd ? b : Math.min(a, b);
  const answerValue = isAdd ? left + right : left - right;
  const op = isAdd ? "+" : "-";
  return {
    id: makeId("basic-add3"),
    categoryId: "basic-add-3",
    prompt: `计算 ${left} ${op} ${right}。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 10),
    explanation: "先算百位，再补十位与个位。",
    shortcut: "百位先行，十位个位分拆。"
  };
}

function generateBasicSum(): QuickPracticeQuestion {
  const count = randInt(3, 4);
  const numbers = Array.from({ length: count }, () => randInt(12, 88));
  const answerValue = numbers.reduce((sum, item) => sum + item, 0);
  return {
    id: makeId("basic-sum"),
    categoryId: "basic-sum",
    prompt: `计算 ${numbers.join(" + ")}。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 5),
    explanation: "分组凑整，先凑整再回补。",
    shortcut: "分组凑整，先整后补。"
  };
}

function generateBasicMixed(): QuickPracticeQuestion {
  const base = randInt(200, 650);
  const terms: number[] = [base];
  let total = base;
  for (let i = 0; i < 3; i += 1) {
    const value = randInt(10, 90);
    let signed = Math.random() > 0.5 ? value : -value;
    if (total + signed < 20) {
      signed = value;
    }
    total += signed;
    terms.push(signed);
  }
  const expression = terms
    .map((term, index) => {
      if (index === 0) {
        return String(term);
      }
      return term >= 0 ? `+ ${term}` : `- ${Math.abs(term)}`;
    })
    .join(" ");
  return {
    id: makeId("basic-mixed"),
    categoryId: "basic-mixed",
    prompt: `计算 ${expression}。`,
    answer: String(total),
    choices: buildNumberChoices(total, 0, 6),
    explanation: "先把加法合并，再处理减法。",
    shortcut: "先合并加法，再处理减法。"
  };
}

function generateBasicMulTwoByOne(): QuickPracticeQuestion {
  const a = randInt(12, 99);
  const b = randInt(2, 9);
  const answerValue = a * b;
  return {
    id: makeId("basic-mul2x1"),
    categoryId: "basic-mul-2x1",
    prompt: `计算 ${a} × ${b}。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 5),
    explanation: "拆成整十与个位分别相乘再相加。",
    shortcut: "拆十位与个位分别相乘。"
  };
}

function generateBasicMulThreeByOne(): QuickPracticeQuestion {
  const a = randInt(120, 980);
  const b = randInt(2, 9);
  const answerValue = a * b;
  return {
    id: makeId("basic-mul3x1"),
    categoryId: "basic-mul-3x1",
    prompt: `计算 ${a} × ${b}。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 20),
    explanation: "拆成百位与十位分步相乘。",
    shortcut: "百位先行，十位个位分拆。"
  };
}

function generateBasicMulEleven(): QuickPracticeQuestion {
  const n = randInt(11, 98);
  const answerValue = n * 11;
  return {
    id: makeId("basic-mul11"),
    categoryId: "basic-mul-11",
    prompt: `计算 ${n} × 11。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 6),
    explanation: "首尾相加夹在中间。",
    shortcut: "首尾相加夹中间。"
  };
}

function generateBasicMulFifteen(): QuickPracticeQuestion {
  const n = randInt(12, 98);
  const answerValue = n * 15;
  return {
    id: makeId("basic-mul15"),
    categoryId: "basic-mul-15",
    prompt: `计算 ${n} × 15。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 8),
    explanation: "乘以 10 再加一半。",
    shortcut: "×15 = ×10 + ×5。"
  };
}

function generateBasicSquare(): QuickPracticeQuestion {
  const n = randInt(11, 30);
  const answerValue = n * n;
  return {
    id: makeId("basic-square"),
    categoryId: "basic-square",
    prompt: `计算 ${n}²。`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, 10),
    explanation: "使用平方拆分或记忆表。",
    shortcut: "用 (n±1)² 快速记忆。"
  };
}

function generateBasicDivision(): QuickPracticeQuestion {
  const useTwoDigit = Math.random() > 0.45;
  let divisor = useTwoDigit ? randInt(11, 29) : randInt(2, 9);
  let quotient = useTwoDigit ? randInt(10, 30) : randInt(12, 99);
  let dividend = divisor * quotient;
  let guard = 0;
  while ((dividend < 100 || dividend > 999) && guard < 20) {
    divisor = useTwoDigit ? randInt(11, 29) : randInt(2, 9);
    quotient = useTwoDigit ? randInt(10, 30) : randInt(12, 99);
    dividend = divisor * quotient;
    guard += 1;
  }
  return {
    id: makeId("basic-div"),
    categoryId: "basic-div",
    prompt: `计算 ${dividend} ÷ ${divisor}。`,
    answer: String(quotient),
    choices: buildNumberChoices(quotient, 0, 2),
    explanation: "先约分再整除。",
    shortcut: "先约分，再整除。"
  };
}

function generatePercentPrecision(): QuickPracticeQuestion {
  const toDecimal = Math.random() > 0.5;
  if (toDecimal) {
    const percent = randInt(21, 98) + randInt(0, 9) / 10;
    const decimal = percent / 100;
    return {
      id: makeId("percent-prec"),
      categoryId: "percent-precision",
      prompt: `把 ${percent.toFixed(1)}% 转化为小数。`,
      answer: formatDecimal(decimal, 3),
      choices: buildDecimalChoices(decimal, 3),
      explanation: "百分数除以 100。",
      shortcut: "百分数 ÷ 100。"
    };
  }
  const decimal = randInt(12, 980) / 1000;
  const percent = decimal * 100;
  return {
    id: makeId("percent-prec"),
    categoryId: "percent-precision",
    prompt: `把 ${formatDecimal(decimal, 3)} 转化为百分数。`,
    answer: `${percent.toFixed(1)}%`,
    choices: buildPercentChoices(percent, 1),
    explanation: "小数乘以 100 加上 %。",
    shortcut: "小数 × 100。"
  };
}

function generateBasePeriod(): QuickPracticeQuestion {
  const current = randInt(1200, 9800);
  const ratePercent = randInt(50, 260) / 10;
  const base = Math.round(current / (1 + ratePercent / 100));
  const step = Math.max(5, Math.round(base * 0.05));
  return {
    id: makeId("base"),
    categoryId: "base-period",
    prompt: `现期为 ${current}，增长率 ${ratePercent.toFixed(1)}%，基期约为多少？`,
    answer: String(base),
    choices: buildNumberChoices(base, 0, step),
    explanation: "基期 ≈ 现期 ÷ (1 + r)。",
    shortcut: "现期除以 1+r。"
  };
}

function generateTruncDivision(digits: 2 | 3): QuickPracticeQuestion {
  let numerator = randInt(1200, 9500);
  let denominator = randInt(1800, 12000);
  let percent = (numerator / denominator) * 100;
  let guard = 0;
  while ((percent < 5 || percent > 95) && guard < 30) {
    numerator = randInt(1200, 9500);
    denominator = randInt(1800, 12000);
    percent = (numerator / denominator) * 100;
    guard += 1;
  }
  const answer = formatPercent(percent, 1);
  return {
    id: makeId(`trunc-${digits}`),
    categoryId: digits === 2 ? "trunc-division-2" : "trunc-division-3",
    prompt: `用左${digits}位截位估算 ${numerator} ÷ ${denominator} 约为多少%？`,
    answer,
    choices: buildPercentChoices(percent, 1),
    explanation: "截位后直除，再按选项微调。",
    shortcut: digits === 2 ? "分母取前两位直除。" : "分母取前三位直除。"
  };
}

function generateTruncDivisionTwo(): QuickPracticeQuestion {
  return generateTruncDivision(2);
}

function generateTruncDivisionThree(): QuickPracticeQuestion {
  return generateTruncDivision(3);
}

function splitPercent(ratePercent: number) {
  const parts: string[] = [];
  const tens = Math.floor(ratePercent / 10) * 10;
  const ones = Math.floor(ratePercent % 10);
  const decimal = Math.round((ratePercent - Math.floor(ratePercent)) * 10) / 10;
  if (tens) {
    parts.push(`${tens}%`);
  }
  if (ones) {
    parts.push(`${ones}%`);
  }
  if (decimal > 0) {
    parts.push(`${decimal.toFixed(1)}%`);
  }
  if (!parts.length) {
    parts.push(`${ratePercent.toFixed(1)}%`);
  }
  return parts.join(" + ");
}

function generateSplitMultiply(): QuickPracticeQuestion {
  const base = randInt(80, 400) * 10;
  const ratePercent = randInt(52, 248) / 10;
  const result = Math.round(base * (1 + ratePercent / 100));
  const step = Math.max(5, Math.round(base * 0.03));
  return {
    id: makeId("split"),
    categoryId: "split-multiply",
    prompt: `计算 ${base} × (1 + ${ratePercent.toFixed(1)}%)。`,
    answer: String(result),
    choices: buildNumberChoices(result, 0, step),
    explanation: `把 ${ratePercent.toFixed(1)}% 拆分后叠加。`,
    shortcut: `拆成 ${splitPercent(ratePercent)} 叠加。`
  };
}

function generateGrowthNPlusOne(): QuickPracticeQuestion {
  const n = randInt(2, 9);
  const base = randInt(120, 560);
  const current = base * (n + 1);
  const answerValue = base;
  return {
    id: makeId("nplus1"),
    categoryId: "growth-nplus1",
    prompt: `现值为 ${current}，增长率 r = 1/${n}，增长量约为多少？`,
    answer: String(answerValue),
    choices: buildNumberChoices(answerValue, 0, Math.max(5, Math.round(answerValue * 0.08))),
    explanation: "增长量 ≈ 现值 ÷ (n + 1)。",
    shortcut: "A/(n+1) 快算。"
  };
}

function generateGrowthTwoYear(): QuickPracticeQuestion {
  const r1 = randInt(30, 150) / 10;
  const r2 = randInt(30, 180) / 10;
  const total = (1 + r1 / 100) * (1 + r2 / 100) - 1;
  const percent = total * 100;
  return {
    id: makeId("two-year"),
    categoryId: "growth-two-year",
    prompt: `两年增长率分别为 ${r1.toFixed(1)}% 与 ${r2.toFixed(1)}%，隔年增长率约为多少？`,
    answer: formatPercent(percent, 1),
    choices: buildPercentChoices(percent, 1),
    explanation: "r1 + r2 + r1×r2。",
    shortcut: "r1+r2+r1×r2。"
  };
}

function generateGrowthMixWeight(): QuickPracticeQuestion {
  let rHigh = randInt(120, 280) / 10;
  let rLow = randInt(20, 120) / 10;
  if (rLow >= rHigh) {
    rLow = Math.max(2, rHigh - 2);
  }
  const weight =
    Math.random() > 0.5 ? randInt(60, 80) / 100 : randInt(20, 40) / 100;
  const total = weight * rHigh + (1 - weight) * rLow;
  const choices = shuffle([
    "A 权重更大",
    "B 权重更大",
    "权重接近",
    "无法判断"
  ]);
  const answer = weight > 0.5 ? "A 权重更大" : "B 权重更大";
  return {
    id: makeId("mix-weight"),
    categoryId: "growth-mix-weight",
    prompt: `部分 A 增长率 ${rHigh.toFixed(1)}%，部分 B 增长率 ${rLow.toFixed(1)}%，总增长率约 ${total.toFixed(1)}%。判断哪部分权重更大？`,
    answer,
    choices,
    explanation: "总增速是权重加权平均。",
    shortcut: "总增速靠近谁，谁权重更大。"
  };
}

function generateGrowthAverageApprox(): QuickPracticeQuestion {
  const r = randInt(20, 90) / 10;
  const years = randInt(2, 6);
  const total = r * years;
  return {
    id: makeId("avg-growth"),
    categoryId: "growth-average-approx",
    prompt: `年均增长率约 ${r.toFixed(1)}%，连续 ${years} 年总增长率约为多少？`,
    answer: formatPercent(total, 1),
    choices: buildPercentChoices(total, 1),
    explanation: "(1+r)^n ≈ 1 + nr。",
    shortcut: "小 r 用 1+nr。"
  };
}

function generateRatioChange(): QuickPracticeQuestion {
  const total = randInt(20000, 80000);
  const ratio = randInt(20, 60) / 100;
  const part = Math.round(total * ratio);
  let partGrowth = randInt(80, 250) / 10;
  let totalGrowth = randInt(20, 120) / 10;
  if (partGrowth <= totalGrowth) {
    [partGrowth, totalGrowth] = [totalGrowth + 6, partGrowth];
  }
  const a = partGrowth / 100;
  const b = totalGrowth / 100;
  const change = (part / total) * (a - b) / (1 + a);
  const percent = change * 100;
  return {
    id: makeId("ratio-change"),
    categoryId: "ratio-change",
    prompt: `已知部分 A=${part}，总量 B=${total}，部分增长率 ${partGrowth.toFixed(1)}%，总体增长率 ${totalGrowth.toFixed(1)}%，比重变化约为多少个百分点？`,
    answer: formatPercent(percent, 1),
    choices: buildPercentChoices(percent, 1),
    explanation: "A/B × (a-b)/(1+a)。",
    shortcut: "基期比重 × (a-b)/(1+a)。"
  };
}

function generateRatioCompare(): QuickPracticeQuestion {
  let a = randInt(50, 250) / 10;
  let b = randInt(50, 250) / 10;
  while (Math.abs(a - b) < 0.5) {
    b = randInt(50, 250) / 10;
  }
  const answer = b > a ? "基期倍数更大" : "现期倍数更大";
  const choices = shuffle(["现期倍数更大", "基期倍数更大", "两者相同", "无法判断"]);
  return {
    id: makeId("ratio-compare"),
    categoryId: "ratio-compare",
    prompt: `现期倍数为 A/B，若 A 增长率 ${a.toFixed(1)}%，B 增长率 ${b.toFixed(1)}%，基期倍数与现期倍数相比如何？`,
    answer,
    choices,
    explanation: "基期倍数 = 现期倍数 × (1+b)/(1+a)。",
    shortcut: "看 b 与 a 的大小。"
  };
}

function generateTailDigit(): QuickPracticeQuestion {
  let a = randInt(12, 98);
  let b = randInt(12, 98);
  let c = randInt(3, 29);
  let d = randInt(2, 9);
  let e = randInt(11, 99);
  let result = a + b - c + d * e;
  let guard = 0;
  while (result < 0 && guard < 10) {
    a = randInt(12, 98);
    b = randInt(12, 98);
    c = randInt(3, 29);
    d = randInt(2, 9);
    e = randInt(11, 99);
    result = a + b - c + d * e;
    guard += 1;
  }
  const lastDigit =
    ((a % 10) + (b % 10) - (c % 10) + (d % 10) * (e % 10)) % 10;
  const normalized = ((lastDigit % 10) + 10) % 10;
  const answer = String(normalized);
  const choices = buildChoices(
    answer,
    Array.from({ length: 10 }, (_, index) => String(index))
  );
  return {
    id: makeId("tail"),
    categoryId: "tail-digit",
    prompt: `判断 ${a} + ${b} - ${c} + ${d} × ${e} 的尾数。`,
    answer,
    choices,
    explanation: `取末位：${a % 10}+${b % 10}-${c % 10}+${d % 10}×${e % 10}，尾数为 ${answer}。`,
    shortcut: "只看末位，按加减乘运算。"
  };
}

function generatePercentDecimal(): QuickPracticeQuestion {
  const denom = randInt(1, 20);
  const fraction = `1/${denom}`;
  const percentText = formatPercent((1 / denom) * 100, 1);
  const toPercent = Math.random() > 0.5;

  if (toPercent) {
    return {
      id: makeId("fraction-percent"),
      categoryId: "percent-decimal",
      prompt: `把 ${fraction} 转化为百分数。`,
      answer: percentText,
      choices: buildChoices(percentText, PERCENT_POOL),
      explanation: "分数乘以 100 得到百分数。",
      shortcut: "分数 × 100%。"
    };
  }

  return {
    id: makeId("percent-fraction"),
    categoryId: "percent-decimal",
    prompt: `把 ${percentText} 转化为分数。`,
    answer: fraction,
    choices: buildChoices(fraction, FRACTION_POOL),
    explanation: "百分数 ÷ 100 再化为分数。",
    shortcut: "百分数 ÷ 100。"
  };
}

function generateGrowthRate(): QuickPracticeQuestion {
  const base = randInt(8000, 90000);
  const rate = randInt(5, 30) / 100;
  const current = Math.round(base * (1 + rate));
  const percent = Math.round(((current - base) / base) * 1000) / 10;
  const answer = formatPercent(percent, 1);
  return {
    id: makeId("growth"),
    categoryId: "growth-rate",
    prompt: `某指标由 ${base} 增至 ${current}，增长率约为多少？`,
    answer,
    choices: buildPercentChoices(percent, 1),
    explanation: `增长率 = (现期 - 基期) / 基期 ≈ ${answer}。`,
    shortcut: "差值 / 基期。"
  };
}

function generateProportion(): QuickPracticeQuestion {
  const total = randInt(20000, 160000);
  const part = randInt(2000, Math.floor(total * 0.7));
  const percent = Math.round((part / total) * 1000) / 10;
  const answer = formatPercent(percent, 1);
  return {
    id: makeId("proportion"),
    categoryId: "proportion",
    prompt: `某地区完成量为 ${part}，总量为 ${total}，比重约为多少？`,
    answer,
    choices: buildPercentChoices(percent, 1),
    explanation: `比重 ≈ ${part} / ${total} × 100% = ${answer}。`,
    shortcut: "截位直除估比重。"
  };
}

export function listQuickCategories() {
  return categories;
}

export function generateQuickQuestion(categoryId?: string) {
  if (categoryId && generators[categoryId]) {
    return generators[categoryId]();
  }
  const fallback = categories[randInt(0, categories.length - 1)];
  return generators[fallback.id]();
}

export function generateQuickBatch(categoryId: string | undefined, count: number) {
  const safeCount = Math.max(1, Math.min(50, Math.floor(count)));
  if (categoryId === "formula-memory") {
    return generateFormulaMemoryBatch(safeCount);
  }
  return Array.from({ length: safeCount }, () => generateQuickQuestion(categoryId));
}
