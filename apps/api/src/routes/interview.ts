import type { FastifyInstance } from "fastify";
import type { IncomingHttpHeaders } from "http";
import { InterviewType, InterviewStatus } from "@prisma/client";
import { prisma } from "../db";
import { verifySession } from "../auth/session";
import {
  generateInterviewQuestion,
  analyzeInterviewAnswer,
} from "../ai/interview";

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

const DEFAULT_TOTAL_QUESTIONS = 5;

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

    // Generate the first question
    let questionText: string;
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
        analysisJson: analysis,
        metrics: analysis.metrics ?? null,
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

      // Generate next question
      let nextQuestionText: string;
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
