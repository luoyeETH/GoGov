import { prisma } from "../db";
import { hashPassword, verifyPassword } from "./password";

export async function changePassword(params: {
  userId: string;
  oldPassword: string;
  newPassword: string;
}) {
  const { userId, oldPassword, newPassword } = params;
  if (!newPassword || newPassword.length < 8) {
    throw new Error("新密码至少 8 位");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw new Error("该账号未设置密码");
  }

  const ok = await verifyPassword(oldPassword, user.passwordHash);
  if (!ok) {
    throw new Error("原始密码不正确");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  return { status: "ok" };
}
