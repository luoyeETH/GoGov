import crypto from "crypto";
import { prisma } from "../db";

const defaultTTL = 7;
const defaultRefreshWindowDays = 1;
const dayMs = 24 * 60 * 60 * 1000;

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

function getSessionRefreshWindow(ttlDays: number) {
  const raw = Number(
    process.env.SESSION_REFRESH_WINDOW_DAYS ?? defaultRefreshWindowDays
  );
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(raw, ttlDays);
  }
  return Math.min(defaultRefreshWindowDays, ttlDays);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + getSessionTTL() * dayMs);
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
  const now = Date.now();
  if (session.expiresAt.getTime() < now) {
    throw new Error("会话已过期");
  }
  const ttlDays = getSessionTTL();
  const refreshWindowDays = getSessionRefreshWindow(ttlDays);
  const remainingMs = session.expiresAt.getTime() - now;
  if (remainingMs <= refreshWindowDays * dayMs) {
    const nextExpiresAt = new Date(now + ttlDays * dayMs);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: nextExpiresAt }
    });
    session.expiresAt = nextExpiresAt;
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

export async function revokeOtherSessions(userId: string, currentToken: string) {
  const tokenHash = hashToken(currentToken);
  await prisma.session.updateMany({
    where: {
      userId,
      tokenHash: { not: tokenHash },
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
}
