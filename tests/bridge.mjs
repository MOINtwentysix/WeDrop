// Isolated, in-memory Postgres for end-to-end tests. Never used by application code.
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
const db = new PGlite();
await db.exec(await readFile("db/migrations/001_initial.sql", "utf8"));
await db.exec(await readFile("db/migrations/002_view_limits.sql", "utf8"));
function raw(value) {
  if (value === null) return null;
  if (value instanceof Date)
    return value.toISOString().replace("T", " ").replace("Z", "+00");
  if (typeof value === "boolean") return value ? "t" : "f";
  return String(value);
}
async function query(q, connection = db) {
  const params = q.params.map((value) =>
    value === "false" ? false : value === "true" ? true : value,
  );
  const result = await connection.query(q.query, params);
  return {
    fields: result.fields.map((f) => ({
      name: f.name,
      dataTypeID: f.dataTypeID,
    })),
    rows: result.rows.map((row) => result.fields.map((f) => raw(row[f.name]))),
    rowCount: result.affectedRows ?? result.rows.length,
    command: q.query.trim().split(" ")[0],
    rowAsArray: true,
  };
}
const server = createServer(async (req, res) => {
  try {
    let input = "";
    for await (const chunk of req) input += chunk;
    const data = JSON.parse(input || "{}");
    if (req.url === "/expire") {
      await db.query(
        "UPDATE drops SET created_at=NOW()-interval '2 days', expires_at=NOW()-interval '1 day' WHERE id=$1",
        [data.id],
      );
      res.end("{}");
      return;
    }
    const result = data.queries
      ? await db.transaction(async (transaction) => {
          const results = [];
          for (const q of data.queries)
            results.push(await query(q, transaction));
          return { results };
        })
      : await query(data);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    res.statusCode = 400;
    res.end(JSON.stringify({ message: error.message, code: error.code }));
  }
});
server.listen(5544, "127.0.0.1", () =>
  console.log("Test Postgres bridge ready on 5544"),
);
