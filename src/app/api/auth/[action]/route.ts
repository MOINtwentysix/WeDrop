import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { authSchema } from "@/lib/policy";
import { body, handle, json } from "@/lib/http";
import {
  hashPassword,
  verifyPassword,
  setSession,
  sameOrigin,
  limit,
  HttpError,
  session,
} from "@/lib/security";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ action: string }> },
) {
  return handle(async () => {
    if ((await context.params).action !== "me")
      throw new HttpError(404, "Not found.");
    return json({ user: await session() });
  });
}
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  return handle(async () => {
    sameOrigin(request);
    const { action } = await context.params;
    if (action === "logout") {
      (await cookies()).delete("wedrop_session");
      return json({ ok: true });
    }
    if (!["login", "register"].includes(action))
      throw new HttpError(404, "Not found.");
    await limit(request, "auth", 15);
    const { email, password } = authSchema.parse(await body(request));
    if (action === "register") {
      const hash = await hashPassword(password);
      const rows =
        await db()`INSERT INTO users(email, password_hash) VALUES (${email}, ${hash}) ON CONFLICT(email) DO NOTHING RETURNING id, email`;
      if (!rows[0])
        throw new HttpError(
          409,
          "Unable to create this account. Try signing in.",
        );
      await setSession(rows[0].id);
      return json({ user: { id: rows[0].id, email } }, 201);
    }
    const rows =
      await db()`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
    const fallback =
      "scrypt:00000000000000000000000000000000:" + "0".repeat(128);
    const valid = await verifyPassword(
      password,
      rows[0]?.password_hash || fallback,
    );
    if (!rows[0] || !valid)
      throw new HttpError(401, "Email or password is incorrect.");
    await setSession(rows[0].id);
    return json({ user: { id: rows[0].id, email } });
  });
}
