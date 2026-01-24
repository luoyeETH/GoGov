import { prisma } from "../db";

function isValidUsername(username: string) {
  const trimmed = username.trim();
  if (/\s/.test(trimmed)) {
    return false;
  }
  return trimmed.length >= 2 && trimmed.length <= 10;
}

function normalizeGender(gender?: string) {
  if (!gender) {
    return undefined;
  }
  const value = gender.toLowerCase();
  if (value === "male" || value === "female" || value === "hidden") {
    return value;
  }
  return undefined;
}

export async function updateProfile(userId: string, params: {
  username?: string;
  gender?: string;
  age?: number;
  examStartDate?: string;
  aiProvider?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  reminderHour?: number;
  reminderMinute?: number;
}) {
  let username: string | undefined;
  if (params.username !== undefined) {
    const trimmed = params.username.trim();
    if (!isValidUsername(trimmed)) {
      throw new Error("用户名需为 2-10 位字符");
    }
    const existing = await prisma.user.findUnique({
      where: { username: trimmed }
    });
    if (existing && existing.id !== userId) {
      throw new Error("用户名已被占用");
    }
    username = trimmed;
  }

  const gender = normalizeGender(params.gender);

  const age = params.age;
  if (age !== undefined && (age < 0 || age > 120)) {
    throw new Error("年龄不合法");
  }

  const examStartDate = params.examStartDate
    ? new Date(params.examStartDate)
    : undefined;
  if (examStartDate && Number.isNaN(examStartDate.getTime())) {
    throw new Error("备考开始时间不合法");
  }

  const provider = params.aiProvider?.trim().toLowerCase();
  if (provider && !["openai", "anthropic", "custom", "none"].includes(provider)) {
    throw new Error("AI 提供商不合法");
  }
  const aiModel = params.aiModel?.trim();
  const aiBaseUrl = params.aiBaseUrl?.trim();
  let aiApiKey: string | null | undefined;
  if (params.aiApiKey !== undefined) {
    const trimmed = params.aiApiKey.trim();
    aiApiKey = trimmed.length > 0 ? trimmed : null;
  }

  const reminderHour = params.reminderHour;
  if (reminderHour !== undefined && (reminderHour < 0 || reminderHour > 23)) {
    throw new Error("提醒小时不合法");
  }

  const reminderMinute = params.reminderMinute;
  if (reminderMinute !== undefined && (reminderMinute < 0 || reminderMinute > 59)) {
    throw new Error("提醒分钟不合法");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      username,
      gender,
      age: age ?? undefined,
      examStartDate: examStartDate ?? undefined,
      aiProvider: provider ?? undefined,
      aiModel: aiModel ?? undefined,
      aiBaseUrl: aiBaseUrl ?? undefined,
      aiApiKey: aiApiKey,
      reminderHour: reminderHour ?? undefined,
      reminderMinute: reminderMinute ?? undefined
    }
  });

  return user;
}
