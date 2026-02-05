import type { FastifyInstance } from "fastify";
import type { IncomingHttpHeaders } from "http";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { InterviewType, InterviewStatus } from "@prisma/client";
import { prisma } from "../db";
import { verifySession } from "../auth/session";
import {
  generateInterviewQuestion,
  analyzeInterviewAnswer,
} from "../ai/interview";
import {
  getIntroScript,
  getPresetQuestions,
  pickPresetQuestion,
} from "../interview/presets";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getTokenFromRequest(request: { headers: IncomingHttpHeaders }) {
  const raw = request.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

type ResolvedAiConfig = {
  provider: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string | null;
};

type InterviewTtsConfig = {
  apiUrl: string | null;
  apiKey: string;
  speaker: string;
  speed: number;
};

function resolveAiConfig(user: {
  aiProvider?: string | null;
  aiBaseUrl?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
}): ResolvedAiConfig {
  const provider = (user.aiProvider?.trim() || "openai").toLowerCase();
  return {
    provider,
    baseUrl: user.aiBaseUrl ?? null,
    apiKey: user.aiApiKey ?? null,
    model: user.aiModel ?? null,
  };
}

const DEFAULT_TTS_SPEAKER = "中文女";
const DEFAULT_TTS_SPEED = 1.0;
const TTS_CACHE_DIR = path.resolve(process.cwd(), "tts-cache");
const TTS_CACHE_EXT = "wav";

function normalizeTtsUrl(value?: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) {
    return null;
  }
  if (trimmed.endsWith("/synthesize")) {
    return trimmed;
  }
  return `${trimmed}/synthesize`;
}

function clampTtsSpeed(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_TTS_SPEED;
  }
  return Math.min(2, Math.max(0.5, value));
}

function resolveInterviewTtsConfig(): InterviewTtsConfig {
  const apiUrl = normalizeTtsUrl(
    process.env.INTERVIEW_TTS_API_URL ?? process.env.INTERVIEW_TTS_BASE_URL
  );
  const apiKey = process.env.INTERVIEW_TTS_API_KEY?.trim() ?? "";
  const speaker = process.env.INTERVIEW_TTS_SPEAKER?.trim() || DEFAULT_TTS_SPEAKER;
  const rawSpeed = Number.parseFloat(process.env.INTERVIEW_TTS_SPEED ?? "");
  const speed = clampTtsSpeed(Number.isFinite(rawSpeed) ? rawSpeed : DEFAULT_TTS_SPEED);
  return {
    apiUrl,
    apiKey,
    speaker,
    speed,
  };
}

const DEFAULT_TOTAL_QUESTIONS = 5;
const TTS_AUDIO_CONTENT_TYPE = "audio/wav";

function normalizeTtsText(text: string) {
  return text.trim();
}

function buildTtsCacheKey(text: string, speaker: string, speed: number) {
  const normalizedSpeed = Number.isFinite(speed) ? speed.toFixed(2) : DEFAULT_TTS_SPEED.toFixed(2);
  return createHash("sha1")
    .update(`${speaker}|${normalizedSpeed}|${text}`)
    .digest("hex");
}

function getTtsCachePath(cacheKey: string) {
  return path.join(TTS_CACHE_DIR, `${cacheKey}.${TTS_CACHE_EXT}`);
}

async function ensureTtsCacheDir() {
  await fs.promises.mkdir(TTS_CACHE_DIR, { recursive: true });
}

async function getCachedTtsPath(text: string, speaker: string, speed: number) {
  const cacheKey = buildTtsCacheKey(text, speaker, speed);
  const cachePath = getTtsCachePath(cacheKey);
  try {
    await fs.promises.access(cachePath, fs.constants.R_OK);
    return cachePath;
  } catch {
    return null;
  }
}

async function generateAndCacheTts(
  text: string,
  speaker: string,
  speed: number,
  stream: boolean,
  config: InterviewTtsConfig
) {
  const cacheKey = buildTtsCacheKey(text, speaker, speed);
  const cachePath = getTtsCachePath(cacheKey);
  const res = await fetch(config.apiUrl as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, speaker, speed, stream }),
  });
  if (!res.ok) {
    return { ok: false as const, res };
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  try {
    await fs.promises.writeFile(cachePath, buffer);
  } catch {
    // ignore cache write failures
  }
  return { ok: true as const, buffer, cachePath };
}

// ─────────────────────────────────────────────────────────────
// Route Registration
// ─────────────────────────────────────────────────────────────

export async function registerInterviewRoutes(server: FastifyInstance) {
  // ─────────────────────────────────────────────────────────────
  // POST /interview/start
  // Creates a new interview session and generates the first question
  // ─────────────────────────────────────────────────────────────
  server.post("/interview/start", async (request, reply) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }

    let session;
    try {
      session = await verifySession(token);
    } catch {
      reply.code(401).send({ error: "登录已过期，请重新登录" });
      return;
    }

    const body = request.body as {
      type?: InterviewType;
      difficulty?: number;
      title?: string;
      targetRole?: string;
      totalQuestions?: number;
    };

    // Validate type
    const validTypes = Object.values(InterviewType);
    if (!body?.type || !validTypes.includes(body.type)) {
      reply.code(400).send({ error: "无效的面试类型" });
      return;
    }

    // Validate difficulty (1-5)
    const difficulty =
      typeof body.difficulty === "number" &&
      body.difficulty >= 1 &&
      body.difficulty <= 5
        ? body.difficulty
        : 2;

    const totalQuestions =
      typeof body.totalQuestions === "number" && body.totalQuestions > 0
        ? Math.min(body.totalQuestions, 20)
        : DEFAULT_TOTAL_QUESTIONS;

    const aiConfig = resolveAiConfig(session.user);

    // Create the interview session
    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId: session.user.id,
        type: body.type,
        difficulty,
        title: body.title?.trim() || null,
        targetRole: body.targetRole?.trim() || null,
        totalQuestions,
        status: InterviewStatus.in_progress,
      },
    });

    // Generate the first question (prefer preset pool)
    const presetPool = getPresetQuestions(body.type, difficulty);
    let questionText = pickPresetQuestion(presetPool, []);
    if (!questionText) {
      try {
        questionText = await generateInterviewQuestion(
          {
            type: body.type,
            difficulty,
            previousQuestions: [],
          },
          aiConfig
        );
      } catch (err) {
        // Rollback session creation on AI failure
        await prisma.interviewSession.delete({
          where: { id: interviewSession.id },
        });
        reply.code(500).send({
          error: err instanceof Error ? err.message : "生成问题失败，请稍后重试",
        });
        return;
      }
    }
    if (!questionText) {
      await prisma.interviewSession.delete({
        where: { id: interviewSession.id },
      });
      reply.code(500).send({ error: "生成问题失败，请稍后重试" });
      return;
    }

    // Create the first turn
    const turn = await prisma.interviewTurn.create({
      data: {
        sessionId: interviewSession.id,
        turnNumber: 1,
        questionText,
      },
    });

    reply.send({
      session: {
        id: interviewSession.id,
        type: interviewSession.type,
        difficulty: interviewSession.difficulty,
        status: interviewSession.status,
        title: interviewSession.title,
        targetRole: interviewSession.targetRole,
        totalQuestions: interviewSession.totalQuestions,
        startedAt: interviewSession.startedAt.toISOString(),
      },
      turn: {
        id: turn.id,
        turnNumber: turn.turnNumber,
        questionText: turn.questionText,
      },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /interview/answer
  // Submit an answer for the current turn, get analysis + next question
  // ─────────────────────────────────────────────────────────────
  server.post("/interview/answer", async (request, reply) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }

    let authSession;
    try {
      authSession = await verifySession(token);
    } catch {
      reply.code(401).send({ error: "登录已过期，请重新登录" });
      return;
    }

    const body = request.body as {
      sessionId?: string;
      turnId?: string;
      answerText?: string;
    };

    if (!body?.sessionId) {
      reply.code(400).send({ error: "缺少 sessionId" });
      return;
    }
    if (!body?.turnId) {
      reply.code(400).send({ error: "缺少 turnId" });
      return;
    }
    if (!body?.answerText?.trim()) {
      reply.code(400).send({ error: "请输入你的回答" });
      return;
    }

    // Fetch the interview session
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: body.sessionId },
      include: { turns: true },
    });

    if (!interviewSession) {
      reply.code(404).send({ error: "面试会话不存在" });
      return;
    }

    if (interviewSession.userId !== authSession.user.id) {
      reply.code(403).send({ error: "无权访问该面试会话" });
      return;
    }

    if (interviewSession.status !== InterviewStatus.in_progress) {
      reply.code(400).send({ error: "该面试会话已结束" });
      return;
    }

    // Find the turn
    const turn = interviewSession.turns.find((t) => t.id === body.turnId);
    if (!turn) {
      reply.code(404).send({ error: "面试轮次不存在" });
      return;
    }

    if (turn.answerText) {
      reply.code(400).send({ error: "该轮次已提交答案" });
      return;
    }

    const aiConfig = resolveAiConfig(authSession.user);
    const answerText = body.answerText.trim();

    // Analyze the answer
    let analysis: {
      score: number;
      feedback: string;
      suggestedAnswer: string;
      metrics?: Record<string, number>;
    };
    try {
      analysis = await analyzeInterviewAnswer(
        {
          question: turn.questionText,
          answer: answerText,
          type: interviewSession.type,
        },
        aiConfig
      );
    } catch (err) {
      reply.code(500).send({
        error: err instanceof Error ? err.message : "分析回答失败，请稍后重试",
      });
      return;
    }

    // Update the turn with answer and analysis
    await prisma.interviewTurn.update({
      where: { id: turn.id },
      data: {
        answerText,
        score: analysis.score,
        analysis: analysis.feedback,
        analysisJson: analysis as any,
        metrics: (analysis.metrics ?? undefined) as any,
        suggestedAnswer: analysis.suggestedAnswer,
      },
    });

    // Determine if we need to generate another question
    const currentTurnNumber = turn.turnNumber;
    const totalQuestions = interviewSession.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;
    const isSessionComplete = currentTurnNumber >= totalQuestions;

    let nextTurn = null;

    if (!isSessionComplete) {
      // Get all previous questions to avoid repetition
      const previousQuestions = interviewSession.turns.map(
        (t) => t.questionText
      );

      const presetPool = getPresetQuestions(
        interviewSession.type,
        interviewSession.difficulty ?? 2
      );
      let nextQuestionText = pickPresetQuestion(presetPool, previousQuestions);
      if (!nextQuestionText) {
        // Generate next question from AI
        try {
          nextQuestionText = await generateInterviewQuestion(
            {
              type: interviewSession.type,
              difficulty: interviewSession.difficulty ?? 2,
              previousQuestions,
            },
            aiConfig
          );
        } catch (err) {
          // Don't fail the whole request if next question generation fails
          // Session can continue later
          reply.send({
            analysis: {
              score: analysis.score,
              feedback: analysis.feedback,
              suggestedAnswer: analysis.suggestedAnswer,
              metrics: analysis.metrics,
            },
            nextQuestion: null,
            sessionComplete: false,
            error: "生成下一题失败，请稍后继续",
          });
          return;
        }
      }
      if (!nextQuestionText) {
        reply.send({
          analysis: {
            score: analysis.score,
            feedback: analysis.feedback,
            suggestedAnswer: analysis.suggestedAnswer,
            metrics: analysis.metrics,
          },
          nextQuestion: null,
          sessionComplete: false,
          error: "生成下一题失败，请稍后继续",
        });
        return;
      }

      // Create the next turn
      nextTurn = await prisma.interviewTurn.create({
        data: {
          sessionId: interviewSession.id,
          turnNumber: currentTurnNumber + 1,
          questionText: nextQuestionText,
        },
      });
    } else {
      // Session is complete, calculate overall score
      const allTurns = await prisma.interviewTurn.findMany({
        where: { sessionId: interviewSession.id },
        select: { score: true },
      });

      const scores = allTurns
        .map((t) => t.score)
        .filter((s): s is number => s !== null);
      const overallScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;

      const endedAt = new Date();
      const durationSeconds = Math.round(
        (endedAt.getTime() - interviewSession.startedAt.getTime()) / 1000
      );

      await prisma.interviewSession.update({
        where: { id: interviewSession.id },
        data: {
          status: InterviewStatus.completed,
          overallScore,
          endedAt,
          durationSeconds,
        },
      });
    }

    reply.send({
      analysis: {
        score: analysis.score,
        feedback: analysis.feedback,
        suggestedAnswer: analysis.suggestedAnswer,
        metrics: analysis.metrics,
      },
      nextQuestion: nextTurn
        ? {
            id: nextTurn.id,
            turnNumber: nextTurn.turnNumber,
            questionText: nextTurn.questionText,
          }
        : null,
      sessionComplete: isSessionComplete,
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /interview/tts
  // Generate interview question speech audio via external TTS
  // ─────────────────────────────────────────────────────────────
  server.post(
    "/interview/tts",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
          keyGenerator: (request) => {
            const token = getTokenFromRequest(request);
            return token ? `token:${token}` : request.ip;
          },
        },
      },
    },
    async (request, reply) => {
      const token = getTokenFromRequest(request);
      if (!token) {
        reply.code(401).send({ error: "未登录" });
        return;
      }

      try {
        await verifySession(token);
      } catch {
        reply.code(401).send({ error: "登录已过期，请重新登录" });
        return;
      }

      const body = request.body as {
        text?: string;
        speaker?: string;
        speed?: number;
        stream?: boolean;
      };

      const text = typeof body?.text === "string" ? normalizeTtsText(body.text) : "";
      if (!text) {
        reply.code(400).send({ error: "缺少文本内容" });
        return;
      }

      const ttsConfig = resolveInterviewTtsConfig();
      if (!ttsConfig.apiUrl || !ttsConfig.apiKey) {
        reply.code(503).send({ error: "语音服务未配置" });
        return;
      }

      const speaker =
        typeof body?.speaker === "string" && body.speaker.trim()
          ? body.speaker.trim()
          : ttsConfig.speaker;
      const speed = clampTtsSpeed(
        typeof body?.speed === "number" ? body.speed : ttsConfig.speed
      );
      const stream = Boolean(body?.stream);

      await ensureTtsCacheDir();

      const cachedPath = await getCachedTtsPath(text, speaker, speed);
      if (cachedPath) {
        reply.header("Content-Type", TTS_AUDIO_CONTENT_TYPE);
        reply.header("Cache-Control", "private, max-age=86400");
        reply.send(fs.createReadStream(cachedPath));
        return;
      }

      let upstreamResponse: Response;
      try {
        upstreamResponse = await fetch(ttsConfig.apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ttsConfig.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, speaker, speed, stream }),
        });
      } catch (err) {
        reply.code(502).send({ error: "语音服务连接失败" });
        return;
      }

      if (!upstreamResponse.ok) {
        let detail = "";
        const contentType = upstreamResponse.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          try {
            const data = await upstreamResponse.json();
            if (typeof data?.detail === "string") {
              detail = data.detail;
            } else if (typeof data?.error === "string") {
              detail = data.error;
            }
          } catch {
            detail = "";
          }
        } else {
          try {
            detail = await upstreamResponse.text();
          } catch {
            detail = "";
          }
        }
        reply
          .code(upstreamResponse.status)
          .send({ error: detail || "语音合成失败" });
        return;
      }

      const audioBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
      try {
        const cacheKey = buildTtsCacheKey(text, speaker, speed);
        const cachePath = getTtsCachePath(cacheKey);
        await fs.promises.writeFile(cachePath, audioBuffer);
      } catch {
        // ignore cache write failures
      }
      reply.header("Content-Type", TTS_AUDIO_CONTENT_TYPE);
      reply.header("Cache-Control", "private, max-age=86400");
      reply.send(audioBuffer);
    }
  );

  // ─────────────────────────────────────────────────────────────
  // GET /interview/intro
  // Returns fixed intro audio (public)
  // ─────────────────────────────────────────────────────────────
  server.get("/interview/intro", async (request, reply) => {
    const query = request.query as { minutes?: string };
    const minutes = query.minutes ? Number.parseInt(query.minutes, 10) : null;
    const script = getIntroScript(Number.isFinite(minutes as number) ? minutes : null);
    if (!script) {
      reply.code(404).send({ error: "未找到开场白" });
      return;
    }

    const ttsConfig = resolveInterviewTtsConfig();
    if (!ttsConfig.apiUrl || !ttsConfig.apiKey) {
      reply.code(503).send({ error: "语音服务未配置" });
      return;
    }

    await ensureTtsCacheDir();
    const cachedPath = await getCachedTtsPath(script, ttsConfig.speaker, ttsConfig.speed);
    if (cachedPath) {
      reply.header("Content-Type", TTS_AUDIO_CONTENT_TYPE);
      reply.header("Cache-Control", "public, max-age=31536000, immutable");
      reply.send(fs.createReadStream(cachedPath));
      return;
    }

    const result = await generateAndCacheTts(
      script,
      ttsConfig.speaker,
      ttsConfig.speed,
      false,
      ttsConfig
    );
    if (!result.ok) {
      reply.code(502).send({ error: "语音合成失败" });
      return;
    }
    reply.header("Content-Type", TTS_AUDIO_CONTENT_TYPE);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    reply.send(result.buffer);
  });

  // ─────────────────────────────────────────────────────────────
  // GET /interview/history
  // List user's interview sessions
  // ─────────────────────────────────────────────────────────────
  server.get("/interview/history", async (request, reply) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }

    let session;
    try {
      session = await verifySession(token);
    } catch {
      reply.code(401).send({ error: "登录已过期，请重新登录" });
      return;
    }

    const query = request.query as {
      limit?: string;
      offset?: string;
      status?: string;
      type?: string;
    };

    const limit = Math.min(
      Math.max(Number(query.limit) || 20, 1),
      100
    );
    const offset = Math.max(Number(query.offset) || 0, 0);

    const where: {
      userId: string;
      status?: InterviewStatus;
      type?: InterviewType;
    } = { userId: session.user.id };

    // Filter by status
    if (query.status && Object.values(InterviewStatus).includes(query.status as InterviewStatus)) {
      where.status = query.status as InterviewStatus;
    }

    // Filter by type
    if (query.type && Object.values(InterviewType).includes(query.type as InterviewType)) {
      where.type = query.type as InterviewType;
    }

    const [sessions, total] = await Promise.all([
      prisma.interviewSession.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          status: true,
          title: true,
          targetRole: true,
          difficulty: true,
          totalQuestions: true,
          overallScore: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          createdAt: true,
          _count: {
            select: { turns: true },
          },
        },
      }),
      prisma.interviewSession.count({ where }),
    ]);

    reply.send({
      sessions: sessions.map((s) => ({
        id: s.id,
        type: s.type,
        status: s.status,
        title: s.title,
        targetRole: s.targetRole,
        difficulty: s.difficulty,
        totalQuestions: s.totalQuestions,
        completedQuestions: s._count.turns,
        overallScore: s.overallScore,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt?.toISOString() ?? null,
        durationSeconds: s.durationSeconds,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET /interview/:id
  // Get session details with all turns
  // ─────────────────────────────────────────────────────────────
  server.get("/interview/:id", async (request, reply) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }

    let authSession;
    try {
      authSession = await verifySession(token);
    } catch {
      reply.code(401).send({ error: "登录已过期，请重新登录" });
      return;
    }

    const { id } = request.params as { id?: string };
    if (!id) {
      reply.code(400).send({ error: "缺少面试会话 ID" });
      return;
    }

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id },
      include: {
        turns: {
          orderBy: { turnNumber: "asc" },
        },
      },
    });

    if (!interviewSession) {
      reply.code(404).send({ error: "面试会话不存在" });
      return;
    }

    if (interviewSession.userId !== authSession.user.id) {
      reply.code(403).send({ error: "无权访问该面试会话" });
      return;
    }

    reply.send({
      session: {
        id: interviewSession.id,
        type: interviewSession.type,
        status: interviewSession.status,
        title: interviewSession.title,
        targetRole: interviewSession.targetRole,
        difficulty: interviewSession.difficulty,
        totalQuestions: interviewSession.totalQuestions,
        overallScore: interviewSession.overallScore,
        feedback: interviewSession.feedback,
        feedbackJson: interviewSession.feedbackJson,
        startedAt: interviewSession.startedAt.toISOString(),
        endedAt: interviewSession.endedAt?.toISOString() ?? null,
        durationSeconds: interviewSession.durationSeconds,
        createdAt: interviewSession.createdAt.toISOString(),
      },
      turns: interviewSession.turns.map((turn) => ({
        id: turn.id,
        turnNumber: turn.turnNumber,
        questionText: turn.questionText,
        questionContext: turn.questionContext,
        answerText: turn.answerText,
        answerDurationMs: turn.answerDurationMs,
        score: turn.score,
        analysis: turn.analysis,
        analysisJson: turn.analysisJson,
        metrics: turn.metrics,
        suggestedAnswer: turn.suggestedAnswer,
        createdAt: turn.createdAt.toISOString(),
      })),
    });
  });
}
