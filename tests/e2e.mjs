import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const origin = "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

async function request(path, method = "GET", data, cookie) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}

try {
  await page.goto(origin + "/create");
  await page
    .getByRole("button", { name: "Create drop", exact: true })
    .waitFor();
  await page
    .getByLabel("Your text or code")
    .fill('const hello = "WeDrop";\n<script>alert("literal")</script>');
  await page.getByRole("button", { name: "Create drop", exact: true }).click();
  await page.getByRole("heading", { name: "Ready to pass it on." }).waitFor();
  const url = await page.getByLabel("Share link").inputValue();
  assert.match(url, /\/d\/[A-Za-z0-9_-]{21}$/);
  await page.getByRole("button", { name: "Copy Link" }).click();
  await page.getByText("Link copied to clipboard.").waitFor();
  await page.goto(url);
  await page.getByRole("button", { name: "Reveal drop" }).click();
  await page.locator(".drop-content").waitFor();
  assert.match(await page.locator(".drop-content").innerText(), /<script>/);
  await page.getByRole("button", { name: "Copy All" }).click();
  await page.getByText("Copied to clipboard.").waitFor();
  console.log(
    "PASS guest UI → API → Postgres → literal recipient text + clipboard",
  );

  const protectedDrop = await request("/api/drops", "POST", {
    content: "one-time secret",
    expiration: "burn",
    password: "drop-password",
  });
  assert.equal(protectedDrop.status, 201);
  const id = protectedDrop.data.id;
  assert.equal(
    (await request(`/api/drops/${id}`)).data.burn_after_reading,
    true,
  );
  assert.equal(
    (await request(`/api/drops/${id}`, "POST", { password: "wrong" })).status,
    403,
  );
  assert.equal((await request(`/api/drops/${id}`)).status, 200);
  const concurrent = await Promise.all(
    [1, 2].map(() =>
      request(`/api/drops/${id}`, "POST", { password: "drop-password" }),
    ),
  );
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 404]);
  assert.equal((await request(`/api/drops/${id}`)).status, 404);
  await page.goto(origin + "/d/" + id);
  await page
    .getByText("This drop has expired or was burned.", { exact: true })
    .waitFor();
  console.log(
    "PASS protected burn, wrong password, non-consuming GET, concurrent one-time reveal, expired UI",
  );

  const gated = await request("/api/drops", "POST", {
    content: "a protected UI drop",
    expiration: "burn",
    password: "password-for-drop",
  });
  await page.goto(origin + "/d/" + gated.data.id);
  await page.getByText(/This drop will be destroyed after viewing/).waitFor();
  await page.getByPlaceholder("Enter the drop password").fill("wrong");
  await page.getByRole("button", { name: "Reveal drop" }).click();
  await page.getByText("Incorrect password.", { exact: true }).waitFor();
  await page
    .getByPlaceholder("Enter the drop password")
    .fill("password-for-drop");
  await page.getByRole("button", { name: "Reveal drop" }).click();
  await page.getByText("a protected UI drop", { exact: true }).waitFor();
  console.log(
    "PASS password prompt, burn warning, incorrect password retry and reveal UI",
  );

  assert.equal(
    (await request("/api/drops", "POST", { content: "x", expiration: "7d" }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("/api/drops", "POST", {
        content: "x".repeat(50001),
        expiration: "24h",
      })
    ).status,
    400,
  );

  await page.goto(origin + "/create");
  await page.getByLabel("Deletion mode").selectOption("views");
  await page.getByLabel("Maximum opens").fill("3");
  await page.getByLabel("Your text or code").fill("three successful opens");
  await page.getByRole("button", { name: "Create drop", exact: true }).click();
  await page.getByRole("heading", { name: "Ready to pass it on." }).waitFor();
  const countedUrl = await page.getByLabel("Share link").inputValue();
  const countedId = countedUrl.split("/").pop();
  await page.goto(countedUrl);
  await page
    .getByText(
      "This drop has 3 opens remaining. It will be deleted after the final reveal.",
    )
    .waitFor();
  assert.equal(
    (await request(`/api/drops/${countedId}`)).data.remaining_views,
    3,
  );
  const counted = await Promise.all(
    Array.from({ length: 8 }, () =>
      request(`/api/drops/${countedId}`, "POST", {}),
    ),
  );
  assert.deepEqual(
    counted
      .filter((r) => r.status === 200)
      .map((r) => r.data.remaining_views)
      .sort(),
    [0, 1, 2],
  );
  assert.equal(counted.filter((r) => r.status === 404).length, 5);
  assert.equal((await request(`/api/drops/${countedId}`)).status, 404);
  assert.equal(
    (
      await request("/api/drops", "POST", {
        content: "invalid",
        expiration: "burn",
        maxViews: 0,
      })
    ).status,
    400,
  );
  console.log(
    "PASS configurable opens UI, metadata does not count, exactly three concurrent reveals, final deletion and invalid limit",
  );

  const csrf = await fetch(origin + "/api/drops", {
    method: "POST",
    headers: {
      Origin: "https://evil.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(csrf.status, 403);

  await page.goto(origin + "/register");
  await page.getByLabel("Email address").fill(`ui-${Date.now()}@example.com`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("a-long-test-password");
  await page.locator('input[type="checkbox"][name="terms"]').check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("heading", { name: "My Drops" }).waitFor();
  await page.getByRole("link", { name: "New drop", exact: true }).click();
  await page.getByLabel("Your text or code").fill("account text");
  await page.getByRole("button", { name: "24 Hours", exact: true }).click();
  for (const label of [
    "30 Minutes",
    "1 Hour",
    "24 Hours",
    "48 Hours",
    "7 Days",
  ])
    assert.notEqual(
      await page
        .locator("#expiry-options")
        .getByRole("button", { name: new RegExp(label) })
        .getAttribute("aria-disabled"),
      "true",
    );
  await page.getByRole("button", { name: /1 Hour/ }).click();
  await page.getByRole("button", { name: "1 Hour", exact: true }).click();
  await page.getByRole("button", { name: /7 Days/ }).click();
  await page.getByRole("button", { name: "Create drop", exact: true }).click();
  await page.getByRole("heading", { name: "Ready to pass it on." }).waitFor();
  await page.getByRole("link", { name: "My Drops", exact: true }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.locator(".qr svg").count(), 1);
  await page.keyboard.press("Shift+Tab");
  assert.equal(
    await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') !== null,
    ),
    true,
  );
  await page.getByRole("button", { name: "Close sharing dialog" }).click();
  await page.getByRole("button", { name: /Revoke drop/ }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByText("A clean slate.").waitFor();
  console.log(
    "PASS registration, authenticated premium creation, My Drops, QR re-view, owner revoke",
  );

  const account = await request("/api/auth/register", "POST", {
    email: `api-${Date.now()}@example.com`,
    password: "a-long-test-password",
  });
  assert.equal(account.status, 201);
  const oneHour = await request(
    "/api/drops",
    "POST",
    { content: "optional password", expiration: "1h" },
    account.cookie,
  );
  assert.equal(oneHour.status, 201);
  assert.ok(
    Math.abs(Date.parse(oneHour.data.expires_at) - Date.now() - 3600000) <
      10000,
  );
  assert.equal(
    (await request(`/api/drops/${oneHour.data.id}`)).data.protected,
    false,
  );
  const own = await request(
    "/api/drops",
    "POST",
    { content: "x".repeat(200000), expiration: "7d" },
    account.cookie,
  );
  assert.equal(own.status, 201);
  assert.equal(
    (await request("/api/drops/" + own.data.id, "DELETE", undefined)).status,
    401,
  );
  const other = await request("/api/auth/register", "POST", {
    email: `other-${Date.now()}@example.com`,
    password: "another-long-password",
  });
  assert.equal(
    (
      await request(
        "/api/drops/" + own.data.id,
        "DELETE",
        undefined,
        other.cookie,
      )
    ).status,
    404,
  );
  await fetch("http://127.0.0.1:5544/expire", {
    method: "POST",
    body: JSON.stringify({ id: own.data.id }),
  });
  assert.equal((await request("/api/drops/" + own.data.id)).status, 404);
  assert.equal((await request("/api/cron/cleanup")).status, 401);
  const cleanup = await fetch(origin + "/api/cron/cleanup", {
    headers: { Authorization: "Bearer " + "c".repeat(64) },
  });
  assert.equal(cleanup.status, 200);
  assert.ok((await cleanup.json()).deleted >= 1);
  console.log(
    "PASS 200k account limit, ownership isolation, expiry enforcement, authenticated cron cleanup",
  );

  await page.goto(
    origin +
      "/?title=Shared%20title&text=Shared%20text&url=https%3A%2F%2Fexample.com",
  );
  await page.waitForURL((url) => url.pathname === "/create");
  assert.match(
    await page.getByLabel("Your text or code").inputValue(),
    /Shared title\n\nShared text/,
  );
  assert.equal(new URL(page.url()).search, "");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  const manifest = await (await fetch(origin + "/manifest.json")).json();
  assert.equal(manifest.share_target.params.text, "text");
  for (const icon of manifest.icons)
    assert.equal((await fetch(origin + icon.src)).status, 200);

  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );

  await context.setOffline(true);
  await page.goto(origin);
  await page.getByRole("heading", { name: "A little offline." }).waitFor();
  await page.getByLabel("Your text or code").fill("offline thought");
  await context.setOffline(false);
  console.log(
    "PASS text share target, PWA manifest/icons, mobile overflow, offline editor shell",
  );

  const keys = await page.evaluate(async () => {
    const result = [];
    for (const name of await caches.keys())
      for (const request of await (await caches.open(name)).keys())
        result.push(request.url);
    return result;
  });
  assert.ok(
    keys.every(
      (url) =>
        !new URL(url).pathname.startsWith("/api/") &&
        !new URL(url).pathname.startsWith("/d/"),
    ),
  );

  const login = await request("/api/auth/login", "POST", {
    email: `api-missing@example.com`,
    password: "a-long-test-password",
  });
  assert.equal(login.status, 401);
  const validLogin = await request("/api/auth/login", "POST", {
    email: account.data.user.email,
    password: "a-long-test-password",
  });
  assert.equal(validLogin.status, 200);
  assert.ok(validLogin.cookie);

  await page.goto(origin + "/my-drops");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("link", { name: "Sign in", exact: true }).waitFor();
  console.log(
    "PASS sensitive responses excluded from offline cache, invalid login and logout",
  );

  assert.deepEqual(errors, []);
  console.log("PASS no browser runtime errors");
} catch (error) {
  console.error(await page.locator("body").innerText());
  await page.screenshot({ path: "test-results/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
