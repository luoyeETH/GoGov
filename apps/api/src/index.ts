import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { getAIProvider, getAIProviderId, listAIProviders } from "./ai";
import {
  generateQuickBatch,
  generateQuickQuestion,
  listQuickCategories
} from "./practice/quick";

const server = Fastify({ logger: true });
const port = Number(process.env.API_PORT ?? 3031);

server.register(cors, { origin: true });

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
