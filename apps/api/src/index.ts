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
import { buildKlinePrompt } from "./ai/kline";
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

// Prisma client needs regeneration after schema changes; keep delegate typed loosely here.
const klineReportDelegate = (prisma as unknown as { klineReport: any }).klineReport;

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

function getBeijingDateString(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  const year = beijing.getFullYear();
  const month = `${beijing.getMonth() + 1}`.padStart(2, "0");
  const day = `${beijing.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayRange(dateValue?: string | null) {
  const date = parseOptionalDate(dateValue ?? null);
  const base = date ?? parseOptionalDate(getBeijingDateString()) ?? new Date();
  const start = base instanceof Date ? base : new Date();
  const end = new Date(start.getTime());
  end.setDate(start.getDate() + 1);
  return { start, end };
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
  await prisma.$transaction(async (tx) => {
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
    try {
      await tx.freeAiUsage.create({
        data: { userId, date: start, count: 1 }
      });
      return;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
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
      }
      throw new Error("免费 AI 今日额度已用完，请在个人资料配置自己的 AI 继续使用。");
    }
  });
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
          username: { type: "string", minLength: 3, maxLength: 30 },
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
    };
    if (!Array.isArray(body.bazi) || body.bazi.length !== 4) {
      reply.code(400).send({ error: "缺少有效的八字信息" });
      return;
    }
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
      interviewCount: normalizeOptionalText(body.interviewCount) ?? null
    };
    const prompt = buildKlinePrompt(normalized);
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
          chartPoints?: Array<{ age?: number }>;
        }
      | null;
    if (!parsed || Array.isArray(parsed)) {
      reply.send({
        analysis: null,
        raw: result.answer,
        model: result.model,
        warning: "AI 返回格式异常"
      });
      return;
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
      dayunSequence: normalized.dayunSequence,
      dayunStartAge: normalized.dayunStartAge,
      dayunDirection: normalized.dayunDirection,
      trueSolarTime: normalized.trueSolarTime,
      lunarDate: normalized.lunarDate
    };
    const report = (await klineReportDelegate.create({
      data: {
        userId: session.user.id,
        bazi: normalized.bazi,
        input: inputPayload,
        analysis: parsed,
        raw: result.answer,
        model: result.model,
        warning
      }
    })) as KlineReportRecord;
    reply.send({
      id: report.id,
      createdAt: report.createdAt.toISOString(),
      analysis: parsed,
      raw: result.answer,
      model: result.model,
      warning
    });
  } catch (error) {
    reply.code(400).send({
      error: error instanceof Error ? error.message : "测算失败"
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
        : null
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
