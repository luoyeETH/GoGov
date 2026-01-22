import "dotenv/config";
import { Prisma } from "@prisma/client";
import type { IncomingHttpHeaders } from "http";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { getAIProviderId, listAIProviders } from "./ai";
import { prisma } from "./db";
import { generateAssistAnswer } from "./ai/assist";
import { generateVisionAnswer } from "./ai/vision";
import { buildMockAnalysisPrompt } from "./ai/mock";
import { buildKnowledgePrompt } from "./ai/knowledge";
import { buildStudyPlanPrompt } from "./ai/study-plan";
import { buildDailyTaskPrompt, buildTaskBreakdownPrompt } from "./ai/study-plan-daily";
import { buildChatSystemPrompt, type ChatMode } from "./ai/chat";
import { buildKlinePrompt } from "./ai/kline";
import { buildExpenseParsePrompt } from "./ai/expense";
import { calculateBazi } from "./fortune/bazi";
import { createChallenge } from "./auth/challenge";
import {
  completeRegistration,
  loginWithPassword,
  requestEmailVerification,
  verifyEmailToken
} from "./auth/registration";
import { loginWithWallet } from "./auth/wallet";
import { createWalletChallenge, verifyWalletChallenge } from "./auth/wallet-challenge";
import { revokeSession, verifySession } from "./auth/session";
import { updateProfile } from "./auth/profile";
import { changePassword } from "./auth/password-change";
import { listModels } from "./ai/models";
import {
  generateQuickBatch,
  generateQuickQuestion,
  listQuickCategories
} from "./practice/quick";
import {
  checkComputerAnswer,
  checkComputerCTask,
  checkComputerSqlTask,
  getComputerCTaskById,
  getComputerOverview,
  getComputerQuestionById,
  getComputerSqlTaskById,
  getComputerTopic,
  getRandomComputerQuestion,
  listComputerQuestionPublic,
  listComputerSqlTasks,
  listComputerCTasks,
  listComputerTopics
} from "./practice/computer";

const server = Fastify({ logger: true, bodyLimit: 15 * 1024 * 1024 });
const port = Number(process.env.API_PORT ?? 3031);

server.register(cors, {
  origin: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
});
server.register(rateLimit, {
  max: 100,
  timeWindow: "15 minutes",
  allowList: (request) => request.method === "OPTIONS"
});

function getTokenFromRequest(request: { headers: IncomingHttpHeaders }) {
  const raw = request.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

type KlineReportRecord = {
  id: string;
  bazi: unknown | null;
  input: unknown | null;
  analysis: unknown | null;
  raw: string | null;
  model: string | null;
  warning: string | null;
  createdAt: Date;
};

type ChatMessageRecord = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  mode?: string;
};

// Prisma client needs regeneration after schema changes; keep delegate typed loosely here.
const klineReportDelegate = (prisma as unknown as { klineReport: any }).klineReport;
const pomodoroSessionDelegate = (prisma as unknown as { pomodoroSession: any }).pomodoroSession;
const pomodoroSubjectDelegate = (prisma as unknown as { pomodoroSubject: any }).pomodoroSubject;
const expenseLogDelegate = (prisma as unknown as { expenseLog: any }).expenseLog;
const aiChatMessageDelegate = (prisma as unknown as { aiChatMessage: any }).aiChatMessage;

const POMODORO_SUBJECTS = [
  "常识",
  "政治理论",
  "言语理解",
  "数量关系",
  "判断推理",
  "资料分析",
  "专业知识",
  "申论"
];
const POMODORO_PAUSE_LIMIT_SECONDS = 5 * 60;
const MAX_CUSTOM_POMODORO_SUBJECTS = 5;
const MAX_EXPENSE_TEXT_LENGTH = 200;
const MAX_EXPENSE_ITEM_LENGTH = 40;
const CHAT_HISTORY_DAYS = 30;
const CHAT_HISTORY_LIMIT = 100;
const CHAT_TUTOR_CONTEXT_HOURS = 3;
const MAX_CHAT_MESSAGE_LENGTH = 2000;

function extractJsonPayload(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function getChatCutoffDate() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CHAT_HISTORY_DAYS);
  return cutoff;
}

function getTutorContextCutoff() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - CHAT_TUTOR_CONTEXT_HOURS);
  return cutoff;
}

function normalizeChatMode(value?: string): ChatMode {
  return value === "tutor" ? "tutor" : "planner";
}

async function trimChatHistory(userId: string, mode?: ChatMode) {
  const cutoff = getChatCutoffDate();
  await aiChatMessageDelegate.deleteMany({
    where: {
      userId,
      createdAt: { lt: cutoff }
    }
  });
  const where = mode ? { userId, mode } : { userId };
  const total = await aiChatMessageDelegate.count({ where });
  if (total <= CHAT_HISTORY_LIMIT) {
    return;
  }
  const overflow = total - CHAT_HISTORY_LIMIT;
  const oldest = (await aiChatMessageDelegate.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: overflow,
    select: { id: true }
  })) as Array<{ id: string }>;
  if (!oldest.length) {
    return;
  }
  await aiChatMessageDelegate.deleteMany({
    where: { id: { in: oldest.map((item) => item.id) } }
  });
}

function formatChatRecord(record: ChatMessageRecord) {
  return {
    id: record.id,
    role: record.role,
    content: record.content,
    createdAt: record.createdAt.toISOString()
  };
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const date = new Date(
      trimmed.length <= 10 ? `${trimmed}T00:00:00+08:00` : trimmed
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  return null;
}

function parseOptionalNumber(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function pad2(value: number) {
  return `${value}`.padStart(2, "0");
}

function getMonthBucketLabel(dateLabel: string) {
  const year = Number(dateLabel.slice(0, 4));
  const month = Number(dateLabel.slice(5, 7));
  const day = Number(dateLabel.slice(8, 10));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12
  ) {
    return dateLabel;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day >= 26) {
    return `26-${pad2(daysInMonth)}`;
  }
  const startDay = Math.floor((day - 1) / 5) * 5 + 1;
  const endDay = Math.min(startDay + 4, 25);
  return `${pad2(startDay)}-${pad2(endDay)}`;
}

type NormalizedExpenseInput = {
  dateLabel: string;
  occurredAt: Date;
  item: string;
  amount: number;
  formatted: string;
};

function normalizeExpenseInput(
  value: unknown,
  fallbackDateLabel: string
): { entry: NormalizedExpenseInput | null; error: string | null } {
  if (!value || typeof value !== "object") {
    return { entry: null, error: "记录格式不正确" };
  }
  const record = value as Record<string, unknown>;
  const dateText = typeof record.date === "string" ? record.date.trim() : "";
  const dateValue =
    parseOptionalDate(dateText) ?? parseOptionalDate(fallbackDateLabel);
  if (!dateValue) {
    return { entry: null, error: "日期格式不正确" };
  }
  const item = typeof record.item === "string" ? record.item.trim() : "";
  if (!item) {
    return { entry: null, error: "缺少项目名称" };
  }
  if (item.length > MAX_EXPENSE_ITEM_LENGTH) {
    return { entry: null, error: "项目名称过长" };
  }
  const amountValue = parseOptionalNumber(record.amount);
  if (typeof amountValue !== "number" || !Number.isFinite(amountValue)) {
    return { entry: null, error: "金额格式不正确" };
  }
  if (amountValue <= 0) {
    return { entry: null, error: "金额必须大于 0" };
  }
  const amount = roundCurrency(amountValue);
  const dateLabel = getBeijingDateString(dateValue);
  const occurredAt = parseOptionalDate(dateLabel) ?? dateValue;
  return {
    entry: {
      dateLabel,
      occurredAt,
      item,
      amount,
      formatted: `${dateLabel}：${item}：${amount}`
    },
    error: null
  };
}

function getBeijingDateString(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  const year = beijing.getFullYear();
  const month = `${beijing.getMonth() + 1}`.padStart(2, "0");
  const day = `${beijing.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBeijingDateTimeString(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(beijing);
}

function getBeijingHour(date: Date) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  return beijing.getHours();
}

function getDayRange(dateValue?: string | null) {
  const date = parseOptionalDate(dateValue ?? null);
  const base = date ?? parseOptionalDate(getBeijingDateString()) ?? new Date();
  const start = base instanceof Date ? base : new Date();
  const end = new Date(start.getTime());
  end.setDate(start.getDate() + 1);
  return { start, end };
}

function getWeekRange(dateValue?: string | null) {
  const base = parseOptionalDate(dateValue ?? null) ?? new Date();
  const baseLabel = getBeijingDateString(base);
  const [year, month, day] = baseLabel.split("-").map((value) => Number(value));
  const baseUtc = Date.UTC(year, month - 1, day);
  const dayOfWeek = new Date(baseUtc).getUTCDay();
  const diff = (dayOfWeek + 6) % 7;
  const weekStartUtc = baseUtc - diff * 24 * 60 * 60 * 1000;
  const weekStartLabel = new Date(weekStartUtc).toISOString().slice(0, 10);
  const start = parseOptionalDate(weekStartLabel) ?? new Date(weekStartUtc);
  const labels: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    labels.push(
      new Date(weekStartUtc + i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    );
  }
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end, labels };
}

function getMonthRange(dateValue?: string | null) {
  const base = parseOptionalDate(dateValue ?? null) ?? new Date();
  const baseLabel = getBeijingDateString(base);
  const [year, month] = baseLabel.split("-").map((value) => Number(value));
  const monthLabel = `${month}`.padStart(2, "0");
  const startLabel = `${year}-${monthLabel}-01`;
  const start = parseOptionalDate(startLabel) ?? new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(start.getTime());
  end.setMonth(end.getMonth() + 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const labels: string[] = [];
  for (let i = 1; i <= daysInMonth; i += 1) {
    labels.push(`${year}-${monthLabel}-${`${i}`.padStart(2, "0")}`);
  }
  return { start, end, labels };
}

function getMonthBucketLabels(dateValue?: string | null) {
  const base = parseOptionalDate(dateValue ?? null) ?? new Date();
  const baseLabel = getBeijingDateString(base);
  const [year, month] = baseLabel.split("-").map((value) => Number(value));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [
    "01-05",
    "06-10",
    "11-15",
    "16-20",
    "21-25",
    `26-${pad2(daysInMonth)}`
  ];
}

function getYearRange(dateValue?: string | null) {
  const base = parseOptionalDate(dateValue ?? null) ?? new Date();
  const baseLabel = getBeijingDateString(base);
  const year = Number(baseLabel.slice(0, 4));
  const startLabel = `${year}-01-01`;
  const start = parseOptionalDate(startLabel) ?? new Date(Date.UTC(year, 0, 1));
  const end = new Date(start.getTime());
  end.setFullYear(end.getFullYear() + 1);
  const labels: string[] = [];
  for (let i = 1; i <= 12; i += 1) {
    labels.push(`${year}-${`${i}`.padStart(2, "0")}`);
  }
  return { start, end, labels };
}

type ResolvedAiConfig = {
  provider: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string | null;
  usingFree: boolean;
};

type FreeAiConfig = {
  provider: string;
  baseUrl?: string | null;
  apiKey: string;
  model: string;
  dailyLimit: number;
};

type FreeAiStatus = {
  enabled: boolean;
  usingFree: boolean;
  dailyLimit: number | null;
  usedToday: number | null;
  remaining: number | null;
};

function normalizeEnvValue(value?: string | null) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function extractKlineSummary(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      summary: "",
      landingYear: "",
      landingProbability: null as number | null
    };
  }
  const record = value as Record<string, unknown>;
  return {
    summary: typeof record.summary === "string" ? record.summary : "",
    landingYear: typeof record.landingYear === "string" ? record.landingYear : "",
    landingProbability:
      typeof record.landingProbability === "number" &&
      Number.isFinite(record.landingProbability)
        ? record.landingProbability
        : null
  };
}

const FREE_AI_DAILY_REQUEST_LIMIT = 600;
const FREE_AI_EXHAUSTED_MESSAGE =
  "网站今日上游免费额度已耗尽，等待明日刷新后重试，建议自行配置AI代理";
const AI_SERVICE_UNAVAILABLE_MESSAGE =
  "AI 服务繁忙或额度受限，请稍后再试，也可使用提示词自行测算。";
const freeAiConfig = loadFreeAiConfig();

function loadFreeAiConfig(): FreeAiConfig | null {
  const rawLimit = normalizeEnvValue(process.env.FREE_AI_DAILY_LIMIT);
  const explicit = buildFreeAiConfig({
    provider: process.env.FREE_AI_PROVIDER,
    apiKey: process.env.FREE_AI_API_KEY,
    model: process.env.FREE_AI_MODEL,
    baseUrl: process.env.FREE_AI_BASE_URL,
    limit: rawLimit
  });
  if (explicit) {
    return explicit;
  }
  const hasFreeSignal = [
    normalizeEnvValue(process.env.FREE_AI_PROVIDER),
    normalizeEnvValue(process.env.FREE_AI_API_KEY),
    normalizeEnvValue(process.env.FREE_AI_MODEL),
    normalizeEnvValue(process.env.FREE_AI_BASE_URL)
  ].some((value) => value.length > 0);
  if (hasFreeSignal) {
    return null;
  }
  return buildFreeAiConfig({
    provider: process.env.AI_PROVIDER,
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL,
    baseUrl: process.env.AI_BASE_URL,
    limit: rawLimit
  });
}

function buildFreeAiConfig(params: {
  provider?: string | null;
  apiKey?: string | null;
  model?: string | null;
  baseUrl?: string | null;
  limit?: string | null;
}): FreeAiConfig | null {
  const provider = normalizeEnvValue(params.provider).toLowerCase();
  const apiKey = normalizeEnvValue(params.apiKey);
  const model = normalizeEnvValue(params.model);
  const baseUrl = normalizeEnvValue(params.baseUrl);
  if (!provider || provider === "none" || !apiKey || !model) {
    return null;
  }
  const rawLimit = normalizeEnvValue(params.limit);
  const parsedLimit = Number.parseInt(rawLimit, 10);
  const dailyLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
  return {
    provider,
    apiKey,
    model,
    baseUrl: baseUrl || null,
    dailyLimit
  };
}

function resolveAiConfig(user: {
  aiProvider?: string | null;
  aiBaseUrl?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
}): ResolvedAiConfig {
  const apiKey = user.aiApiKey?.trim() ?? "";
  const model = user.aiModel?.trim() ?? "";
  const provider = (user.aiProvider?.trim() || "openai").toLowerCase();
  if (apiKey && model) {
    return {
      provider,
      baseUrl: user.aiBaseUrl ?? null,
      apiKey: user.aiApiKey,
      model: user.aiModel,
      usingFree: false
    };
  }
  if (freeAiConfig) {
    return {
      provider: freeAiConfig.provider,
      baseUrl: freeAiConfig.baseUrl ?? null,
      apiKey: freeAiConfig.apiKey,
      model: freeAiConfig.model,
      usingFree: true
    };
  }
  return {
    provider,
    baseUrl: user.aiBaseUrl ?? null,
    apiKey: user.aiApiKey ?? null,
    model: user.aiModel ?? null,
    usingFree: false
  };
}

async function consumeFreeAiUsage(userId: string, config: ResolvedAiConfig) {
  if (!config.usingFree || !freeAiConfig) {
    return;
  }
  const limit = freeAiConfig.dailyLimit;
  const { start } = getDayRange();
  try {
    await prisma.$transaction(async (tx) => {
      const globalUpdated = await tx.globalFreeAiUsage.updateMany({
        where: {
          date: start,
          count: { lt: FREE_AI_DAILY_REQUEST_LIMIT }
        },
        data: { count: { increment: 1 } }
      });
      if (globalUpdated.count !== 1) {
        const created = await tx.globalFreeAiUsage.createMany({
          data: [{ date: start, count: 1 }],
          skipDuplicates: true
        });
        if (created.count !== 1) {
          const retry = await tx.globalFreeAiUsage.updateMany({
            where: {
              date: start,
              count: { lt: FREE_AI_DAILY_REQUEST_LIMIT }
            },
            data: { count: { increment: 1 } }
          });
          if (retry.count !== 1) {
            throw new Error(FREE_AI_EXHAUSTED_MESSAGE);
          }
        }
      }
      const updated = await tx.freeAiUsage.updateMany({
        where: {
          userId,
          date: start,
          count: { lt: limit }
        },
        data: { count: { increment: 1 } }
      });
      if (updated.count === 1) {
        return;
      }
      const created = await tx.freeAiUsage.createMany({
        data: [{ userId, date: start, count: 1 }],
        skipDuplicates: true
      });
      if (created.count === 1) {
        return;
      }
      const retry = await tx.freeAiUsage.updateMany({
        where: {
          userId,
          date: start,
          count: { lt: limit }
        },
        data: { count: { increment: 1 } }
      });
      if (retry.count === 1) {
        return;
      }
      throw new Error("免费 AI 今日额度已用完，请在个人资料配置自己的 AI 继续使用。");
    });
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.trim();
      if (
        message === FREE_AI_EXHAUSTED_MESSAGE ||
        message.includes("免费 AI 今日额度已用完")
      ) {
        throw error;
      }
    }
    throw new Error(AI_SERVICE_UNAVAILABLE_MESSAGE);
  }
}

async function getFreeAiStatus(
  userId: string,
  config: ResolvedAiConfig
): Promise<FreeAiStatus> {
  if (!freeAiConfig) {
    return {
      enabled: false,
      usingFree: false,
      dailyLimit: null,
      usedToday: null,
      remaining: null
    };
  }
  const { start } = getDayRange();
  const record = await prisma.freeAiUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: start
      }
    }
  });
  const used = record?.count ?? 0;
  const remaining = Math.max(freeAiConfig.dailyLimit - used, 0);
  return {
    enabled: true,
    usingFree: config.usingFree,
    dailyLimit: freeAiConfig.dailyLimit,
    usedToday: used,
    remaining
  };
}

const KLINE_FREE_AI_CONCURRENCY_LIMIT = 3;
const KLINE_QUEUE_ESTIMATE_MINUTES = 2;
const KLINE_QUEUE_TTL_MS = 30 * 60 * 1000;

type NormalizedKlineInput = {
  bazi: string[];
  dayunSequence: string[];
  dayunStartAge: number | null;
  dayunDirection: string | null;
  trueSolarTime: string | null;
  lunarDate: string | null;
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  province: string | null;
  ziHourMode: string | null;
  education: string | null;
  schoolTier: string | null;
  prepTime: string | null;
  interviewCount: string | null;
  fenbiForecastXingce: string | null;
  fenbiForecastShenlun: string | null;
  historyScoreXingce: string | null;
  historyScoreShenlun: string | null;
  promptStyle: "default" | "gentle";
};

type KlineQueueStatus = "queued" | "processing" | "done" | "failed";

type KlineQueueResponse = {
  id?: string;
  createdAt?: string;
  analysis: unknown;
  raw?: string;
  model?: string;
  warning?: string | null;
};

type KlineQueueJob = {
  id: string;
  userId: string;
  status: KlineQueueStatus;
  createdAt: number;
  updatedAt: number;
  normalized: NormalizedKlineInput;
  aiConfig: ResolvedAiConfig;
  result?: KlineQueueResponse;
  error?: string;
};

const klineQueue: KlineQueueJob[] = [];
const klineJobs = new Map<string, KlineQueueJob>();
let klineActive = 0;

function getKlineQueuePosition(jobId: string) {
  const index = klineQueue.findIndex((job) => job.id === jobId);
  return index >= 0 ? index + 1 : 0;
}

function getKlineQueueEtaMinutes(position: number) {
  const normalized = position > 0 ? position : 1;
  return normalized * KLINE_QUEUE_ESTIMATE_MINUTES;
}

function scheduleKlineJobCleanup(jobId: string) {
  const timer = setTimeout(() => {
    klineJobs.delete(jobId);
  }, KLINE_QUEUE_TTL_MS);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

async function runKlineAnalysis(
  normalized: NormalizedKlineInput,
  userId: string,
  aiConfig: ResolvedAiConfig
): Promise<KlineQueueResponse> {
  const prompt = buildKlinePrompt(normalized);
  await consumeFreeAiUsage(userId, aiConfig);
  const result = await generateAssistAnswer({
    provider: aiConfig.provider,
    baseUrl: aiConfig.baseUrl,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user }
    ]
  });
  const parsed = extractJsonPayload(result.answer) as
    | {
        chartPoints?: Array<{ age?: number }>;
      }
    | null;
  if (!parsed || Array.isArray(parsed)) {
    return {
      analysis: null,
      raw: result.answer,
      model: result.model,
      warning: "AI 返回格式异常"
    };
  }
  const warningParts: string[] = [];
  const chartPoints = Array.isArray(parsed.chartPoints) ? parsed.chartPoints : [];
  if (chartPoints.length !== 18) {
    warningParts.push("chartPoints 长度不为 18");
  }
  const ageMismatch = chartPoints.some(
    (item, index) => typeof item.age !== "number" || item.age !== 23 + index
  );
  if (ageMismatch) {
    warningParts.push("age 未按 23-40 顺序递增");
  }
  const warning = warningParts.length ? warningParts.join("；") : null;
  const inputPayload = {
    birthDate: normalized.birthDate,
    birthTime: normalized.birthTime,
    gender: normalized.gender,
    province: normalized.province,
    ziHourMode: normalized.ziHourMode,
    education: normalized.education,
    schoolTier: normalized.schoolTier,
    prepTime: normalized.prepTime,
    interviewCount: normalized.interviewCount,
    fenbiForecastXingce: normalized.fenbiForecastXingce,
    fenbiForecastShenlun: normalized.fenbiForecastShenlun,
    historyScoreXingce: normalized.historyScoreXingce,
    historyScoreShenlun: normalized.historyScoreShenlun,
    promptStyle: normalized.promptStyle,
    dayunSequence: normalized.dayunSequence,
    dayunStartAge: normalized.dayunStartAge,
    dayunDirection: normalized.dayunDirection,
    trueSolarTime: normalized.trueSolarTime,
    lunarDate: normalized.lunarDate
  };
  const report = (await klineReportDelegate.create({
    data: {
      userId,
      bazi: normalized.bazi,
      input: inputPayload,
      analysis: parsed,
      raw: result.answer,
      model: result.model,
      warning
    }
  })) as KlineReportRecord;
  return {
    id: report.id,
    createdAt: report.createdAt.toISOString(),
    analysis: parsed,
    raw: result.answer,
    model: result.model,
    warning
  };
}

async function runKlineWithSlot(
  normalized: NormalizedKlineInput,
  userId: string,
  aiConfig: ResolvedAiConfig
) {
  klineActive += 1;
  try {
    return await runKlineAnalysis(normalized, userId, aiConfig);
  } finally {
    klineActive -= 1;
    processKlineQueue();
  }
}

function enqueueKlineJob(
  normalized: NormalizedKlineInput,
  userId: string,
  aiConfig: ResolvedAiConfig
) {
  const job: KlineQueueJob = {
    id: makeTaskId(),
    userId,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    normalized,
    aiConfig
  };
  klineQueue.push(job);
  klineJobs.set(job.id, job);
  return job;
}

function processKlineQueue() {
  while (
    klineActive < KLINE_FREE_AI_CONCURRENCY_LIMIT &&
    klineQueue.length > 0
  ) {
    const job = klineQueue.shift();
    if (!job || job.status !== "queued") {
      continue;
    }
    runQueuedKlineJob(job);
  }
}

async function runQueuedKlineJob(job: KlineQueueJob) {
  klineActive += 1;
  job.status = "processing";
  job.updatedAt = Date.now();
  try {
    job.result = await runKlineAnalysis(job.normalized, job.userId, job.aiConfig);
    job.status = "done";
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "测算失败，请稍后再试。";
  } finally {
    job.updatedAt = Date.now();
    klineActive -= 1;
    processKlineQueue();
    scheduleKlineJobCleanup(job.id);
  }
}

function ensureStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string");
}

function makeTaskId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

type DailyTaskRecord = {
  id?: string;
  title?: string;
  done?: boolean;
  durationMinutes?: number | null;
  notes?: string | null;
  subtasks?: Array<{
    id?: string;
    title?: string;
    done?: boolean;
  }>;
};

function normalizeDailyTasks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  const tasks: DailyTaskRecord[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title) {
      continue;
    }
    const duration =
      typeof record.durationMinutes === "number" && Number.isFinite(record.durationMinutes)
        ? Math.max(0, record.durationMinutes)
        : null;
    const notes = typeof record.notes === "string" ? record.notes.trim() : null;
    const subtasksInput = Array.isArray(record.subtasks) ? record.subtasks : [];
    const subtasks = subtasksInput
      .map((sub) => {
        if (typeof sub === "string") {
          const title = sub.trim();
          if (!title) {
            return null;
          }
          return { id: makeTaskId(), title, done: false };
        }
        if (!sub || typeof sub !== "object") {
          return null;
        }
        const subRecord = sub as Record<string, unknown>;
        const subTitle =
          typeof subRecord.title === "string" ? subRecord.title.trim() : "";
        if (!subTitle) {
          return null;
        }
        return {
          id:
            typeof subRecord.id === "string" && subRecord.id.trim()
              ? subRecord.id
              : makeTaskId(),
          title: subTitle,
          done: Boolean(subRecord.done)
        };
      })
      .filter(Boolean);
    tasks.push({
      id: typeof record.id === "string" && record.id.trim() ? record.id : makeTaskId(),
      title,
      done: Boolean(record.done),
      durationMinutes: duration,
      notes,
      subtasks: subtasks.length ? (subtasks as DailyTaskRecord["subtasks"]) : []
    });
  }
  return tasks;
}

function isDailyTaskCompleted(task: DailyTaskRecord) {
  if (task.done) {
    return true;
  }
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  return subtasks.length > 0 && subtasks.every((sub) => Boolean(sub?.done));
}

function formatWeeklyTaskLine(task: DailyTaskRecord) {
  const status = task.done ? "[x]" : "[ ]";
  const title = task.title ?? "";
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  if (!subtasks.length) {
    return `${status} ${title}`;
  }
  const doneCount = subtasks.filter((sub) => Boolean(sub?.done)).length;
  return `${status} ${title}（子任务 ${doneCount}/${subtasks.length}）`;
}

function formatRecentCompletedTasks(
  records: Array<{ date: Date; tasks: unknown }>
) {
  const lines: string[] = [];
  for (const record of records) {
    const dateLabel = getBeijingDateString(record.date);
    const tasks = normalizeDailyTasks(record.tasks);
    const completed = tasks.filter(isDailyTaskCompleted);
    if (!completed.length) {
      continue;
    }
    const titles = completed.map((task) => task.title ?? "").filter(Boolean);
    const preview = titles.slice(0, 5);
    const suffix = titles.length > preview.length ? ` 等${titles.length}项` : "";
    lines.push(`${dateLabel}：${preview.join("；")}${suffix}`);
  }
  return lines;
}

function formatWeeklyTaskProgress(
  records: Array<{ date: Date; tasks: unknown }>,
  labels: string[]
) {
  const byDate = new Map<string, DailyTaskRecord[]>();
  for (const record of records) {
    const label = getBeijingDateString(record.date);
    byDate.set(label, normalizeDailyTasks(record.tasks));
  }
  return labels.map((label) => {
    const tasks = byDate.get(label) ?? [];
    if (!tasks.length) {
      return `${label}：无任务记录`;
    }
    const done = tasks.filter((task) => task.done).length;
    const taskText = tasks.map(formatWeeklyTaskLine).join("；");
    return `${label}：完成 ${done}/${tasks.length}。${taskText}`;
  });
}

function normalizeOptionalText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

function hasOwn<T extends Record<string, unknown>>(obj: T, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

type MockMetric = {
  subject: string;
  correct: number | null;
  total: number | null;
  timeMinutes: number | null;
  accuracy: number | null;
};

function normalizeMockMetrics(value: unknown): MockMetric[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const results: MockMetric[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const subject =
      typeof record.subject === "string" ? record.subject.trim() : "";
    if (!subject) {
      continue;
    }
    const correct =
      typeof record.correct === "number" && Number.isFinite(record.correct)
        ? record.correct
        : typeof record.correct === "string" &&
          record.correct.trim().length &&
          Number.isFinite(Number(record.correct))
        ? Number(record.correct)
        : null;
    const total =
      typeof record.total === "number" && Number.isFinite(record.total)
        ? record.total
        : typeof record.total === "string" &&
          record.total.trim().length &&
          Number.isFinite(Number(record.total))
        ? Number(record.total)
        : null;
    const timeMinutes =
      typeof record.timeMinutes === "number" && Number.isFinite(record.timeMinutes)
        ? record.timeMinutes
        : typeof record.timeMinutes === "string" &&
          record.timeMinutes.trim().length &&
          Number.isFinite(Number(record.timeMinutes))
        ? Number(record.timeMinutes)
        : null;
    const accuracy =
      typeof record.accuracy === "number" && Number.isFinite(record.accuracy)
        ? Math.min(1, Math.max(0, record.accuracy))
        : typeof record.accuracy === "string" &&
          record.accuracy.trim().length &&
          Number.isFinite(Number(record.accuracy))
        ? Math.min(1, Math.max(0, Number(record.accuracy)))
        : correct !== null && total !== null && total > 0
        ? correct / total
        : null;
    results.push({ subject, correct, total, timeMinutes, accuracy });
  }
  return results;
}

function summarizeMockMetrics(metrics: MockMetric[]) {
  const totals = metrics.reduce(
    (acc, metric) => {
      if (typeof metric.correct === "number") {
        acc.correct += metric.correct;
      }
      if (typeof metric.total === "number") {
        acc.total += metric.total;
      }
      if (typeof metric.timeMinutes === "number") {
        acc.time += metric.timeMinutes;
      }
      return acc;
    },
    { correct: 0, total: 0, time: 0 }
  );
  const accuracy =
    totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) / 100 : null;
  return {
    accuracy,
    timeTotalMinutes: totals.time > 0 ? totals.time : null
  };
}

const knowledgeSources = new Set(["ocr", "document", "manual", "ai"]);

function normalizeKnowledgeTopics(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  const results: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    results.push(trimmed);
    if (results.length >= 24) {
      break;
    }
  }
  return results;
}

function normalizeKnowledgeSource(value?: string | null) {
  if (!value) {
    return "manual";
  }
  const normalized = value.trim().toLowerCase();
  if (knowledgeSources.has(normalized)) {
    return normalized;
  }
  return "manual";
}

function formatMistakeAnswer(value?: string | string[] | boolean) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("、");
  }
  if (typeof value === "boolean") {
    return value ? "正确" : "错误";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

function buildComputerPrompt(question: {
  stem: string;
  options?: string[];
}) {
  if (!question.options?.length) {
    return question.stem;
  }
  const options = question.options
    .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
    .join(" ");
  return `${question.stem}\n${options}`;
}

server.get("/health", async () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString()
  };
});

server.get("/ai/providers", async () => {
  return {
    current: getAIProviderId(),
    available: listAIProviders()
  };
});

server.get("/practice/quick/categories", async () => {
  return {
    categories: listQuickCategories()
  };
});

server.get("/practice/quick/next", async (request) => {
  const { category } = request.query as { category?: string };
  return generateQuickQuestion(category);
});

server.get("/practice/quick/batch", async (request) => {
  const { category, count } = request.query as {
    category?: string;
    count?: string;
  };
  const parsed = Number(count);
  const total = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  return {
    questions: generateQuickBatch(category, total)
  };
});

server.get("/practice/computer/overview", async () => {
  return getComputerOverview();
});

server.get("/practice/computer/topics", async () => {
  return { topics: listComputerTopics() };
});

server.get("/practice/computer/topics/:id", async (request, reply) => {
  const { id } = request.params as { id?: string };
  if (!id) {
    reply.code(400).send({ error: "缺少知识点 ID" });
    return;
  }
  const topic = getComputerTopic(id);
  if (!topic) {
    reply.code(404).send({ error: "未找到知识点" });
    return;
  }
  reply.send({ topic });
});

server.get("/practice/computer/questions", async (request) => {
  const { topicId, type, limit } = request.query as {
    topicId?: string;
    type?: string;
    limit?: string;
  };
  const allowedTypes = new Set(["single", "multi", "judge", "blank", "short"]);
  const normalizedType =
    typeof type === "string" && allowedTypes.has(type) ? (type as any) : undefined;
  const parsedLimit = Number(limit);
  const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : undefined;
  return {
    questions: listComputerQuestionPublic({
      topicId: topicId ?? undefined,
      type: normalizedType,
      limit: safeLimit
    })
  };
});

server.get("/practice/computer/next", async (request, reply) => {
  const { topicId, type } = request.query as { topicId?: string; type?: string };
  const allowedTypes = new Set(["single", "multi", "judge", "blank", "short"]);
  const normalizedType =
    typeof type === "string" && allowedTypes.has(type) ? (type as any) : undefined;
  const question = getRandomComputerQuestion({
    topicId: topicId ?? undefined,
    type: normalizedType
  });
  if (!question) {
    reply.code(404).send({ error: "暂无匹配题目" });
    return;
  }
  reply.send({ question });
});

server.post("/practice/computer/answer", async (request, reply) => {
  const body = request.body as {
    questionId?: string;
    userAnswer?: string | string[] | boolean;
  };
  if (!body?.questionId) {
    reply.code(400).send({ error: "缺少题目 ID" });
    return;
  }
  const result = checkComputerAnswer({
    questionId: body.questionId,
    userAnswer: body.userAnswer ?? ""
  });
  if ("error" in result) {
    reply.code(400).send({ error: result.error });
    return;
  }
  const token = getTokenFromRequest(request);
  const userAnswerText = formatMistakeAnswer(body.userAnswer);
  if (token && result.correct === false && userAnswerText) {
    try {
      const session = await verifySession(token);
      const question = getComputerQuestionById(body.questionId);
      if (question) {
        const prompt = buildComputerPrompt(question);
        await prisma.mistake.create({
          data: {
            userId: session.user.id,
            practiceType: "computer",
            categoryId: "computer",
            questionId: question.id,
            prompt,
            answer: result.answer,
            userAnswer: userAnswerText,
            explanation: result.analysis
          }
        });
      }
    } catch {
      // Ignore mistake recording failures for anonymous or invalid sessions.
    }
  }
  reply.send(result);
});

server.get("/practice/computer/c/tasks", async () => {
  return { tasks: listComputerCTasks() };
});

server.post("/practice/computer/c/check", async (request, reply) => {
  const body = request.body as {
    taskId?: string;
    answers?: Record<string, string>;
  };
  if (!body?.taskId) {
    reply.code(400).send({ error: "缺少题目 ID" });
    return;
  }
  const result = checkComputerCTask({
    taskId: body.taskId,
    answers: body.answers ?? {}
  });
  if ("error" in result) {
    reply.code(400).send({ error: result.error });
    return;
  }
  const token = getTokenFromRequest(request);
  if (token && result.correct === false) {
    try {
      const session = await verifySession(token);
      const task = getComputerCTaskById(body.taskId);
      if (task) {
        const prompt = [
          `C 语言填空：${task.title}`,
          task.template.replace(/{{(\d+)}}/g, "【空$1】")
        ].join("\n");
        const userAnswer = task.blanks
          .map((blank) => `空${blank.id}=${body.answers?.[blank.id] ?? ""}`)
          .join("；")
          .trim();
        if (userAnswer) {
          const answer = task.blanks
            .map((blank) => `空${blank.id}=${task.answers?.[blank.id]?.[0] ?? ""}`)
            .join("；");
          await prisma.mistake.create({
            data: {
              userId: session.user.id,
              practiceType: "computer",
              categoryId: "computer",
              questionId: `c-${task.id}`,
              prompt,
              answer,
              userAnswer,
              explanation: task.description
            }
          });
        }
      }
    } catch {
      // Ignore mistake recording failures for anonymous or invalid sessions.
    }
  }
  reply.send(result);
});

server.get("/practice/computer/sql/tasks", async () => {
  return { tasks: listComputerSqlTasks() };
});

server.post("/practice/computer/sql/check", async (request, reply) => {
  const body = request.body as { taskId?: string; query?: string };
  if (!body?.taskId) {
    reply.code(400).send({ error: "缺少题目 ID" });
    return;
  }
  const result = checkComputerSqlTask({
    taskId: body.taskId,
    query: body.query ?? ""
  });
  if ("error" in result) {
    reply.code(400).send({ error: result.error });
    return;
  }
  const token = getTokenFromRequest(request);
  if (token && result.correct === false && body.query?.trim()) {
    try {
      const session = await verifySession(token);
      const task = getComputerSqlTaskById(body.taskId);
      if (task) {
        const prompt = `SQL 练习：${task.title}\n${task.description}`;
        await prisma.mistake.create({
          data: {
            userId: session.user.id,
            practiceType: "computer",
            categoryId: "computer",
            questionId: `sql-${task.id}`,
            prompt,
            answer: task.expectedQuery,
            userAnswer: body.query.trim(),
            explanation: task.hint
          }
        });
      }
    } catch {
      // Ignore mistake recording failures for anonymous or invalid sessions.
    }
  }
  reply.send(result);
});

server.post("/practice/quick/session", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      categoryId?: string;
      mode?: string;
      startedAt?: string;
      endedAt?: string;
      questions?: Array<{
        id?: string;
        prompt?: string;
        answer?: string;
        userAnswer?: string;
        choices?: string[];
        explanation?: string;
        correct?: boolean;
      }>;
    };
    if (!body?.categoryId) {
      reply.code(400).send({ error: "缺少题型" });
      return;
    }
    if (!body?.mode || (body.mode !== "drill" && body.mode !== "quiz")) {
      reply.code(400).send({ error: "练习模式不合法" });
      return;
    }
    const mode = body.mode as "drill" | "quiz";
    const questions = Array.isArray(body.questions) ? body.questions : [];
    if (!questions.length) {
      reply.code(400).send({ error: "缺少题目记录" });
      return;
    }
    const startedAt = body.startedAt ? new Date(body.startedAt) : null;
    const endedAt = body.endedAt ? new Date(body.endedAt) : null;
    if (!startedAt || Number.isNaN(startedAt.getTime())) {
      reply.code(400).send({ error: "开始时间不合法" });
      return;
    }
    if (!endedAt || Number.isNaN(endedAt.getTime())) {
      reply.code(400).send({ error: "结束时间不合法" });
      return;
    }
    const durationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
    );

    const records = questions.flatMap((item, index) => {
      const prompt = typeof item.prompt === "string" ? item.prompt.trim() : "";
      const answer = typeof item.answer === "string" ? item.answer.trim() : "";
      if (!prompt || !answer) {
        return [];
      }
      const userAnswer =
        typeof item.userAnswer === "string" ? item.userAnswer.trim() : "";
      const providedCorrect =
        typeof item.correct === "boolean" ? item.correct : null;
      const isCorrect = providedCorrect ?? userAnswer === answer;
      const choices =
        Array.isArray(item.choices) &&
        item.choices.every((choice) => typeof choice === "string")
          ? item.choices
          : null;
      const explanation =
        typeof item.explanation === "string" && item.explanation.trim().length
          ? item.explanation.trim()
          : null;
      return [
        {
          questionId:
            typeof item.id === "string" && item.id.trim().length
              ? item.id
              : `q-${index + 1}`,
          prompt,
          answer,
          userAnswer,
          correct: isCorrect,
          choices,
          explanation
        }
      ];
    });

    if (!records.length) {
      reply.code(400).send({ error: "题目内容不完整" });
      return;
    }

    const totalQuestions = records.length;
    const correctCount = records.filter((record) => record.correct).length;
    const accuracy = totalQuestions ? correctCount / totalQuestions : 0;

    const created = await prisma.$transaction(async (tx) => {
      const practiceSession = await tx.practiceSession.create({
        data: {
          userId: session.user.id,
          practiceType: "quick",
          categoryId: body.categoryId,
          mode,
          totalQuestions,
          correctCount,
          accuracy,
          startedAt,
          endedAt,
          durationSeconds
        }
      });

      await tx.practiceRecord.createMany({
        data: records.map((record) => ({
          sessionId: practiceSession.id,
          userId: session.user.id,
          practiceType: "quick",
          categoryId: body.categoryId,
          questionId: record.questionId,
          prompt: record.prompt,
          answer: record.answer,
          userAnswer: record.userAnswer,
          correct: record.correct,
          choices: record.choices ?? undefined,
          explanation: record.explanation
        }))
      });

      const mistakes = records.filter(
        (record) => !record.correct && record.userAnswer
      );
      if (mistakes.length) {
        await tx.mistake.createMany({
          data: mistakes.map((record) => ({
            sessionId: practiceSession.id,
            userId: session.user.id,
            practiceType: "quick",
            categoryId: body.categoryId,
            questionId: record.questionId,
            prompt: record.prompt,
            answer: record.answer,
            userAnswer: record.userAnswer,
            explanation: record.explanation
          }))
        });
      }

      await tx.studyTimeLog.create({
        data: {
          userId: session.user.id,
          sessionId: practiceSession.id,
          startedAt,
          endedAt,
          durationSeconds
        }
      });

      return practiceSession;
    });

    reply.send({ id: created.id });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "记录失败" });
  }
});

server.get(
  "/auth/email/challenge",
  {
    config: { rateLimit: { max: 20, timeWindow: "15 minutes" } }
  },
  async () => {
  return createChallenge();
  }
);

server.post(
  "/auth/email/register/request",
  {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: {
      body: {
        type: "object",
        required: ["email", "challengeId", "answer"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email" },
          challengeId: { type: "string", minLength: 6 },
          answer: { type: "string", minLength: 1 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const body = request.body as {
      email?: string;
      challengeId?: string;
      answer?: string;
    };
    if (!body?.email || !body?.challengeId || !body?.answer) {
      reply.code(400).send({ error: "缺少必要参数" });
      return;
    }
    const result = await requestEmailVerification({
      email: body.email,
      challengeId: body.challengeId,
      answer: body.answer
    });
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "发送失败" });
  }
  }
);

server.post(
  "/auth/email/register/verify",
  {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
    schema: {
      body: {
        type: "object",
        required: ["token"],
        additionalProperties: false,
        properties: {
          token: { type: "string", minLength: 10 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const body = request.body as { token?: string };
    if (!body?.token) {
      reply.code(400).send({ error: "缺少令牌" });
      return;
    }
    const result = await verifyEmailToken(body.token);
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "验证失败" });
  }
  }
);

server.post(
  "/auth/register/complete",
  {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: {
      body: {
        type: "object",
        required: ["token", "username", "password"],
        additionalProperties: false,
        properties: {
          token: { type: "string", minLength: 10 },
          username: { type: "string", minLength: 2, maxLength: 10 },
          password: { type: "string", minLength: 8 },
          gender: { type: "string" },
          age: { type: "number", minimum: 10, maximum: 80 },
          examStartDate: { type: "string" }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const body = request.body as {
      token?: string;
      username?: string;
      password?: string;
      gender?: string;
      age?: number;
      examStartDate?: string;
    };
    if (!body?.token || !body?.username || !body?.password) {
      reply.code(400).send({ error: "缺少必要参数" });
      return;
    }
    const result = await completeRegistration({
      token: body.token,
      username: body.username,
      password: body.password,
      gender: body.gender,
      age: body.age,
      examStartDate: body.examStartDate
    });
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "注册失败" });
  }
  }
);

server.post(
  "/auth/login",
  {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const body = request.body as { email?: string; password?: string };
    if (!body?.email || !body?.password) {
      reply.code(400).send({ error: "缺少邮箱或密码" });
      return;
    }
    const result = await loginWithPassword({
      email: body.email,
      password: body.password
    });
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "登录失败" });
  }
  }
);

server.get(
  "/auth/wallet/challenge",
  {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
    schema: {
      querystring: {
        type: "object",
        required: ["address"],
        additionalProperties: false,
        properties: {
          address: { type: "string", minLength: 10 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const { address } = request.query as { address?: string };
    if (!address) {
      reply.code(400).send({ error: "缺少钱包地址" });
      return;
    }
    const result = createWalletChallenge(address);
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "生成挑战失败" });
  }
  }
);

server.post(
  "/auth/wallet/verify",
  {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: {
      body: {
        type: "object",
        required: ["address", "challengeId", "signature"],
        additionalProperties: false,
        properties: {
          address: { type: "string", minLength: 10 },
          challengeId: { type: "string", minLength: 6 },
          signature: { type: "string", minLength: 10 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const body = request.body as {
      address?: string;
      challengeId?: string;
      signature?: string;
    };
    if (!body?.address || !body?.challengeId || !body?.signature) {
      reply.code(400).send({ error: "缺少必要参数" });
      return;
    }
    const normalized = verifyWalletChallenge({
      id: body.challengeId,
      address: body.address,
      signature: body.signature
    });
    const result = await loginWithWallet(normalized);
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "钱包登录失败" });
  }
  }
);

server.get("/auth/me", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const aiConfig = resolveAiConfig(session.user);
    const freeAi = await getFreeAiStatus(session.user.id, aiConfig);
    reply.send({
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        walletAddress: session.user.walletAddress,
        gender: session.user.gender,
        age: session.user.age,
        examStartDate: session.user.examStartDate?.toISOString() ?? null,
        aiProvider: session.user.aiProvider,
        aiModel: session.user.aiModel,
        aiBaseUrl: session.user.aiBaseUrl,
        aiApiKeyConfigured: Boolean(session.user.aiApiKey),
        hasPassword: Boolean(session.user.passwordHash),
        freeAi
      },
      sessionExpiresAt: session.expiresAt.toISOString()
    });
  } catch (error) {
    reply.code(401).send({ error: error instanceof Error ? error.message : "未登录" });
  }
});

server.post("/profile", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      username?: string;
      gender?: string;
      age?: number;
      examStartDate?: string;
      aiProvider?: string;
      aiModel?: string;
      aiBaseUrl?: string;
      aiApiKey?: string;
    };
    const user = await updateProfile(session.user.id, body ?? {});
    const aiConfig = resolveAiConfig(user);
    const freeAi = await getFreeAiStatus(user.id, aiConfig);
    reply.send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress,
        gender: user.gender,
        age: user.age,
        examStartDate: user.examStartDate?.toISOString() ?? null,
        aiProvider: user.aiProvider,
        aiModel: user.aiModel,
        aiBaseUrl: user.aiBaseUrl,
        aiApiKeyConfigured: Boolean(user.aiApiKey),
        hasPassword: Boolean(user.passwordHash),
        freeAi
      }
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "更新失败" });
  }
});

server.post("/ai/models", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      provider?: string;
      baseUrl?: string;
      apiKey?: string;
    };
    const provider = body?.provider ?? session.user.aiProvider ?? "openai";
    const baseUrl = body?.baseUrl ?? session.user.aiBaseUrl ?? undefined;
    const apiKey = body?.apiKey ?? session.user.aiApiKey ?? undefined;
    const models = await listModels({
      provider,
      baseUrl,
      apiKey
    });
    reply.send({ provider, models });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.post(
  "/auth/logout",
  {
    config: { rateLimit: { max: 20, timeWindow: "15 minutes" } }
  },
  async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(400).send({ error: "缺少令牌" });
      return;
    }
    await revokeSession(token);
    reply.send({ status: "ok" });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "退出失败" });
  }
  }
);

server.post(
  "/auth/password/update",
  {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: {
      body: {
        type: "object",
        required: ["oldPassword", "newPassword"],
        additionalProperties: false,
        properties: {
          oldPassword: { type: "string", minLength: 8 },
          newPassword: { type: "string", minLength: 8 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as { oldPassword?: string; newPassword?: string };
    if (!body?.oldPassword || !body?.newPassword) {
      reply.code(400).send({ error: "缺少必要参数" });
      return;
    }
    const result = await changePassword({
      userId: session.user.id,
      oldPassword: body.oldPassword,
      newPassword: body.newPassword
    });
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "修改失败" });
  }
  }
);

server.post("/expenses/parse", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = (request.body ?? {}) as { text?: string };
    const text = normalizeOptionalText(body.text) ?? "";
    if (!text) {
      reply.code(400).send({ error: "请输入记账描述" });
      return;
    }
    if (text.length > MAX_EXPENSE_TEXT_LENGTH) {
      reply.code(400).send({ error: "描述过长，请控制在 200 字以内" });
      return;
    }

    const prompt = buildExpenseParsePrompt({ input: text, now: new Date() });
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateAssistAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });
    const parsed = extractJsonPayload(result.answer) as
      | {
          items?: Array<{
            date?: string | null;
            item?: string | null;
            amount?: number | string | null;
          }>;
          date?: string | null;
          item?: string | null;
          amount?: number | string | null;
        }
      | null;
    const fallbackDate = getBeijingDateString();
    const candidates = Array.isArray(parsed?.items) && parsed?.items?.length
      ? parsed?.items
      : parsed
      ? [parsed]
      : [];

    const entries: Array<{
      date: string;
      item: string;
      amount: number;
      formatted: string;
    }> = [];
    let invalidCount = 0;
    for (const candidate of candidates) {
      const { entry } = normalizeExpenseInput(candidate, fallbackDate);
      if (!entry) {
        invalidCount += 1;
        continue;
      }
      entries.push({
        date: entry.dateLabel,
        item: entry.item,
        amount: entry.amount,
        formatted: entry.formatted
      });
    }

    if (!entries.length) {
      reply.code(400).send({
        error: "无法识别有效支出，请补充项目和金额"
      });
      return;
    }
    const warning =
      invalidCount > 0 ? `有 ${invalidCount} 条记录未解析成功` : null;

    reply.send({
      entries,
      warning,
      date: entries[0].date,
      item: entries[0].item,
      amount: entries[0].amount,
      formatted: entries[0].formatted,
      raw: result.answer,
      model: result.model,
      beijingNow: getBeijingDateTimeString()
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "解析失败" });
  }
});

server.post("/expenses", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body ?? {};
    const payload = Array.isArray(body) ? body : (body as Record<string, unknown>);
    const recordsInput = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.records)
      ? payload.records
      : [payload];
    if (!recordsInput.length) {
      reply.code(400).send({ error: "缺少记账记录" });
      return;
    }
    const fallbackDate = getBeijingDateString();
    const rawTextFallback =
      !Array.isArray(payload) && typeof payload.rawText === "string"
        ? normalizeOptionalText(payload.rawText)
        : null;

    const createData: Array<{
      userId: string;
      item: string;
      amount: number;
      occurredAt: Date;
      rawText: string | null;
    }> = [];
    const responseRecords: Array<{
      dateLabel: string;
      item: string;
      amount: number;
    }> = [];
    for (let i = 0; i < recordsInput.length; i += 1) {
      const record = recordsInput[i] as Record<string, unknown>;
      const { entry, error } = normalizeExpenseInput(record, fallbackDate);
      if (!entry) {
        reply.code(400).send({
          error: `第 ${i + 1} 条记录${error ? `：${error}` : "不合法"}`
        });
        return;
      }
      const rawText =
        typeof record.rawText === "string"
          ? normalizeOptionalText(record.rawText)
          : rawTextFallback;
      createData.push({
        userId: session.user.id,
        item: entry.item,
        amount: entry.amount,
        occurredAt: entry.occurredAt,
        rawText: rawText ?? null
      });
      responseRecords.push({
        dateLabel: entry.dateLabel,
        item: entry.item,
        amount: entry.amount
      });
    }

    const createdRecords = await prisma.$transaction(
      createData.map((data) => expenseLogDelegate.create({ data }))
    );

    const records = createdRecords.map((record: any, index: number) => ({
      id: record.id,
      date: responseRecords[index]?.dateLabel ?? getBeijingDateString(record.occurredAt),
      item: record.item,
      amount: roundCurrency(record.amount ?? 0),
      rawText: record.rawText ?? null,
      createdAt: record.createdAt.toISOString()
    }));

    reply.send({
      count: records.length,
      records,
      record: records[0]
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "保存失败" });
  }
});

server.get("/expenses/overview", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { range, date, limit } = request.query as {
      range?: string;
      date?: string;
      limit?: string;
    };
    const rangeInput = typeof range === "string" ? range.toLowerCase() : "";
    const rangeKey =
      rangeInput && ["day", "week", "month", "year"].includes(rangeInput)
        ? (rangeInput as "day" | "week" | "month" | "year")
        : "month";
    const dateText = typeof date === "string" ? date.trim() : null;

    let start: Date;
    let end: Date;
    let labels: string[];
    if (rangeKey === "day") {
      const rangeInfo = getDayRange(dateText);
      start = rangeInfo.start;
      end = rangeInfo.end;
      labels = [getBeijingDateString(start)];
    } else if (rangeKey === "week") {
      const rangeInfo = getWeekRange(dateText);
      start = rangeInfo.start;
      end = rangeInfo.end;
      labels = rangeInfo.labels;
    } else if (rangeKey === "year") {
      const rangeInfo = getYearRange(dateText);
      start = rangeInfo.start;
      end = rangeInfo.end;
      labels = rangeInfo.labels;
    } else {
      const rangeInfo = getMonthRange(dateText);
      start = rangeInfo.start;
      end = rangeInfo.end;
      labels = getMonthBucketLabels(dateText);
    }

    const statsRecords = await expenseLogDelegate.findMany({
      where: {
        userId: session.user.id,
        occurredAt: { gte: start, lt: end }
      },
      select: {
        item: true,
        amount: true,
        occurredAt: true
      }
    });
    const take = Math.min(Math.max(Number(limit) || 80, 1), 200);
    const records = await expenseLogDelegate.findMany({
      where: {
        userId: session.user.id,
        occurredAt: { gte: start, lt: end }
      },
      orderBy: { occurredAt: "desc" },
      take
    });

    const itemMap = new Map<string, { amount: number; count: number }>();
    const seriesMap = new Map<string, number>();
    let totalAmount = 0;
    for (const record of statsRecords) {
      totalAmount += record.amount ?? 0;
      const itemKey = record.item?.trim() || "未分类";
      const itemEntry = itemMap.get(itemKey) ?? { amount: 0, count: 0 };
      itemEntry.amount += record.amount ?? 0;
      itemEntry.count += 1;
      itemMap.set(itemKey, itemEntry);

      const dateLabel = getBeijingDateString(record.occurredAt);
      const seriesLabel =
        rangeKey === "year"
          ? dateLabel.slice(0, 7)
          : rangeKey === "month"
          ? getMonthBucketLabel(dateLabel)
          : dateLabel;
      seriesMap.set(seriesLabel, (seriesMap.get(seriesLabel) ?? 0) + record.amount);
    }

    const sortedItems = Array.from(itemMap.entries()).sort(
      (a, b) => b[1].amount - a[1].amount
    );
    const maxItems = 7;
    const breakdown = sortedItems.slice(0, maxItems).map(([item, info]) => ({
      item,
      amount: roundCurrency(info.amount),
      count: info.count,
      percent:
        totalAmount > 0
          ? Math.round((info.amount / totalAmount) * 1000) / 10
          : 0
    }));
    if (sortedItems.length > maxItems) {
      const rest = sortedItems.slice(maxItems);
      const restAmount = rest.reduce((sum, [, info]) => sum + info.amount, 0);
      const restCount = rest.reduce((sum, [, info]) => sum + info.count, 0);
      breakdown.push({
        item: "其他",
        amount: roundCurrency(restAmount),
        count: restCount,
        percent:
          totalAmount > 0
            ? Math.round((restAmount / totalAmount) * 1000) / 10
            : 0
      });
    }

    const series = labels.map((label) => ({
      label,
      amount: roundCurrency(seriesMap.get(label) ?? 0)
    }));

    reply.send({
      range: {
        type: rangeKey,
        start: start.toISOString(),
        end: end.toISOString(),
        labels
      },
      totals: {
        amount: roundCurrency(totalAmount),
        count: statsRecords.length
      },
      breakdown,
      series,
      records: records.map((record: any) => ({
        id: record.id,
        date: getBeijingDateString(record.occurredAt),
        item: record.item,
        amount: roundCurrency(record.amount ?? 0),
        rawText: record.rawText ?? null,
        createdAt: record.createdAt.toISOString()
      }))
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.patch("/expenses/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少记录 ID" });
      return;
    }
    const existing = await expenseLogDelegate.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    const body = (request.body ?? {}) as {
      date?: string;
      item?: string;
      amount?: number | string;
    };
    const fallbackDate = getBeijingDateString(existing.occurredAt);
    const { entry, error } = normalizeExpenseInput(body, fallbackDate);
    if (!entry) {
      reply.code(400).send({ error: error ?? "记录不合法" });
      return;
    }
    const updated = await expenseLogDelegate.update({
      where: { id },
      data: {
        item: entry.item,
        amount: entry.amount,
        occurredAt: entry.occurredAt
      }
    });
    reply.send({
      record: {
        id: updated.id,
        date: getBeijingDateString(updated.occurredAt),
        item: updated.item,
        amount: roundCurrency(updated.amount ?? 0),
        rawText: updated.rawText ?? null,
        createdAt: updated.createdAt.toISOString()
      }
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "更新失败" });
  }
});

server.delete("/expenses/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少记录 ID" });
      return;
    }
    const existing = await expenseLogDelegate.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    await expenseLogDelegate.delete({ where: { id } });
    reply.send({ ok: true });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "删除失败" });
  }
});

server.get("/stats/overview", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);

    const [sessionCount, sessionTotals, mistakeCount, recentSessions, byCategory] =
      await prisma.$transaction([
        prisma.practiceSession.count({
          where: { userId: session.user.id }
        }),
        prisma.practiceSession.aggregate({
          where: { userId: session.user.id },
          _sum: {
            totalQuestions: true,
            correctCount: true,
            durationSeconds: true
          }
        }),
        prisma.mistake.count({
          where: { userId: session.user.id }
        }),
        prisma.practiceSession.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 5
        }),
        prisma.practiceSession.groupBy({
          by: ["categoryId"],
          where: { userId: session.user.id, categoryId: { not: null } },
          orderBy: { categoryId: "asc" },
          _sum: { totalQuestions: true, correctCount: true },
          _count: { _all: true }
        })
      ]);

    const totalQuestions = sessionTotals._sum.totalQuestions ?? 0;
    const totalCorrect = sessionTotals._sum.correctCount ?? 0;
    const totalDuration = sessionTotals._sum.durationSeconds ?? 0;
    const accuracy = totalQuestions ? totalCorrect / totalQuestions : 0;

    reply.send({
      totals: {
        sessions: sessionCount,
        questions: totalQuestions,
        correct: totalCorrect,
        accuracy: Math.round(accuracy * 1000) / 10,
        studyMinutes: Math.round((totalDuration / 60) * 10) / 10
      },
      mistakes: mistakeCount,
      byCategory: byCategory.map((item) => {
        const questions = item._sum?.totalQuestions ?? 0;
        const correct = item._sum?.correctCount ?? 0;
        const categoryAccuracy = questions ? correct / questions : 0;
        const sessions =
          item._count && typeof item._count === "object"
            ? item._count._all ?? 0
            : 0;
        return {
          categoryId: item.categoryId,
          sessions,
          questions,
          correct,
          accuracy: Math.round(categoryAccuracy * 1000) / 10
        };
      }),
      recentSessions: recentSessions.map((entry) => ({
        id: entry.id,
        practiceType: entry.practiceType,
        categoryId: entry.categoryId,
        mode: entry.mode,
        totalQuestions: entry.totalQuestions,
        correctCount: entry.correctCount,
        accuracy: Math.round(entry.accuracy * 1000) / 10,
        durationSeconds: entry.durationSeconds,
        createdAt: entry.createdAt.toISOString()
      }))
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.post(
  "/pomodoro/subjects",
  {
    schema: {
      body: {
        type: "object",
        required: ["name"],
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 20 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as { name?: string };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      reply.code(400).send({ error: "请输入学习项目名称" });
      return;
    }
    if (name.length > 20) {
      reply.code(400).send({ error: "学习项目名称过长" });
      return;
    }

    const count = await pomodoroSubjectDelegate.count({
      where: { userId: session.user.id }
    });
    if (count >= MAX_CUSTOM_POMODORO_SUBJECTS) {
      reply.code(400).send({ error: "最多添加 5 个自定义科目" });
      return;
    }

    const existing = await pomodoroSubjectDelegate.findFirst({
      where: { userId: session.user.id, name }
    });
    if (existing) {
      reply.code(400).send({ error: "学习项目已存在" });
      return;
    }

    const created = await pomodoroSubjectDelegate.create({
      data: {
        userId: session.user.id,
        name
      }
    });

    reply.send({
      id: created.id,
      name: created.name,
      createdAt: created.createdAt.toISOString()
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "添加失败" });
  }
  }
);

server.get("/pomodoro/subjects", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const subjects = await pomodoroSubjectDelegate.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" }
    });
    reply.send({
      subjects: subjects.map((item: { id: string; name: string; createdAt: Date }) => ({
        id: item.id,
        name: item.name,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.delete(
  "/pomodoro/subjects/:id",
  {
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", minLength: 1 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id: string };
    const existing = await pomodoroSubjectDelegate.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    await pomodoroSubjectDelegate.delete({ where: { id } });
    reply.send({ id });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "删除失败" });
  }
  }
);

server.post(
  "/pomodoro/start",
  {
    schema: {
      body: {
        type: "object",
        required: ["subject", "plannedMinutes"],
        additionalProperties: false,
        properties: {
          subject: { type: "string", minLength: 1 },
          plannedMinutes: { type: "number", minimum: 1, maximum: 240 }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as { subject?: string; plannedMinutes?: number };
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    if (!subject) {
      reply.code(400).send({ error: "请选择学习科目" });
      return;
    }
    if (subject.length > 20) {
      reply.code(400).send({ error: "学习科目名称过长" });
      return;
    }
    const planned = parseOptionalNumber(body.plannedMinutes);
    if (!planned || !Number.isFinite(planned) || planned <= 0) {
      reply.code(400).send({ error: "专注时长不合法" });
      return;
    }

    const plannedMinutes = Math.min(240, Math.max(1, Math.round(planned)));
    const startedAt = new Date();

    const created = await pomodoroSessionDelegate.create({
      data: {
        userId: session.user.id,
        subject,
        plannedMinutes,
        startedAt
      }
    });

    reply.send({
      id: created.id,
      subject: created.subject,
      plannedMinutes: created.plannedMinutes,
      startedAt: created.startedAt.toISOString()
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "创建失败" });
  }
  }
);

server.post(
  "/pomodoro/:id/finish",
  {
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", minLength: 1 }
        }
      },
      body: {
        type: "object",
        required: ["status"],
        additionalProperties: false,
        properties: {
          status: { type: "string", minLength: 1 },
          durationSeconds: { type: "number", minimum: 0 },
          pauseSeconds: { type: "number", minimum: 0 },
          pauseCount: { type: "number", minimum: 0 },
          failureReason: { type: "string" }
        }
      }
    }
  },
  async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id: string };
    const body = request.body as {
      status?: string;
      durationSeconds?: number;
      pauseSeconds?: number;
      pauseCount?: number;
      failureReason?: string;
    };

    const status = typeof body.status === "string" ? body.status : "";
    const allowedStatuses = new Set(["completed", "failed", "abandoned"]);
    if (!allowedStatuses.has(status)) {
      reply.code(400).send({ error: "结束状态不合法" });
      return;
    }

    const existing = await pomodoroSessionDelegate.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    if (existing.status && existing.status !== "in_progress") {
      reply.send({
        id: existing.id,
        status: existing.status,
        durationSeconds: existing.durationSeconds
      });
      return;
    }

    const pauseSecondsInput = parseOptionalNumber(body.pauseSeconds);
    const pauseSeconds =
      typeof pauseSecondsInput === "number" && Number.isFinite(pauseSecondsInput)
        ? Math.max(0, Math.round(pauseSecondsInput))
        : null;
    const durationSecondsInput = parseOptionalNumber(body.durationSeconds);
    let durationSeconds =
      typeof durationSecondsInput === "number" && Number.isFinite(durationSecondsInput)
        ? Math.max(0, Math.round(durationSecondsInput))
        : null;
    const pauseCountInput = parseOptionalNumber(body.pauseCount);
    const pauseCount =
      typeof pauseCountInput === "number" && Number.isFinite(pauseCountInput)
        ? Math.max(0, Math.round(pauseCountInput))
        : null;
    const failureReason =
      typeof body.failureReason === "string" && body.failureReason.trim()
        ? body.failureReason.trim()
        : null;

    let finalStatus = status;
    let finalFailureReason = failureReason;
    if (pauseSeconds !== null && pauseSeconds >= POMODORO_PAUSE_LIMIT_SECONDS) {
      finalStatus = "failed";
      if (!finalFailureReason) {
        finalFailureReason = "pause_timeout";
      }
    }

    const endedAt = new Date();
    if (durationSeconds === null) {
      const rawDuration = Math.round(
        (endedAt.getTime() - existing.startedAt.getTime()) / 1000
      );
      const deducted = pauseSeconds ?? 0;
      durationSeconds = Math.max(0, rawDuration - deducted);
    }

    const updated = await pomodoroSessionDelegate.update({
      where: { id },
      data: {
        status: finalStatus,
        endedAt,
        durationSeconds,
        pauseSeconds,
        pauseCount,
        failureReason: finalFailureReason
      }
    });

    reply.send({
      id: updated.id,
      status: updated.status,
      durationSeconds: updated.durationSeconds,
      pauseSeconds: updated.pauseSeconds
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "保存失败" });
  }
  }
);

server.get("/pomodoro/insights", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const query = request.query as { days?: string | number };
    const daysInput = parseOptionalNumber(query?.days);
    const days = Math.min(180, Math.max(28, Math.round(daysInput ?? 84)));
    const dayMs = 24 * 60 * 60 * 1000;
    const todayLabel = getBeijingDateString();
    const todayBase = parseOptionalDate(todayLabel) ?? new Date();
    const start = new Date(todayBase.getTime() - (days - 1) * dayMs);
    const end = new Date(todayBase.getTime() + dayMs);

    const records = await pomodoroSessionDelegate.findMany({
      where: {
        userId: session.user.id,
        startedAt: { gte: start, lt: end }
      },
      orderBy: { startedAt: "asc" }
    });

    const resolvedRecords = records.filter(
      (record: { status?: string }) => record.status !== "in_progress"
    );
    const subjects: string[] = [];
    const subjectSet = new Set<string>();
    for (const subject of POMODORO_SUBJECTS) {
      subjects.push(subject);
      subjectSet.add(subject);
    }
    for (const record of resolvedRecords) {
      if (record.subject && !subjectSet.has(record.subject)) {
        subjects.push(record.subject);
        subjectSet.add(record.subject);
      }
    }

    const dayMap = new Map<
      string,
      { date: string; totalMinutes: number; totals: Record<string, number> }
    >();
    const dayLabels: string[] = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start.getTime() + i * dayMs);
      const label = getBeijingDateString(date);
      dayLabels.push(label);
      dayMap.set(label, { date: label, totalMinutes: 0, totals: {} });
    }

    const bucketDefs = [
      { key: "morning", label: "早晨", range: "05:00-11:59" },
      { key: "afternoon", label: "下午", range: "12:00-17:59" },
      { key: "night", label: "深夜", range: "18:00-04:59" }
    ];
    const bucketStats = bucketDefs.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      range: bucket.range,
      count: 0,
      minutes: 0
    }));

    const radarTotals = new Map<string, number>();
    for (const subject of subjects) {
      radarTotals.set(subject, 0);
    }

    let completedCount = 0;
    let failedCount = 0;
    let focusSeconds = 0;

    for (const record of resolvedRecords) {
      if (record.status === "failed") {
        failedCount += 1;
      }
      if (record.status !== "completed") {
        continue;
      }
      completedCount += 1;
      const durationSeconds =
        typeof record.durationSeconds === "number" ? record.durationSeconds : 0;
      focusSeconds += durationSeconds;
      const minutes = Math.round(durationSeconds / 60);

      const label = getBeijingDateString(record.startedAt);
      const day = dayMap.get(label);
      if (day) {
        day.totalMinutes += minutes;
        day.totals[record.subject] =
          (day.totals[record.subject] ?? 0) + minutes;
      }

      radarTotals.set(
        record.subject,
        (radarTotals.get(record.subject) ?? 0) + minutes
      );

      const bucketHour = getBeijingHour(record.endedAt ?? record.startedAt);
      let bucket = bucketStats[2];
      if (bucketHour >= 5 && bucketHour < 12) {
        bucket = bucketStats[0];
      } else if (bucketHour >= 12 && bucketHour < 18) {
        bucket = bucketStats[1];
      }
      bucket.count += 1;
      bucket.minutes += minutes;
    }

    const heatmapDays = dayLabels.map((label) => {
      const day = dayMap.get(label);
      return (
        day ?? {
          date: label,
          totalMinutes: 0,
          totals: {}
        }
      );
    });

    reply.send({
      totals: {
        sessions: resolvedRecords.length,
        completed: completedCount,
        failed: failedCount,
        focusMinutes: Math.round((focusSeconds / 60) * 10) / 10
      },
      subjects,
      heatmap: {
        days: heatmapDays
      },
      timeBuckets: bucketStats,
      radar: subjects.map((subject) => ({
        subject,
        minutes: radarTotals.get(subject) ?? 0
      }))
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.get("/mistakes", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { limit, categoryId } = request.query as {
      limit?: string;
      categoryId?: string;
    };
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const mistakes = await prisma.mistake.findMany({
      where: {
        userId: session.user.id,
        categoryId: categoryId ? categoryId : undefined
      },
      orderBy: { createdAt: "desc" },
      take
    });
    reply.send({
      mistakes: mistakes.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        practiceType: item.practiceType,
        prompt: item.prompt,
        answer: item.answer,
        userAnswer: item.userAnswer,
        explanation: item.explanation,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.post("/ai/assist", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      scenarioId?: string;
      system?: string;
      user?: string;
      question?: string;
    };
    if (!body?.system || !body?.user) {
      reply.code(400).send({ error: "缺少必要提示词" });
      return;
    }
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateAssistAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: body.system },
        { role: "user", content: body.user }
      ]
    });
    const record = await prisma.aiAssistHistory.create({
      data: {
        userId: session.user.id,
        scenarioId: body.scenarioId ?? "general",
        question: body.question?.trim() ?? "",
        answer: result.answer,
        model: result.model
      }
    });
    reply.send({
      answer: result.answer,
      model: result.model,
      history: {
        id: record.id,
        scenarioId: record.scenarioId,
        question: record.question,
        answer: record.answer,
        model: record.model,
        createdAt: record.createdAt.toISOString()
      }
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "答疑失败" });
  }
});

server.post("/ai/chat", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as { message?: string; mode?: string };
    const message = body?.message?.trim() ?? "";
    const chatMode = normalizeChatMode(body?.mode);
    if (!message) {
      reply.code(400).send({ error: "请输入问题" });
      return;
    }
    if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
      reply.code(400).send({ error: "内容过长" });
      return;
    }
    await trimChatHistory(session.user.id, chatMode);
    const historyWhere: {
      userId: string;
      mode: ChatMode;
      createdAt?: { gte: Date };
    } = { userId: session.user.id, mode: chatMode };
    if (chatMode === "tutor") {
      historyWhere.createdAt = { gte: getTutorContextCutoff() };
    }
    const [studyPlanProfile, latestPlanHistory, mockReports, historyRecords] =
      await Promise.all([
        chatMode === "planner"
          ? prisma.studyPlanProfile.findUnique({
              where: { userId: session.user.id }
            })
          : Promise.resolve(null),
        chatMode === "planner"
          ? prisma.studyPlanHistory.findFirst({
              where: { userId: session.user.id },
              orderBy: { createdAt: "desc" }
            })
          : Promise.resolve(null),
        chatMode === "planner"
          ? prisma.mockExamReport.findMany({
              where: { userId: session.user.id },
              orderBy: { createdAt: "desc" },
              take: 3
            })
          : Promise.resolve([]),
        aiChatMessageDelegate.findMany({
          where: historyWhere,
          orderBy: { createdAt: "asc" },
          take: CHAT_HISTORY_LIMIT
        })
      ]);

    const latestSummary =
      chatMode === "planner" &&
      typeof latestPlanHistory?.summary === "string" &&
      latestPlanHistory.summary.trim()
        ? latestPlanHistory.summary
        : null;
    const planData =
      chatMode === "planner"
        ? (latestPlanHistory?.planData as { summary?: string } | null)
        : null;
    const planSummary =
      chatMode === "planner"
        ? latestSummary ?? (typeof planData?.summary === "string" ? planData.summary : null)
        : null;
    const systemPrompt = buildChatSystemPrompt({
      mode: chatMode,
      user: chatMode === "planner" ? session.user : undefined,
      studyPlanProfile: chatMode === "planner" ? studyPlanProfile : null,
      planSummary: chatMode === "planner" ? planSummary : null,
      mockReports: chatMode === "planner" ? mockReports : []
    });

    const historyMessages = (historyRecords as ChatMessageRecord[]).flatMap(
      (record) => {
        if (record.role !== "user" && record.role !== "assistant") {
          return [];
        }
        return [{ role: record.role as "user" | "assistant", content: record.content }];
      }
    );
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateAssistAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message }
      ]
    });

    const now = new Date();
    const assistantTime = new Date(now.getTime() + 1);
    const [userRecord, assistantRecord] = (await prisma.$transaction([
      aiChatMessageDelegate.create({
        data: {
          userId: session.user.id,
          mode: chatMode,
          role: "user",
          content: message,
          createdAt: now
        }
      }),
      aiChatMessageDelegate.create({
        data: {
          userId: session.user.id,
          mode: chatMode,
          role: "assistant",
          content: result.answer,
          createdAt: assistantTime
        }
      })
    ])) as ChatMessageRecord[];

    await trimChatHistory(session.user.id, chatMode);
    reply.send({
      answer: result.answer,
      model: result.model,
      messages: [formatChatRecord(userRecord), formatChatRecord(assistantRecord)]
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "答疑失败" });
  }
});

server.post("/ai/knowledge", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      topic?: string;
      question?: string;
      context?: string;
      title?: string;
    };
    const hasInput = Boolean(body?.topic?.trim() || body?.question?.trim());
    if (!hasInput) {
      reply.code(400).send({ error: "请选择关键词或输入问题" });
      return;
    }
    const prompt = buildKnowledgePrompt({
      topic: body.topic,
      question: body.question,
      context: body.context,
      title: body.title
    });
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateAssistAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });
    reply.send({
      answer: result.answer,
      model: result.model,
      question: prompt.question,
      topic: prompt.topic || null
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "生成失败"
    });
  }
});

server.post("/ai/knowledge/vision", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      imageDataUrl?: string;
      title?: string;
    };
    const imageDataUrl = body?.imageDataUrl?.trim() ?? "";
    if (!imageDataUrl.startsWith("data:image/")) {
      reply.code(400).send({ error: "请提供有效的图片数据" });
      return;
    }
    const system = [
      "你是公考常识学习助手，负责从图片中提取文字与知识点。",
      "只输出 JSON，不要输出其他文本。",
      'JSON 格式: {"text":"...","topics":["..."]}',
      "topics 为 6-12 个中文关键词短语，避免长句，去重。"
    ].join("\n");
    const userText = [
      "任务：识别图片中的文字，并提炼关键知识点。",
      body?.title ? `图片标题：${body.title}` : "",
      "请严格返回 JSON。"
    ]
      .filter(Boolean)
      .join("\n");
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateVisionAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        }
      ]
    });
    const parsed = extractJsonPayload(result.answer) as
      | { text?: string; topics?: string[] }
      | null;
    if (!parsed) {
      reply.send({
        text: result.answer,
        topics: [],
        model: result.model
      });
      return;
    }
    reply.send({
      text: typeof parsed.text === "string" ? parsed.text : "",
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.filter((item) => typeof item === "string")
        : [],
      model: result.model
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "识别失败"
    });
  }
});

server.post("/kline/bazi", async (request, reply) => {
  try {
    const body = request.body as {
      birthDate?: string;
      birthTime?: string;
      gender?: "male" | "female";
      province?: string;
      longitude?: number;
      ziHourMode?: "late" | "early";
    };
    if (!body?.birthDate) {
      reply.code(400).send({ error: "请填写出生日期" });
      return;
    }
    const longitude =
      typeof body.longitude === "number"
        ? body.longitude
        : typeof body.longitude === "string"
        ? Number.parseFloat(body.longitude)
        : undefined;
    const result = calculateBazi({
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      gender: body.gender,
      province: body.province,
      longitude,
      ziHourMode: body.ziHourMode
    });
    reply.send(result);
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "八字计算失败"
    });
  }
});

server.post("/ai/kline", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = (request.body ?? {}) as {
      bazi?: string[];
      dayunSequence?: string[];
      dayunStartAge?: number | string | null;
      dayunDirection?: string | null;
      trueSolarTime?: string | null;
      lunarDate?: string | null;
      birthDate?: string | null;
      birthTime?: string | null;
      gender?: string | null;
      province?: string | null;
      ziHourMode?: string | null;
      education?: string | null;
      schoolTier?: string | null;
      prepTime?: string | null;
      interviewCount?: string | null;
      fenbiForecastXingce?: string | null;
      fenbiForecastShenlun?: string | null;
      historyScoreXingce?: string | null;
      historyScoreShenlun?: string | null;
      promptStyle?: "default" | "gentle" | null;
    };
    if (!Array.isArray(body.bazi) || body.bazi.length !== 4) {
      reply.code(400).send({ error: "缺少有效的八字信息" });
      return;
    }
    const promptStyle: "default" | "gentle" =
      body.promptStyle === "gentle" ? "gentle" : "default";
    const normalized = {
      bazi: body.bazi.filter((item) => typeof item === "string"),
      dayunSequence: Array.isArray(body.dayunSequence)
        ? body.dayunSequence.filter((item) => typeof item === "string")
        : [],
      dayunStartAge: parseOptionalNumber(body.dayunStartAge) ?? null,
      dayunDirection: normalizeOptionalText(body.dayunDirection) ?? null,
      trueSolarTime: normalizeOptionalText(body.trueSolarTime) ?? null,
      lunarDate: normalizeOptionalText(body.lunarDate) ?? null,
      birthDate: normalizeOptionalText(body.birthDate) ?? null,
      birthTime: normalizeOptionalText(body.birthTime) ?? null,
      gender: normalizeOptionalText(body.gender) ?? null,
      province: normalizeOptionalText(body.province) ?? null,
      ziHourMode: normalizeOptionalText(body.ziHourMode) ?? null,
      education: normalizeOptionalText(body.education) ?? null,
      schoolTier: normalizeOptionalText(body.schoolTier) ?? null,
      prepTime: normalizeOptionalText(body.prepTime) ?? null,
      interviewCount: normalizeOptionalText(body.interviewCount) ?? null,
      fenbiForecastXingce: normalizeOptionalText(body.fenbiForecastXingce) ?? null,
      fenbiForecastShenlun: normalizeOptionalText(body.fenbiForecastShenlun) ?? null,
      historyScoreXingce: normalizeOptionalText(body.historyScoreXingce) ?? null,
      historyScoreShenlun: normalizeOptionalText(body.historyScoreShenlun) ?? null,
      promptStyle
    };
    const aiConfig = resolveAiConfig(session.user);
    if (aiConfig.usingFree && klineActive >= KLINE_FREE_AI_CONCURRENCY_LIMIT) {
      const job = enqueueKlineJob(normalized, session.user.id, aiConfig);
      const position = getKlineQueuePosition(job.id);
      const etaMinutes = getKlineQueueEtaMinutes(position);
      reply.code(202).send({
        status: "queued",
        queueId: job.id,
        position,
        etaMinutes
      });
      return;
    }
    const response = aiConfig.usingFree
      ? await runKlineWithSlot(normalized, session.user.id, aiConfig)
      : await runKlineAnalysis(normalized, session.user.id, aiConfig);
    reply.send(response);
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "测算失败"
    });
  }
});

server.get("/ai/kline/queue/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少队列 ID" });
      return;
    }
    const job = klineJobs.get(id);
    if (!job || job.userId !== session.user.id) {
      reply.code(404).send({ error: "队列记录不存在" });
      return;
    }
    if (job.status === "queued") {
      const position = getKlineQueuePosition(job.id);
      const etaMinutes = getKlineQueueEtaMinutes(position);
      reply.send({
        status: "queued",
        queueId: job.id,
        position,
        etaMinutes
      });
      return;
    }
    if (job.status === "processing") {
      reply.send({ status: "processing", queueId: job.id });
      return;
    }
    if (job.status === "failed") {
      reply.code(400).send({
        status: "failed",
        error: job.error || "测算失败，请稍后再试。"
      });
      return;
    }
    if (!job.result) {
      reply.code(400).send({ error: "队列结果缺失，请稍后重试。" });
      return;
    }
    reply.send({ status: "done", ...job.result });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "获取队列状态失败"
    });
  }
});

server.get("/kline/history", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { limit } = request.query as { limit?: string };
    const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const reports = (await klineReportDelegate.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take
    })) as KlineReportRecord[];
    reply.send({
      reports: reports.map((report) => {
        const summary = extractKlineSummary(report.analysis);
        return {
          id: report.id,
          bazi: report.bazi ?? null,
          input: report.input ?? null,
          analysis: report.analysis ?? null,
          raw: report.raw ?? null,
          model: report.model ?? null,
          warning: report.warning ?? null,
          createdAt: report.createdAt.toISOString(),
          summary: summary.summary,
          landingYear: summary.landingYear,
          landingProbability: summary.landingProbability
        };
      })
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "获取历史记录失败"
    });
  }
});

server.post("/knowledge/imports", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      title?: string;
      content?: string;
      source?: string;
      topics?: string[];
    };
    const content = body?.content?.trim() ?? "";
    if (!content) {
      reply.code(400).send({ error: "缺少内容" });
      return;
    }
    const title = body?.title?.trim() || null;
    const source = normalizeKnowledgeSource(body?.source ?? null);
    const topics = normalizeKnowledgeTopics(body?.topics);
    const created = await prisma.knowledgeImport.create({
      data: {
        userId: session.user.id,
        title,
        content,
        source,
        topics
      }
    });
    reply.send({
      id: created.id,
      title: created.title ?? "未命名",
      content: created.content,
      source: created.source,
      topics: created.topics ?? [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "保存失败"
    });
  }
});

server.get("/knowledge/imports", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { limit } = request.query as { limit?: string };
    const take = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const records = await prisma.knowledgeImport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take
    });
    reply.send({
      imports: records.map((record) => ({
        id: record.id,
        title: record.title ?? "未命名",
        content: record.content,
        source: record.source,
        topics: record.topics ?? [],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "获取失败"
    });
  }
});

server.patch("/knowledge/imports/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少记录 ID" });
      return;
    }
    const body = request.body as {
      title?: string;
      content?: string;
      topics?: string[];
    };
    const updates: {
      title?: string | null;
      content?: string;
      topics?: string[];
    } = {};
    let hasUpdate = false;
    if (typeof body.title === "string") {
      updates.title = body.title.trim() || null;
      hasUpdate = true;
    }
    if (typeof body.content === "string") {
      updates.content = body.content.trim();
      hasUpdate = true;
    }
    if (Array.isArray(body.topics)) {
      updates.topics = normalizeKnowledgeTopics(body.topics);
      hasUpdate = true;
    }
    if (!hasUpdate) {
      reply.code(400).send({ error: "没有可更新的内容" });
      return;
    }
    const existing = await prisma.knowledgeImport.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    const updated = await prisma.knowledgeImport.update({
      where: { id },
      data: updates
    });
    reply.send({
      id: updated.id,
      title: updated.title ?? "未命名",
      content: updated.content,
      source: updated.source,
      topics: updated.topics ?? [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "更新失败"
    });
  }
});

server.delete("/knowledge/imports/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少记录 ID" });
      return;
    }
    const existing = await prisma.knowledgeImport.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    await prisma.knowledgeImport.delete({ where: { id } });
    reply.send({ ok: true });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "删除失败"
    });
  }
});

server.get("/study-plan/profile", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const profile = await prisma.studyPlanProfile.findUnique({
      where: { userId: session.user.id }
    });
    if (!profile) {
      reply.send({ profile: null });
      return;
    }
    reply.send({
      profile: {
        id: profile.id,
        prepStartDate: profile.prepStartDate?.toISOString() ?? null,
        totalStudyHours: profile.totalStudyHours,
        totalStudyDurationText: profile.totalStudyDurationText,
        currentProgress: profile.currentProgress,
        targetExam: profile.targetExam,
        targetExamDate: profile.targetExamDate?.toISOString() ?? null,
        plannedMaterials: profile.plannedMaterials,
        interviewExperience: profile.interviewExperience,
        learningGoals: profile.learningGoals,
        notes: profile.notes,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString()
      }
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.put("/study-plan/profile", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = (request.body ?? {}) as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    if (hasOwn(body, "prepStartDate")) {
      updateData.prepStartDate = parseOptionalDate(body.prepStartDate);
    }
    if (hasOwn(body, "totalStudyHours")) {
      updateData.totalStudyHours = parseOptionalNumber(body.totalStudyHours);
    }
    if (hasOwn(body, "totalStudyDuration") || hasOwn(body, "totalStudyDurationText")) {
      const raw = hasOwn(body, "totalStudyDuration")
        ? body.totalStudyDuration
        : body.totalStudyDurationText;
      updateData.totalStudyDurationText = normalizeOptionalText(raw);
    }
    if (hasOwn(body, "currentProgress")) {
      updateData.currentProgress = normalizeOptionalText(body.currentProgress);
    }
    if (hasOwn(body, "targetExam")) {
      updateData.targetExam = normalizeOptionalText(body.targetExam);
    }
    if (hasOwn(body, "targetExamDate")) {
      updateData.targetExamDate = parseOptionalDate(body.targetExamDate);
    }
    if (hasOwn(body, "plannedMaterials")) {
      updateData.plannedMaterials = normalizeOptionalText(body.plannedMaterials);
    }
    if (hasOwn(body, "interviewExperience")) {
      updateData.interviewExperience =
        typeof body.interviewExperience === "boolean"
          ? body.interviewExperience
          : null;
    }
    if (hasOwn(body, "learningGoals")) {
      updateData.learningGoals = normalizeOptionalText(body.learningGoals);
    }
    if (hasOwn(body, "studyResources")) {
      const resources = normalizeOptionalText(body.studyResources);
      updateData.plannedMaterials = resources;
      updateData.learningGoals = resources;
    }
    if (hasOwn(body, "notes")) {
      updateData.notes = normalizeOptionalText(body.notes);
    }
    if (!Object.keys(updateData).length) {
      reply.code(400).send({ error: "没有可更新的内容" });
      return;
    }
    const created = await prisma.studyPlanProfile.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        prepStartDate: parseOptionalDate(body.prepStartDate) ?? null,
        totalStudyHours: parseOptionalNumber(body.totalStudyHours) ?? null,
        totalStudyDurationText: normalizeOptionalText(
          hasOwn(body, "totalStudyDuration") ? body.totalStudyDuration : body.totalStudyDurationText
        ) ?? null,
        currentProgress: normalizeOptionalText(body.currentProgress) ?? null,
        targetExam: normalizeOptionalText(body.targetExam) ?? null,
        targetExamDate: parseOptionalDate(body.targetExamDate) ?? null,
        interviewExperience:
          typeof body.interviewExperience === "boolean"
            ? body.interviewExperience
            : null,
        learningGoals:
          normalizeOptionalText(
            hasOwn(body, "studyResources") ? body.studyResources : body.learningGoals
          ) ?? null,
        plannedMaterials:
          normalizeOptionalText(
            hasOwn(body, "studyResources") ? body.studyResources : body.plannedMaterials
          ) ?? null,
        notes: normalizeOptionalText(body.notes) ?? null
      }
    });
    reply.send({
      profile: {
        id: created.id,
        prepStartDate: created.prepStartDate?.toISOString() ?? null,
        totalStudyHours: created.totalStudyHours,
        totalStudyDurationText: created.totalStudyDurationText,
        currentProgress: created.currentProgress,
        targetExam: created.targetExam,
        targetExamDate: created.targetExamDate?.toISOString() ?? null,
        plannedMaterials: created.plannedMaterials,
        interviewExperience: created.interviewExperience,
        learningGoals: created.learningGoals,
        notes: created.notes,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      }
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "保存失败" });
  }
});

server.get("/study-plan/history", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { limit } = request.query as { limit?: string };
    const take = Math.min(Math.max(Number(limit) || 30, 1), 50);
    const records = await prisma.studyPlanHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take
    });
    reply.send({
      history: records.map((record) => ({
        id: record.id,
        summary: record.summary,
        progressUpdate: record.progressUpdate,
        planData: record.planData,
        planRaw: record.planRaw,
        createdAt: record.createdAt.toISOString()
      }))
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.delete("/study-plan/history/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少记录 ID" });
      return;
    }
    const existing = await prisma.studyPlanHistory.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    await prisma.studyPlanHistory.delete({ where: { id } });
    reply.send({ ok: true });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "删除失败" });
  }
});

server.get("/study-plan/daily", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { date } = request.query as { date?: string };
    const { start, end } = getDayRange(date ?? null);
    const record = await prisma.studyPlanDailyTask.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lt: end
        }
      }
    });
    if (!record) {
      reply.send({ task: null });
      return;
    }
    reply.send({
      task: {
        id: record.id,
        date: record.date.toISOString(),
        summary: record.summary,
        adjustNote: record.adjustNote,
        tasks: record.tasks ?? [],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      }
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.get("/study-plan/daily/history", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const query = request.query as { date?: string; days?: string | number };
    const rawDays = parseOptionalNumber(query.days);
    const days =
      typeof rawDays === "number" && Number.isFinite(rawDays)
        ? Math.min(Math.max(Math.floor(rawDays), 1), 30)
        : 7;
    const { start: baseStart } = getDayRange(query.date ?? null);
    const start = new Date(baseStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const end = new Date(baseStart.getTime() + 24 * 60 * 60 * 1000);
    const records = await prisma.studyPlanDailyTask.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lt: end
        }
      },
      orderBy: { date: "desc" }
    });
    reply.send({
      tasks: records.map((record) => ({
        id: record.id,
        date: record.date.toISOString(),
        tasks: record.tasks ?? []
      }))
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.patch("/study-plan/daily/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少记录 ID" });
      return;
    }
    const body = (request.body ?? {}) as {
      tasks?: unknown;
      summary?: string | null;
    };
    const updates: {
      tasks?: DailyTaskRecord[];
      summary?: string | null;
    } = {};
    let hasUpdate = false;
    if (body.tasks !== undefined) {
      updates.tasks = normalizeDailyTasks(body.tasks);
      hasUpdate = true;
    }
    if (body.summary !== undefined) {
      updates.summary = normalizeOptionalText(body.summary);
      hasUpdate = true;
    }
    if (!hasUpdate) {
      reply.code(400).send({ error: "没有可更新的内容" });
      return;
    }
    const existing = await prisma.studyPlanDailyTask.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!existing) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    const updated = await prisma.studyPlanDailyTask.update({
      where: { id },
      data: updates
    });
    reply.send({
      task: {
        id: updated.id,
        date: updated.date.toISOString(),
        summary: updated.summary,
        adjustNote: updated.adjustNote,
        tasks: updated.tasks ?? [],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      }
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "更新失败" });
  }
});

server.post("/ai/study-plan/daily", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = (request.body ?? {}) as {
      date?: string | null;
      adjustNote?: string | null;
      tasks?: unknown;
      progressUpdate?: string | null;
      followUpAnswers?: string | null;
      auto?: boolean;
    };
    const { start } = getDayRange(body.date ?? null);
    const existing = await prisma.studyPlanDailyTask.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lt: new Date(start.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });
    if (body.auto && existing) {
      reply.send({
        task: {
          id: existing.id,
          date: existing.date.toISOString(),
          summary: existing.summary,
          adjustNote: existing.adjustNote,
          tasks: existing.tasks ?? [],
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString()
        }
      });
      return;
    }
    const profile = await prisma.studyPlanProfile.findUnique({
      where: { userId: session.user.id }
    });
    const planHistory = await prisma.studyPlanHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 1
    });
    const latestPlan = planHistory[0] ?? null;
    const preferences = latestPlan?.preferences as Record<string, unknown> | null;
    const preferenceText = [
      typeof preferences?.weeklyStudyHours === "number"
        ? `每周 ${preferences.weeklyStudyHours} 小时`
        : null,
      typeof preferences?.dailyStudyHours === "number"
        ? `每日 ${preferences.dailyStudyHours} 小时`
        : null,
      Array.isArray(preferences?.timeSlots) && preferences?.timeSlots.length
        ? `时段：${ensureStringArray(preferences?.timeSlots).join("、")}`
        : null,
      typeof preferences?.timeNote === "string" && preferences?.timeNote.trim()
        ? preferences?.timeNote.trim()
        : null
    ]
      .filter(Boolean)
      .join("；");
    const planData = (latestPlan?.planData ?? null) as Record<string, unknown> | null;
    const mockReports = await prisma.mockExamReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 2
    });
    const mockText = mockReports
      .map((record) => {
        const accuracy =
          typeof record.overallAccuracy === "number"
            ? `${Math.round(record.overallAccuracy * 1000) / 10}%`
            : "未知";
        return `${record.title ?? "模考"} 正确率 ${accuracy}`;
      })
      .join("；");
    const recentWindowDays = 7;
    const recentStart = new Date(
      start.getTime() - recentWindowDays * 24 * 60 * 60 * 1000
    );
    const recentRecords = await prisma.studyPlanDailyTask.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: recentStart,
          lt: start
        }
      },
      orderBy: { date: "desc" },
      take: recentWindowDays
    });
    const recentCompletedTasks = formatRecentCompletedTasks(
      recentRecords.map((record) => ({
        date: record.date,
        tasks: record.tasks
      }))
    );

    const prompt = buildDailyTaskPrompt({
      dateLabel: getBeijingDateString(start),
      planSummary: typeof planData?.summary === "string" ? planData.summary : null,
      weeklyPlan: ensureStringArray(planData?.weeklyPlan),
      dailyPlan: ensureStringArray(planData?.dailyPlan),
      focusAreas: ensureStringArray(planData?.focusAreas),
      materials: ensureStringArray(planData?.materials),
      preferencesText: preferenceText || null,
      mockReportsText: mockText || null,
      adjustNote: normalizeOptionalText(body.adjustNote) ?? null,
      progressUpdate: normalizeOptionalText(body.progressUpdate) ?? null,
      followUpAnswers: normalizeOptionalText(body.followUpAnswers) ?? null,
      existingTasks: Array.isArray(body.tasks)
        ? normalizeDailyTasks(body.tasks).map((task) => ({
            title: task.title ?? "",
            durationMinutes: task.durationMinutes ?? null,
            notes: task.notes ?? null,
            subtasks: (task.subtasks ?? []).map((sub) => sub?.title ?? "")
          }))
        : null,
      recentCompletedTasks: recentCompletedTasks.length ? recentCompletedTasks : null
    });

    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateAssistAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });

    const parsed = extractJsonPayload(result.answer) as
      | {
          summary?: string;
          tasks?: unknown;
        }
      | null;
    const tasks = normalizeDailyTasks(parsed?.tasks ?? []);
    const summary = typeof parsed?.summary === "string" ? parsed.summary : null;

    const saved = await prisma.studyPlanDailyTask.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: start
        }
      },
      update: {
        summary,
        tasks,
        adjustNote: normalizeOptionalText(body.adjustNote) ?? null,
        planHistoryId: latestPlan?.id ?? null
      },
      create: {
        userId: session.user.id,
        date: start,
        summary,
        adjustNote: normalizeOptionalText(body.adjustNote) ?? null,
        tasks,
        planHistoryId: latestPlan?.id ?? null
      }
    });

    reply.send({
      task: {
        id: saved.id,
        date: saved.date.toISOString(),
        summary: saved.summary,
        adjustNote: saved.adjustNote,
        tasks: saved.tasks ?? [],
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString()
      }
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "生成失败" });
  }
});

server.post("/ai/study-plan/task-breakdown", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = (request.body ?? {}) as { task?: string; context?: string | null };
    const task = body.task?.trim() ?? "";
    if (!task) {
      reply.code(400).send({ error: "缺少任务内容" });
      return;
    }
    const prompt = buildTaskBreakdownPrompt(task, normalizeOptionalText(body.context));
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateAssistAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });
    const parsed = extractJsonPayload(result.answer) as
      | { subtasks?: string[] }
      | null;
    const subtasks = Array.isArray(parsed?.subtasks)
      ? parsed?.subtasks.filter((item) => typeof item === "string")
      : [];
    reply.send({
      subtasks,
      raw: result.answer,
      model: result.model
    });
  } catch (error) {
    reply
      .code(400)
      .send({ error: error instanceof Error ? error.message : "拆解失败" });
  }
});

server.post("/ai/study-plan", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = (request.body ?? {}) as {
      weeklyStudyHours?: number | string | null;
      dailyStudyHours?: number | string | null;
      timeSlots?: string[] | null;
      timeNote?: string | null;
      focusGoal?: string | null;
      progressUpdate?: string | null;
      followUpAnswers?: string | null;
      continueFromId?: string | null;
    };
    const profile = await prisma.studyPlanProfile.findUnique({
      where: { userId: session.user.id }
    });
    const mockReports = await prisma.mockExamReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3
    });
    const preferences = {
      weeklyStudyHours: parseOptionalNumber(body.weeklyStudyHours) ?? null,
      dailyStudyHours: parseOptionalNumber(body.dailyStudyHours) ?? null,
      timeSlots: Array.isArray(body.timeSlots)
        ? body.timeSlots.filter((item) => typeof item === "string")
        : [],
      timeNote: normalizeOptionalText(body.timeNote) ?? null,
      focusGoal: normalizeOptionalText(body.focusGoal) ?? null
    };
    const progressUpdate = normalizeOptionalText(body.progressUpdate) ?? null;
    const followUpAnswers = normalizeOptionalText(body.followUpAnswers) ?? null;
    const continueFromId =
      typeof body.continueFromId === "string" ? body.continueFromId.trim() : "";
    let historyRecords = [] as Array<{
      id: string;
      summary: string | null;
      planData: unknown;
      createdAt: Date;
      progressUpdate: string | null;
      followUpAnswers: string | null;
    }>;
    if (continueFromId) {
      const record = await prisma.studyPlanHistory.findFirst({
        where: { id: continueFromId, userId: session.user.id }
      });
      if (record) {
        historyRecords = [record];
      }
    }
    if (!historyRecords.length) {
      historyRecords = await prisma.studyPlanHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 2
      });
    }
    const { start: weekStart, end: weekEnd, labels: weekLabels } = getWeekRange();
    const weeklyDailyTasks = await prisma.studyPlanDailyTask.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: weekStart,
          lt: weekEnd
        }
      },
      orderBy: { date: "asc" }
    });
    const weeklyTaskProgress = formatWeeklyTaskProgress(
      weeklyDailyTasks.map((record) => ({
        date: record.date,
        tasks: record.tasks
      })),
      weekLabels
    );
    const prompt = buildStudyPlanPrompt({
      profile: profile
        ? {
            prepStartDate: profile.prepStartDate,
            totalStudyHours: profile.totalStudyHours,
            totalStudyDurationText: profile.totalStudyDurationText,
            currentProgress: profile.currentProgress,
            targetExam: profile.targetExam,
            targetExamDate: profile.targetExamDate,
            plannedMaterials: profile.plannedMaterials,
            interviewExperience: profile.interviewExperience,
            learningGoals: profile.learningGoals,
            notes: profile.notes
          }
        : null,
      preferences,
      mockReports: mockReports.map((record) => ({
        title: record.title,
        createdAt: record.createdAt,
        overallAccuracy: record.overallAccuracy,
        timeTotalMinutes: record.timeTotalMinutes,
        metrics: normalizeMockMetrics(record.metrics)
      })),
      planHistory: historyRecords.map((record) => {
        const planData = record.planData as Record<string, unknown> | null;
        const weeklyPlan = Array.isArray(planData?.weeklyPlan)
          ? (planData?.weeklyPlan as string[])
          : [];
        const dailyPlan = Array.isArray(planData?.dailyPlan)
          ? (planData?.dailyPlan as string[])
          : [];
        const longTermPlan = Array.isArray(planData?.longTermPlan)
          ? (planData?.longTermPlan as string[])
          : [];
        const followUpQuestions = Array.isArray(planData?.followUpQuestions)
          ? (planData?.followUpQuestions as string[])
          : [];
        return {
          date: record.createdAt,
          summary: record.summary,
          longTermPlan,
          weeklyPlan,
          dailyPlan,
          followUpQuestions,
          progressUpdate: record.progressUpdate,
          followUpAnswers: record.followUpAnswers
        };
      }),
      weeklyTaskProgress,
      progressUpdate,
      followUpAnswers,
      now: new Date()
    });
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    const result = await generateAssistAnswer({
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });

    const parsed = extractJsonPayload(result.answer) as
      | {
          summary?: string;
          longTermPlan?: string[];
          weeklyPlan?: string[];
          dailyPlan?: string[];
          focusAreas?: string[];
          materials?: string[];
          milestones?: string[];
          riskTips?: string[];
          followUpQuestions?: string[];
        }
      | null;

    const responsePayload = parsed
      ? {
          summary: typeof parsed.summary === "string" ? parsed.summary : "",
          longTermPlan: Array.isArray(parsed.longTermPlan) ? parsed.longTermPlan : [],
          weeklyPlan: Array.isArray(parsed.weeklyPlan) ? parsed.weeklyPlan : [],
          dailyPlan: Array.isArray(parsed.dailyPlan) ? parsed.dailyPlan : [],
          focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [],
          materials: Array.isArray(parsed.materials) ? parsed.materials : [],
          milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
          riskTips: Array.isArray(parsed.riskTips) ? parsed.riskTips : [],
          followUpQuestions: Array.isArray(parsed.followUpQuestions)
            ? parsed.followUpQuestions
            : [],
          model: result.model,
          raw: result.answer
        }
      : {
          model: result.model,
          raw: result.answer
        };

    const createdHistory = await prisma.studyPlanHistory.create({
      data: {
        userId: session.user.id,
        summary:
          parsed && typeof parsed.summary === "string" ? parsed.summary : null,
        progressUpdate,
        followUpAnswers,
        profileSnapshot: profile
          ? {
              prepStartDate: profile.prepStartDate,
              totalStudyHours: profile.totalStudyHours,
              totalStudyDurationText: profile.totalStudyDurationText,
              currentProgress: profile.currentProgress,
              targetExam: profile.targetExam,
              targetExamDate: profile.targetExamDate,
              plannedMaterials: profile.plannedMaterials,
              interviewExperience: profile.interviewExperience,
              learningGoals: profile.learningGoals,
              notes: profile.notes
            }
          : undefined,
        preferences,
        planData: parsed ?? undefined,
        planRaw: result.answer
      }
    });

    reply.send({
      ...responsePayload,
      historyId: createdHistory.id,
      meta: {
        mockReportsUsed: mockReports.length,
        profileUpdatedAt: profile?.updatedAt.toISOString() ?? null
      }
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "生成失败"
    });
  }
});

server.post("/ai/mock/analysis", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const body = request.body as {
      images?: string[];
      metrics?: Array<{
        subject?: string;
        correct?: number;
        total?: number;
        timeMinutes?: number;
      }>;
      history?: Array<{
        date?: string;
        metrics?: Array<{
          subject?: string;
          correct?: number;
          total?: number;
          timeMinutes?: number;
        }>;
        overallAccuracy?: number;
        timeTotalMinutes?: number;
      }>;
      title?: string;
      note?: string;
    };
    const images = Array.isArray(body.images)
      ? body.images.filter((item) => typeof item === "string")
      : [];
    if (!images.length && (!body.metrics || !body.metrics.length)) {
      reply.code(400).send({ error: "请上传图片或填写手动数据" });
      return;
    }
    const metricsInput = normalizeMockMetrics(body.metrics ?? []).map((metric) => ({
      subject: metric.subject,
      correct: metric.correct ?? undefined,
      total: metric.total ?? undefined,
      timeMinutes: metric.timeMinutes ?? undefined
    }));
    const historyInput = Array.isArray(body.history)
      ? body.history.map((item) => {
          const metrics = normalizeMockMetrics(item.metrics ?? []).map((metric) => ({
            subject: metric.subject,
            correct: metric.correct ?? undefined,
            total: metric.total ?? undefined,
            timeMinutes: metric.timeMinutes ?? undefined
          }));
          return {
            date: typeof item.date === "string" ? item.date : undefined,
            overallAccuracy:
              typeof item.overallAccuracy === "number" ? item.overallAccuracy : undefined,
            timeTotalMinutes:
              typeof item.timeTotalMinutes === "number" ? item.timeTotalMinutes : undefined,
            metrics: metrics.length ? metrics : undefined
          };
        })
      : [];
    const prompt = buildMockAnalysisPrompt({
      title: body.title,
      metrics: metricsInput,
      note: body.note ?? null,
      history: historyInput
    });
    const aiConfig = resolveAiConfig(session.user);
    await consumeFreeAiUsage(session.user.id, aiConfig);
    let result: { answer: string; model: string | null };
    if (images.length) {
      const provider = aiConfig.provider.toLowerCase();
      if (provider !== "openai" && provider !== "custom") {
        reply.code(400).send({ error: "当前 AI 提供商暂不支持多模态识别" });
        return;
      }
      result = await generateVisionAnswer({
        provider: aiConfig.provider,
        baseUrl: aiConfig.baseUrl,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        messages: [
          { role: "system", content: prompt.system },
          {
            role: "user",
            content: [
              { type: "text", text: prompt.user },
              ...images.map((url) => ({
                type: "image_url" as const,
                image_url: { url }
              }))
            ]
          }
        ]
      });
    } else {
      result = await generateAssistAnswer({
        provider: aiConfig.provider,
        baseUrl: aiConfig.baseUrl,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user }
        ]
      });
    }

    const parsed = extractJsonPayload(result.answer) as
      | {
          summary?: string;
          details?: string[];
          speedFocus?: string[];
          practiceFocus?: string[];
          targets?: string[];
          nextWeekPlan?: string[];
          metrics?: unknown;
          overall?: { accuracy?: number; timeTotalMinutes?: number };
        }
      | null;

    const normalizedMetrics = parsed ? normalizeMockMetrics(parsed.metrics) : [];
    const fallbackMetrics = normalizeMockMetrics(body.metrics ?? []);
    const metrics = normalizedMetrics.length ? normalizedMetrics : fallbackMetrics;
    const summary = summarizeMockMetrics(metrics);
    const responsePayload = parsed
      ? {
          summary: typeof parsed.summary === "string" ? parsed.summary : "",
          details: Array.isArray(parsed.details) ? parsed.details : [],
          speedFocus: Array.isArray(parsed.speedFocus) ? parsed.speedFocus : [],
          practiceFocus: Array.isArray(parsed.practiceFocus)
            ? parsed.practiceFocus
            : [],
          targets: Array.isArray(parsed.targets) ? parsed.targets : [],
          nextWeekPlan: Array.isArray(parsed.nextWeekPlan) ? parsed.nextWeekPlan : [],
          metrics,
          overall: {
            accuracy:
              typeof parsed.overall?.accuracy === "number"
                ? parsed.overall.accuracy
                : summary.accuracy,
            timeTotalMinutes:
              typeof parsed.overall?.timeTotalMinutes === "number"
                ? parsed.overall.timeTotalMinutes
                : summary.timeTotalMinutes
          },
          model: result.model,
          raw: result.answer
        }
      : {
          metrics,
          overall: summary,
          model: result.model,
          raw: result.answer
        };
    const analysisPayload = parsed ? (parsed as Prisma.InputJsonValue) : undefined;

    const created = await prisma.mockExamReport.create({
      data: {
        userId: session.user.id,
        title: body.title?.trim() || null,
        note: body.note?.trim() || null,
        metrics,
        analysis: analysisPayload,
        analysisRaw: result.answer,
        overallAccuracy:
          typeof responsePayload.overall?.accuracy === "number"
            ? responsePayload.overall.accuracy
            : null,
        timeTotalMinutes:
          typeof responsePayload.overall?.timeTotalMinutes === "number"
            ? responsePayload.overall.timeTotalMinutes
            : null
      }
    });

    reply.send({
      ...responsePayload,
      historyId: created.id
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "解析失败"
    });
  }
});

server.get("/mock/reports", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { limit } = request.query as { limit?: string };
    const take = Math.min(Math.max(Number(limit) || 30, 1), 50);
    const records = await prisma.mockExamReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take
    });
    reply.send({
      history: records.map((record) => ({
        id: record.id,
        title: record.title ?? "模考成绩解读",
        note: record.note,
        metrics: record.metrics ?? [],
        analysis: record.analysis,
        analysisRaw: record.analysisRaw,
        overallAccuracy: record.overallAccuracy,
        timeTotalMinutes: record.timeTotalMinutes,
        createdAt: record.createdAt.toISOString()
      }))
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "获取失败"
    });
  }
});

server.delete("/mock/reports/:id", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少记录 ID" });
      return;
    }
    const record = await prisma.mockExamReport.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!record) {
      reply.code(404).send({ error: "记录不存在" });
      return;
    }
    await prisma.mockExamReport.delete({ where: { id } });
    reply.send({ ok: true });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "删除失败"
    });
  }
});

server.get("/ai/chat/history", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { mode } = request.query as { mode?: string };
    const chatMode = normalizeChatMode(mode);
    await trimChatHistory(session.user.id, chatMode);
    const historyWhere: {
      userId: string;
      mode: ChatMode;
      createdAt?: { gte: Date };
    } = { userId: session.user.id, mode: chatMode };
    if (chatMode === "tutor") {
      historyWhere.createdAt = { gte: getTutorContextCutoff() };
    }
    const records = (await aiChatMessageDelegate.findMany({
      where: historyWhere,
      orderBy: { createdAt: "asc" },
      take: CHAT_HISTORY_LIMIT
    })) as ChatMessageRecord[];
    reply.send({
      messages: records.map(formatChatRecord)
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.get("/ai/assist/history", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
    const { limit } = request.query as { limit?: string };
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const records = await prisma.aiAssistHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take
    });
    reply.send({
      history: records.map((record) => ({
        id: record.id,
        scenarioId: record.scenarioId,
        question: record.question,
        answer: record.answer,
        model: record.model,
        createdAt: record.createdAt.toISOString()
      }))
    });
  } catch (error) {
    reply.code(400).send({ error: error instanceof Error ? error.message : "获取失败" });
  }
});

server.listen({ port, host: "0.0.0.0" }).catch((err) => {
  server.log.error(err);
  process.exit(1);
});
