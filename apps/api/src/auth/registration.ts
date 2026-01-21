import crypto from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "../db";
import { verifyChallenge } from "./challenge";
import { createSession } from "./session";
import { hashPassword, verifyPassword } from "./password";

const tokenTTLMinutes = 20;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  const trimmed = username.trim();
  if (/\s/.test(trimmed)) {
    return false;
  }
  return trimmed.length >= 2 && trimmed.length <= 10;
}

function normalizeGender(gender?: string) {
  if (!gender) {
    return "hidden";
  }
  const value = gender.toLowerCase();
  if (value === "male" || value === "female" || value === "hidden") {
    return value;
  }
  return "hidden";
}

export async function requestEmailVerification(params: {
  email: string;
  challengeId: string;
  answer: string;
}) {
  const email = params.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new Error("邮箱格式不正确");
  }
  const ok = verifyChallenge(params.challengeId, params.answer);
  if (!ok) {
    throw new Error("验证码不正确");
  }

  const existing = await prisma.user.findUnique({
    where: { email }
  });
  if (existing?.passwordHash) {
    throw new Error("邮箱已注册，请直接登录");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + tokenTTLMinutes * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      email,
      tokenHash,
      expiresAt
    }
  });

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3030";
  const from = process.env.EMAIL_FROM ?? "学了么 <no-reply@noreply.519312.xyz>";
  const gmailUser = process.env.GMAIL_USER?.trim() ?? "";
  const gmailPass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");

  const link = `${baseUrl}/register?token=${token}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;">
      <h2>GoGov 注册验证</h2>
      <p>点击下面按钮完成邮箱验证并继续注册：</p>
      <p>
        <a href="${link}" style="display:inline-block;background:#b5522b;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;">
          验证并注册
        </a>
      </p>
      <p>如果按钮无法点击，请复制链接到浏览器：</p>
      <p>${link}</p>
      <p style="color:#6b6b6b;font-size:12px;">该链接 ${tokenTTLMinutes} 分钟内有效。</p>
    </div>
  `;

  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? `学了么 <${gmailUser}>`,
      to: email,
      subject: "GoGov 注册验证",
      html
    });
  } else {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      throw new Error("邮件发送未配置");
    }
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from,
      to: [email],
      subject: "GoGov 注册验证",
      html
    });
  }

  return { status: "sent" };
}

export async function verifyEmailToken(token: string) {
  if (!token || token.length < 10) {
    throw new Error("无效的验证令牌");
  }
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash }
  });
  if (!record) {
    throw new Error("验证令牌不存在");
  }
  if (record.usedAt) {
    throw new Error("验证令牌已使用");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new Error("验证令牌已过期");
  }

  return { email: record.email };
}

export async function completeRegistration(params: {
  token: string;
  username: string;
  password: string;
  gender?: string;
  age?: number;
  examStartDate?: string;
}) {
  const tokenHash = hashToken(params.token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash }
  });
  if (!record) {
    throw new Error("验证令牌不存在");
  }
  if (record.usedAt) {
    throw new Error("验证令牌已使用");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new Error("验证令牌已过期");
  }

  const username = params.username.trim();
  if (!isValidUsername(username)) {
    throw new Error("用户名需为 2-10 位字符");
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username }
  });
  if (existingUsername) {
    throw new Error("用户名已被占用");
  }

  if (params.password.length < 8) {
    throw new Error("密码至少 8 位");
  }

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

  const passwordHash = await hashPassword(params.password);
  const gender = normalizeGender(params.gender);

  const user = await prisma.user.upsert({
    where: { email: record.email },
    update: {
      username,
      passwordHash,
      emailVerifiedAt: new Date(),
      gender,
      age: age ?? null,
      examStartDate: examStartDate ?? null
    },
    create: {
      email: record.email,
      username,
      passwordHash,
      emailVerifiedAt: new Date(),
      gender,
      age: age ?? null,
      examStartDate: examStartDate ?? null
    }
  });

  await prisma.emailVerificationToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() }
  });

  const session = await createSession(user.id);

  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt.toISOString()
  };
}

export async function loginWithPassword(params: {
  email: string;
  password: string;
}) {
  const email = params.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new Error("邮箱或密码错误");
  }
  const ok = await verifyPassword(params.password, user.passwordHash);
  if (!ok) {
    throw new Error("邮箱或密码错误");
  }
  const session = await createSession(user.id);
  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    gender: user.gender,
    age: user.age,
    examStartDate: user.examStartDate?.toISOString() ?? null,
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt.toISOString()
  };
}
