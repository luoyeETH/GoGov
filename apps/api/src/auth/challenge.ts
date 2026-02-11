import crypto from "crypto";

const challenges = new Map<string, { answer: string; expiresAt: number }>();

function randomId() {
  return crypto.randomBytes(12).toString("hex");
}

export function createChallenge() {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 1;
  const answer = String(left + right);
  const id = randomId();
  challenges.set(id, { answer, expiresAt: Date.now() + 5 * 60 * 1000 });
  return { id, question: `${left} + ${right} = ?` };
}

export function verifyChallenge(id: string, input: string) {
  const item = challenges.get(id);
  if (!item) {
    return false;
  }
  if (Date.now() > item.expiresAt) {
    challenges.delete(id);
    return false;
  }
  const normalized = input.trim();
  const ok = normalized === item.answer;
  if (ok) {
    challenges.delete(id);
  }
  return ok;
}
