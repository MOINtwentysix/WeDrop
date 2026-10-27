import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { handle, json } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return handle(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret || secret.length < 32)
      return json({ error: "Cleanup is not configured." }, 503);
    const expected = Buffer.from(`Bearer ${secret}`);
    const actual = Buffer.from(request.headers.get("authorization") || "");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return json({ error: "Unauthorized." }, 401);
    const sql = db();
    const result = await sql.transaction([
      sql`WITH deleted AS (DELETE FROM drops WHERE expires_at <= NOW() RETURNING 1) SELECT count(*)::int AS deleted FROM deleted`,
      sql`DELETE FROM rate_limits WHERE expires_at <= NOW()`,
    ]);
    return json({ deleted: result[0][0].deleted });
  });
}
