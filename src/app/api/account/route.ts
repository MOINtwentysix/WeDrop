import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { updateAccountSchema } from "@/lib/policy";
import { body, handle, json } from "@/lib/http";
import {
  hashPassword,
  verifyPassword,
  sameOrigin,
  limit,
  HttpError,
  session,
} from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const user = await session();
    if (!user) throw new HttpError(401, "Not authenticated.");
    return json({ user });
  });
}

export async function PATCH(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const user = await session();
    if (!user) throw new HttpError(401, "Not authenticated.");

    await limit(request, "account-update", 10);
    const payload = updateAccountSchema.parse(await body(request));

    // Handle password update if requested
    if (payload.newPassword) {
      if (!payload.currentPassword) {
        throw new HttpError(400, "Current password is required to change password.");
      }
      const userRow = await db()`SELECT password_hash FROM users WHERE id = ${user.id}`;
      if (!userRow[0]) throw new HttpError(404, "User not found.");

      const valid = await verifyPassword(payload.currentPassword, userRow[0].password_hash);
      if (!valid) throw new HttpError(401, "Current password is incorrect.");

      const newHash = await hashPassword(payload.newPassword);
      await db()`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`;
    }

    // Handle profile fields update (username / email)
    if (payload.username !== undefined || payload.email !== undefined) {
      const newEmail = payload.email || user.email;
      const newUsername = payload.username !== undefined ? (payload.username || null) : user.username;

      try {
        const updated = await db()`
          UPDATE users
          SET email = ${newEmail}, username = ${newUsername}
          WHERE id = ${user.id}
          RETURNING id, email, username
        `;
        return json({ user: updated[0], message: "Account profile updated successfully." });
      } catch (e) {
        if ((e as { code?: string }).code === "23505") {
          throw new HttpError(409, "Email or username is already taken.");
        }
        throw e;
      }
    }

    const updatedUser = await session();
    return json({ user: updatedUser, message: "Account updated successfully." });
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const user = await session();
    if (!user) throw new HttpError(401, "Not authenticated.");

    // Delete user (drops cascade automatically)
    await db()`DELETE FROM users WHERE id = ${user.id}`;
    (await cookies()).delete("wedrop_session");

    return json({ ok: true, message: "Account deleted permanently." });
  });
}
