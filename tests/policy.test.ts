import { test } from "node:test";
import assert from "node:assert/strict";
import { dropPolicy, dropSchema, authSchema } from "../src/lib/policy";
test("accounts can choose all five time options without password protection", () => {
  for (const [expiration, seconds] of Object.entries({
    "30m": 1800,
    "1h": 3600,
    "24h": 86400,
    "48h": 172800,
    "7d": 604800,
  })) {
    const input = dropSchema.parse({
      content: "no password needed",
      expiration,
    });
    assert.equal(input.password, "");
    assert.equal(
      dropPolicy(input.content, input.expiration, true).seconds,
      seconds,
    );
  }
});
test("view limits require integers from 1 to 1000 and view-based expiration", () => {
  for (const maxViews of [0, -1, 1.5, 1001, "3"])
    assert.equal(
      dropSchema.safeParse({ content: "hello", expiration: "burn", maxViews })
        .success,
      false,
    );
  assert.equal(
    dropSchema.safeParse({ content: "hello", expiration: "burn", maxViews: 3 })
      .success,
    true,
  );
  assert.equal(
    dropSchema.safeParse({ content: "hello", expiration: "24h", maxViews: 3 })
      .success,
    false,
  );
});
test("guest and account limits include Unicode code points", () => {
  assert.equal(dropPolicy("😀".repeat(50000), "24h", false).seconds, 86400);
  assert.throws(() => dropPolicy("x".repeat(50001), "24h", false));
  assert.equal(dropPolicy("x".repeat(200000), "7d", true).seconds, 604800);
  assert.throws(() => dropPolicy("x".repeat(200001), "7d", true));
});
test("guest premium expirations are rejected server-side", () => {
  for (const expiration of ["1h", "48h", "7d"])
    assert.throws(() => dropPolicy("hello", expiration, false));
});
test("burn retention follows mode maximum", () => {
  assert.deepEqual(dropPolicy("hello", "burn", false), {
    seconds: 86400,
    burn: true,
  });
  assert.equal(dropPolicy("hello", "burn", true).seconds, 604800);
});
test("invalid and empty inputs cannot become drops", () => {
  assert.throws(() => dropPolicy(" \n", "24h", true));
  assert.throws(() => dropPolicy("\0", "24h", false));
  assert.equal(
    dropSchema.safeParse({ content: "hello", expiration: "forever" }).success,
    false,
  );
  assert.equal(
    authSchema.safeParse({ email: "invalid", password: "short" }).success,
    false,
  );
});
