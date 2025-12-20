import crypto from "crypto";
import { verifyMessage } from "ethers";

const challenges = new Map<
  string,
  { address: string; message: string; expiresAt: number }
>();

function randomId() {
  return crypto.randomBytes(12).toString("hex");
}

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

export function createWalletChallenge(address: string) {
  const normalized = normalizeAddress(address);
  if (!normalized.startsWith("0x") || normalized.length < 10) {
    throw new Error("钱包地址不合法");
  }
  const nonce = crypto.randomBytes(6).toString("hex");
  const issuedAt = new Date().toISOString();
  const message = [
    "GoGov 登录验证",
    `地址: ${normalized}`,
    `随机码: ${nonce}`,
    `时间: ${issuedAt}`
  ].join("\n");
  const id = randomId();
  challenges.set(id, {
    address: normalized,
    message,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
  return { id, message };
}

export function verifyWalletChallenge(params: {
  id: string;
  address: string;
  signature: string;
}) {
  const entry = challenges.get(params.id);
  if (!entry) {
    throw new Error("登录挑战不存在");
  }
  if (Date.now() > entry.expiresAt) {
    challenges.delete(params.id);
    throw new Error("登录挑战已过期");
  }
  const normalized = normalizeAddress(params.address);
  if (entry.address !== normalized) {
    throw new Error("地址不匹配");
  }
  if (!params.signature) {
    throw new Error("缺少签名");
  }
  const recovered = verifyMessage(entry.message, params.signature);
  if (recovered.toLowerCase() !== normalized) {
    throw new Error("签名验证失败");
  }
  challenges.delete(params.id);
  return normalized;
}
