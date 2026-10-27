import { spawn } from "node:child_process";
// Deliberately fake, local-only credentials. The preload redirects all DB traffic.
const child = spawn(
  process.execPath,
  [
    "--import",
    "./tests/fetch-bridge.mjs",
    "node_modules/next/dist/bin/next",
    "start",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://test:test@test.neon.tech/test",
      JWT_SECRET: "j".repeat(64),
      CRON_SECRET: "c".repeat(64),
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
