import crypto from "crypto";
import { challengeQuestionBank } from "./challenge-bank";

const optionLabels = ["A", "B", "C", "D"] as const;

const challenges = new Map<
  string,
  {
    answer: string;
    expiresAt: number;
  }
>();

function randomId() {
  return crypto.randomBytes(12).toString("hex");
}

export function createChallenge() {
  const question =
    challengeQuestionBank[Math.floor(Math.random() * challengeQuestionBank.length)];
  const id = randomId();
  challenges.set(id, {
    answer: question.answer,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  return {
    id,
    question: question.question,
    options: question.options.map((text, index) => ({
      label: optionLabels[index],
      text
    }))
  };
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
  const normalized = input.trim().toUpperCase();
  const ok = normalized === item.answer;
  if (ok) {
    challenges.delete(id);
  }
  return ok;
}
