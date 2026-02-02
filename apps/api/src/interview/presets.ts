import { InterviewType } from "@prisma/client";
import presetData from "./presets.json";

const QUESTIONS_BY_DIFFICULTY = presetData.questions as Record<string, string[]>;
const QUESTIONS_BY_TYPE = (presetData as {
  questionsByType?: Record<string, string[]>;
}).questionsByType;
const INTRO_SCRIPTS = presetData.intro as Record<string, string>;

export function getPresetQuestions(type: InterviewType, difficulty: number): string[] {
  if (QUESTIONS_BY_TYPE?.[type]?.length) {
    return QUESTIONS_BY_TYPE[type] ?? [];
  }
  const key = String(difficulty);
  return QUESTIONS_BY_DIFFICULTY[key] ?? [];
}

export function pickPresetQuestion(
  questions: string[],
  usedQuestions: string[]
): string | null {
  if (!questions.length) {
    return null;
  }
  const used = new Set(usedQuestions);
  const available = questions.filter((question) => !used.has(question));
  if (!available.length) {
    return null;
  }
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

export function getIntroScript(minutes?: number | null): string {
  if (minutes) {
    const keyed = INTRO_SCRIPTS[String(minutes)];
    if (keyed) {
      return keyed;
    }
  }
  return INTRO_SCRIPTS.default ?? "";
}
