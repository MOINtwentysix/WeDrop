import { db } from "@/lib/db";
import { body, handle, json } from "@/lib/http";
import {
  session,
  sameOrigin,
  verifyPassword,
  limit,
  HttpError,
} from "@/lib/security";
import { z } from "zod";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
async function dropId(context: Context) {
  const { id } = await context.params;
  if (!/^[A-Za-z0-9_-]{21}$/.test(id))
    throw new HttpError(404, "This drop has expired or was burned.");
  return id;
}
const missing = () =>
  new HttpError(404, "This drop has expired or was burned.");
// Metadata only: link previews and prefetches must never consume a drop.
export async function GET(_request: Request, context: Context) {
  return handle(async () => {
    const id = await dropId(context);
    const rows =
      await db()`SELECT burn_after_reading, remaining_views, expires_at, (password_hash IS NOT NULL) AS protected FROM drops WHERE id = ${id} AND expires_at > NOW()`;
    if (!rows[0]) throw missing();
    return json(rows[0]);
  });
}
export async function POST(request: Request, context: Context) {
  return handle(async () => {
    sameOrigin(request);
    await limit(request, "reveal", 60);
    const id = await dropId(context);
    const { password } = z
      .object({ password: z.string().max(128).default("") })
      .parse(await body(request));
    const rows =
      await db()`SELECT password_hash, burn_after_reading FROM drops WHERE id = ${id} AND expires_at > NOW()`;
    if (!rows[0]) throw missing();
    if (
      rows[0].password_hash &&
      !(await verifyPassword(password, rows[0].password_hash))
    )
      throw new HttpError(403, "Incorrect password.");
    // The database locks the row, decrements its allowance, and deletes on the final reveal.
    const result = await db()`SELECT * FROM reveal_drop(${id})`;
    if (!result[0]) throw missing();
    return json(result[0]);
  });
}
export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    sameOrigin(request);
    const user = await session();
    if (!user) throw new HttpError(401, "Sign in to delete your drops.");
    const id = await dropId(context);
    const rows =
      await db()`DELETE FROM drops WHERE id = ${id} AND user_id = ${user.id} RETURNING id`;
    if (!rows[0]) throw missing();
    return json({ ok: true });
  });
}
