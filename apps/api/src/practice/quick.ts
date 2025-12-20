import type { QuickPracticeCategory, QuickPracticeQuestion } from "@gogov/shared";

const categories: QuickPracticeCategory[] = [
  {
    id: "tail-digit",
    name: "尾数判定",
    description: "通过末位数字快速判断乘积或和的尾数。"
  },
  {
    id: "percent-decimal",
    name: "百分数与小数互化",
    description: "1-20% 与 0.01-0.20 的快速互化。"
  },
  {
    id: "growth-rate",
    name: "增长率估算",
    description: "现期与基期大数快速估算增长率。"
  },
  {
    id: "proportion",
    name: "比重估算",
    description: "大数比重的截位直除与百分数估算。"
  }
];

const generators: Record<string, () => QuickPracticeQuestion> = {
  "tail-digit": generateTailDigit,
  "percent-decimal": generatePercentDecimal,
  "growth-rate": generateGrowthRate,
  proportion: generateProportion
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

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function generateTailDigit(): QuickPracticeQuestion {
  const a = randInt(120, 9876);
  const b = randInt(230, 8765);
  const last = (a % 10) * (b % 10);
  const answer = String(last % 10);
  const choices = buildChoices(
    answer,
    Array.from({ length: 10 }, (_, index) => String(index))
  );
  return {
    id: makeId("tail"),
    categoryId: "tail-digit",
    prompt: `判断 ${a} × ${b} 的尾数。`,
    answer,
    choices,
    explanation: `取末位：${a % 10} × ${b % 10} = ${last}，尾数为 ${answer}。`
  };
}

function generatePercentDecimal(): QuickPracticeQuestion {
  const n = randInt(1, 20);
  const toPercent = Math.random() > 0.5;
  if (toPercent) {
    const decimal = (n / 100).toFixed(2);
    const answer = `${n}%`;
    return {
      id: makeId("percent"),
      categoryId: "percent-decimal",
      prompt: `把 ${decimal} 转化为百分数。`,
      answer,
      choices: buildChoices(
        answer,
        Array.from({ length: 20 }, (_, index) => `${index + 1}%`)
      ),
      explanation: "小数乘以 100 加上 %。"
    };
  }

  const answer = (n / 100).toFixed(2);
  return {
    id: makeId("decimal"),
    categoryId: "percent-decimal",
    prompt: `把 ${n}% 转化为小数。`,
    answer,
    choices: buildChoices(
      answer,
      Array.from({ length: 20 }, (_, index) => ((index + 1) / 100).toFixed(2))
    ),
    explanation: "百分数除以 100 得到小数。"
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
    explanation: `增长率 = (现期 - 基期) / 基期 ≈ ${answer}。`
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
    explanation: `比重 ≈ ${part} / ${total} × 100% = ${answer}。`
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
  return Array.from({ length: safeCount }, () => generateQuickQuestion(categoryId));
}
