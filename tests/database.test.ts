import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("Neon migration, constraints, atomic burns, ownership, and cleanup", async () => {
  const db = new PGlite();
  try {
    const schema = await readFile("db/migrations/001_initial.sql", "utf8");
    await db.exec(schema);
    await db.exec(schema);
    await db.query(
      "INSERT INTO drops(id,content,burn_after_reading,expires_at) VALUES ($1,'legacy burn',true,NOW()+interval '1 day')",
      ["l".repeat(21)],
    );
    const upgrade = await readFile("db/migrations/002_view_limits.sql", "utf8");
    await db.exec(upgrade);
    await db.exec(upgrade);
    assert.equal(
      (
        await db.query<{ remaining_views: number }>(
          "SELECT remaining_views FROM drops WHERE id=$1",
          ["l".repeat(21)],
        )
      ).rows[0].remaining_views,
      1,
    );
    assert.equal(
      (await db.query("SELECT * FROM reveal_drop($1)", ["l".repeat(21)])).rows
        .length,
      1,
    );
    const user = await db.query<{ id: string }>(
      "INSERT INTO users(email,password_hash) VALUES ('test@example.com','hash') RETURNING id",
    );
    const owner = user.rows[0].id;
    await db.query(
      "INSERT INTO drops(id,user_id,content,burn_after_reading,remaining_views,expires_at) VALUES ($1,$2,'hello',true,1,NOW()+interval '1 day')",
      ["a".repeat(21), owner],
    );
    const burns = await Promise.all(
      [1, 2].map(() =>
        db.query("SELECT * FROM reveal_drop($1)", ["a".repeat(21)]),
      ),
    );
    assert.equal(
      burns.reduce((sum, result) => sum + result.rows.length, 0),
      1,
    );
    await db.query(
      "INSERT INTO drops(id,content,remaining_views,expires_at) VALUES ($1,'three opens',3,NOW()+interval '1 day')",
      ["v".repeat(21)],
    );
    const views = await Promise.all(
      Array.from({ length: 8 }, () =>
        db.query<{ remaining_views: number }>("SELECT * FROM reveal_drop($1)", [
          "v".repeat(21),
        ]),
      ),
    );
    assert.deepEqual(
      views
        .flatMap((result) => result.rows.map((row) => row.remaining_views))
        .sort(),
      [0, 1, 2],
    );
    assert.equal(
      (await db.query("SELECT id FROM drops WHERE id=$1", ["v".repeat(21)]))
        .rows.length,
      0,
    );
    await db.query(
      "INSERT INTO drops(id,content,expires_at) VALUES ($1,'time only',NOW()+interval '1 day')",
      ["t".repeat(21)],
    );
    for (let i = 0; i < 4; i++)
      assert.equal(
        (await db.query("SELECT * FROM reveal_drop($1)", ["t".repeat(21)])).rows
          .length,
        1,
      );
    await db.query("DELETE FROM drops WHERE id=$1", ["t".repeat(21)]);
    await assert.rejects(
      db.query(
        "INSERT INTO drops(id,content,expires_at) VALUES ($1,$2,NOW()+interval '1 day')",
        ["b".repeat(21), "x".repeat(50001)],
      ),
    );
    await db.query(
      "INSERT INTO drops(id,user_id,content,created_at,expires_at) VALUES ($1,$2,'old',NOW()-interval '2 days',NOW()-interval '1 day')",
      ["c".repeat(21), owner],
    );
    assert.equal(
      (await db.query("SELECT id FROM drops WHERE expires_at>NOW()")).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query("SELECT * FROM reveal_drop($1)", ["c".repeat(21)])).rows
        .length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "DELETE FROM drops WHERE id=$1 AND user_id=$2 RETURNING id",
          ["c".repeat(21), "00000000-0000-0000-0000-000000000000"],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query("DELETE FROM drops WHERE expires_at<=NOW() RETURNING id"))
        .rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
