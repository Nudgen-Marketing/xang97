import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "a97_admin_session";
const SESSION_VALUE = "admin";

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export async function verifyAdminPassword(username: string, password: string) {
  if (username !== process.env.ADMIN_USERNAME) {
    return false;
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

export function createSessionToken() {
  const payload = `${SESSION_VALUE}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_VALUE) {
    return false;
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload);
  const actual = parts[2];

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(COOKIE_NAME)?.value)) {
    return false;
  }

  return true;
}
