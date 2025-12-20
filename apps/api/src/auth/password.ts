import bcrypt from "bcryptjs";

const defaultRounds = 12;

function getRounds() {
  const raw = Number(process.env.PASSWORD_SALT_ROUNDS ?? defaultRounds);
  if (Number.isFinite(raw) && raw > 6 && raw < 20) {
    return raw;
  }
  return defaultRounds;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, getRounds());
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
