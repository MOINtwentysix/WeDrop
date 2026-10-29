import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const scrypt = promisify(scryptCallback);

export function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  return value;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hex] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hex) return false;
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return expected.length === hash.length && timingSafeEqual(hash, expected);
}

export async function setSession(id: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuer("wedrop")
    .setAudience("wedrop")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret()));
  (await cookies()).set("wedrop_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}

export async function session() {
  const token = (await cookies()).get("wedrop_session")?.value;
  if (!token) return null;
  let id: string | undefined;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret()),
      { algorithms: ["HS256"], issuer: "wedrop", audience: "wedrop" },
    );
    id = payload.sub;
  } catch {
    return null;
  }
  if (!id) return null;
  const rows = await db()`SELECT id, email, username FROM users WHERE id = ${id}`;
  return (rows[0] as { id: string; email: string; username: string | null } | undefined) ?? null;
}

export function sameOrigin(request: Request) {
  const expected = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url)
    .origin;
  if (request.headers.get("origin") !== expected)
    throw new HttpError(403, "This request is not allowed.");
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function limit(
  request: Request,
  scope: string,
  max: number,
  window = 600,
) {
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const key = createHmac("sha256", secret())
    .update(`${scope}:${ip}`)
    .digest("hex");
  const rows =
    await db()`INSERT INTO rate_limits(key, count, expires_at) VALUES (${key}, 1, NOW() + ${window} * INTERVAL '1 second') ON CONFLICT (key) DO UPDATE SET count = CASE WHEN rate_limits.expires_at <= NOW() THEN 1 ELSE rate_limits.count + 1 END, expires_at = CASE WHEN rate_limits.expires_at <= NOW() THEN NOW() + ${window} * INTERVAL '1 second' ELSE rate_limits.expires_at END RETURNING count`;
  if (rows[0].count > max)
    throw new HttpError(429, "Too many requests. Please try again later.");
}
