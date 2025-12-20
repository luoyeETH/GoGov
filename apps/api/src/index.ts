import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { getAIProvider, getAIProviderId, listAIProviders } from "./ai";
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

const server = Fastify({ logger: true });
const port = Number(process.env.API_PORT ?? 3031);

server.register(cors, { origin: true, allowedHeaders: ["Content-Type", "Authorization"] });

function getTokenFromRequest(request: { headers: Record<string, string | undefined> }) {
  const header = request.headers.authorization ?? "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return "";
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

server.get("/auth/email/challenge", async () => {
  return createChallenge();
});

server.post("/auth/email/register/request", async (request, reply) => {
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
});

server.post("/auth/email/register/verify", async (request, reply) => {
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
});

server.post("/auth/register/complete", async (request, reply) => {
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
});

server.post("/auth/login", async (request, reply) => {
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
});

server.get("/auth/wallet/challenge", async (request, reply) => {
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
});

server.post("/auth/wallet/verify", async (request, reply) => {
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
});

server.get("/auth/me", async (request, reply) => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      reply.code(401).send({ error: "未登录" });
      return;
    }
    const session = await verifySession(token);
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
        hasPassword: Boolean(session.user.passwordHash)
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
        hasPassword: Boolean(user.passwordHash)
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

server.post("/auth/logout", async (request, reply) => {
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
});

server.post("/auth/password/update", async (request, reply) => {
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
});

server.post("/ai/assist", async (_request, reply) => {
  const provider = getAIProvider();
  reply.code(501).send({
    error: "NotImplemented",
    provider: provider.descriptor,
    message: "AI 辅助尚未接入，请先配置 AI_PROVIDER。"
  });
});

server.listen({ port, host: "0.0.0.0" }).catch((err) => {
  server.log.error(err);
  process.exit(1);
});
