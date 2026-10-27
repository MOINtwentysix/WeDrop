import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { dropSchema, dropPolicy } from "@/lib/policy";
import { body, handle, json } from "@/lib/http";
import {
  session,
  sameOrigin,
  hashPassword,
  limit,
  HttpError,
} from "@/lib/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    await limit(request, "create", 30);
    const user = await session();
    const input = dropSchema.parse(await body(request));
    let policy;
    try {
      policy = dropPolicy(input.content, input.expiration, !!user);
    } catch (error) {
      throw new HttpError(400, (error as Error).message);
    }
    const id = nanoid();
    const hash = input.password ? await hashPassword(input.password) : null;
    const remainingViews = input.maxViews ?? (policy.burn ? 1 : null);
    const rows =
      await db()`INSERT INTO drops(id, user_id, content, password_hash, burn_after_reading, remaining_views, expires_at) VALUES (${id}, ${user?.id ?? null}, ${input.content}, ${hash}, ${remainingViews === 1}, ${remainingViews}, NOW() + ${policy.seconds} * INTERVAL '1 second') RETURNING id, expires_at, burn_after_reading, remaining_views`;
    return json(rows[0], 201);
  });
}
export async function GET(request: Request) {
  return handle(async () => {
    const user = await session();
    if (!user) throw new HttpError(401, "Sign in to see your drops.");
    const cursor = new URL(request.url).searchParams.get("before");
    if (cursor && !Number.isFinite(Date.parse(cursor)))
      throw new HttpError(400, "Invalid cursor.");
    const rows =
      await db()`SELECT id, created_at, expires_at, burn_after_reading, remaining_views, (password_hash IS NOT NULL) AS protected FROM drops WHERE user_id = ${user.id} AND expires_at > NOW() AND (${cursor}::timestamptz IS NULL OR created_at < ${cursor}::timestamptz) ORDER BY created_at DESC LIMIT 51`;
    return json({
      drops: rows.slice(0, 50),
      next: rows.length > 50 ? rows[49].created_at : null,
    });
  });
}
