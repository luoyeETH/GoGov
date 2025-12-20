import { prisma } from "../db";
import { createSession } from "./session";

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

export async function loginWithWallet(address: string) {
  const normalized = normalizeAddress(address);
  if (!normalized.startsWith("0x") || normalized.length < 10) {
    throw new Error("钱包地址不合法");
  }
  const user = await prisma.user.upsert({
    where: { walletAddress: normalized },
    update: {},
    create: { walletAddress: normalized }
  });
  const session = await createSession(user.id);
  return {
    userId: user.id,
    walletAddress: user.walletAddress,
    username: user.username,
    gender: user.gender,
    age: user.age,
    examStartDate: user.examStartDate?.toISOString() ?? null,
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt.toISOString()
  };
}
