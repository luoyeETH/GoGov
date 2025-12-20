import crypto from "crypto";
import { prisma } from "../db";

const defaultTTL = 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getSessionTTL() {
  const raw = Number(process.env.SESSION_TTL_DAYS ?? defaultTTL);
  if (Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return defaultTTL;
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + getSessionTTL() * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });
  return { token, expiresAt };
}

export async function verifySession(token: string) {
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });
  if (!session) {
    throw new Error("无效会话");
  }
  if (session.revokedAt) {
    throw new Error("会话已失效");
  }
  if (session.expiresAt.getTime() < Date.now()) {
    throw new Error("会话已过期");
  }
  return session;
}

export async function revokeSession(token: string) {
  const tokenHash = hashToken(token);
  await prisma.session.update({
    where: { tokenHash },
    data: { revokedAt: new Date() }
  });
}
