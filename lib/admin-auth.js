import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "ulavan_admin_session";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "ulavan_admin_secret_key_2026_secured";

/**
 * Encrypts/signs a session payload into an auth token.
 */
function signToken(payload) {
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
  return Buffer.from(`${data}.${hmac}`).toString("base64url");
}

/**
 * Decodes and verifies a session token.
 */
function verifyToken(token) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = raw.lastIndexOf(".");
    if (lastDot === -1) return null;

    const data = raw.slice(0, lastDot);
    const signature = raw.slice(lastDot + 1);

    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Compare plain password against stored bcrypt hash
 */
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Set HTTP-only admin session cookie in Next.js
 */
export function setAdminSession(admin) {
  const sessionData = {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    issuedAt: Date.now(),
  };

  const token = signToken(sessionData);

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Get current admin session from request cookies
 */
export function getAdminSession() {
  const cookie = cookies().get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

/**
 * Clear admin session cookie
 */
export function clearAdminSession() {
  cookies().set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

