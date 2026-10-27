# WeDrop – Drop it. Share it.

A minimal, installable text and code sharing app built with Next.js App Router, TypeScript, Vercel Functions, and Neon Postgres. Licensed under **AGPL-3.0-only**. No file uploads, local runtime storage, analytics, or external QR services.

## Project structure

```text
WeDrop/
├── .env.example
├── .gitignore
├── .github/workflows/ci.yml
├── LICENSE
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── next-env.d.ts
├── next.config.ts
├── vercel.json
├── db/migrations/001_initial.sql
├── db/migrations/002_view_limits.sql
├── scripts/icons.mjs
├── public/
│   ├── fonts.css
│   ├── manifest.json
│   ├── offline.html
│   ├── sw.js
│   └── icons/{icon-192,icon-512,maskable-512,apple-touch-icon}.png
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── my-drops/page.tsx
│   │   ├── d/[id]/page.tsx
│   │   └── api/
│   │       ├── auth/[action]/route.ts
│   │       ├── drops/route.ts
│   │       ├── drops/[id]/route.ts
│   │       └── cron/cleanup/route.ts
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── editor.tsx
│   │   ├── auth-form.tsx
│   │   ├── share-card.tsx
│   │   ├── recipient.tsx
│   │   └── dashboard.tsx
│   └── lib/{db,security,http,policy,client}.ts
└── tests/
    ├── policy.test.ts
    ├── database.test.ts
    ├── bridge.mjs
    ├── fetch-bridge.mjs
    ├── start.mjs
    └── e2e.mjs
```

## Quick deployment: Neon + Vercel

With existing Neon and Vercel accounts, configuration takes a few minutes; initial build time is additional.

1. Create a Neon project. Open **SQL Editor** and run **`db/migrations/001_initial.sql`**, then **`db/migrations/002_view_limits.sql`**, in that order. These create the tables, indexes, shared rate limits, and atomic view-consumption function. Existing installations only need the new `002_view_limits.sql` upgrade. Both scripts are safe to rerun against their own schema. No database access from this coding session is needed.
2. Copy the pooled Neon connection string from **Connect**. Keep its SSL parameters. Choose a Vercel region near your Neon database.
3. Push this repository to GitHub and import it into Vercel as a Next.js project. Use Node.js 24 (or a supported Node version >=22), `npm run build`, and the default output directory.
4. Add environment variables from **`.env.example`** to Vercel: `DATABASE_URL`, independently generated `JWT_SECRET` and `CRON_SECRET` (at least 32 characters each), `NEXT_PUBLIC_APP_URL` set to your final HTTPS origin, and `NEXT_PUBLIC_SOURCE_URL` pointing to your published corresponding source repository. Public variables are embedded at build time; redeploy after changing them.
5. Deploy. Open the app, create a guest drop, open its link in another browser, then register and check **My Drops**. Use a separate Neon branch and separate secrets for preview deployments; configure previews with their own canonical origin.

The default `vercel.json` runs cleanup daily at approximately 03:00 UTC and works on Vercel Hobby. Expiration is enforced by SQL on **every read**; physical cleanup timing does not extend availability. For hourly cleanup on Vercel Pro, replace the schedule with `0 * * * *`. Hobby rejects hourly schedules. See [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically. Cleanup returns only a deletion count. To invoke manually, send that authorization header to `GET /api/cron/cleanup`; never put the secret in the URL.

## Local development

File: project root terminal

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill in .env.local, then run the SQL migration in Neon SQL Editor.
npm run dev
```

Open [localhost:3000](http://localhost:3000). The canonical origin must match the browser origin, including the port. Generate each secret independently:

File: project root terminal

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Behavior

| Mode    | Character limit | Expirations                                                        | Unread burn retention |
| ------- | --------------: | ------------------------------------------------------------------ | --------------------- |
| Guest   |          50,000 | 30 minutes, 24 hours, burn after reading                           | 24 hours              |
| Account |         200,000 | 30 minutes, 1 hour, 24 hours, 48 hours, 7 days, burn after reading | 7 days                |

Character limits count Unicode code points. Whitespace-only text and null characters are rejected. Text is rendered literally, including HTML and Markdown, so shared content cannot execute scripts. Drop password protection is off by default and optional for guests and accounts. When enabled, passwords are limited to 128 characters. Account login passwords require 12–128 characters. The account-only one-hour API expiration is `1h` (3,600 seconds).

Choose **After a time** for time-based expiration, or **After a number of opens** for 1–1,000 successful reveals. Count-based drops also expire after 24 hours for guests or 7 days for accounts if their opening allowance is not used. One opening is the equivalent of burn after reading.

Opening a recipient link fetches metadata only. **Reveal drop** submits a POST; `reveal_drop` locks the row, decrements the allowance, and deletes the row on the final reveal, all atomically. Concurrent requests cannot exceed the configured limit. A wrong password does not consume an opening. Time-only drops have no opening limit. If delivery fails after consumption, that opening cannot be recovered. A viewer can still copy or photograph revealed content. The dashboard and recipient screen show remaining openings.

Password protection is server-side access control, **not end-to-end encryption**. Content is stored as text in Neon. Account and drop passwords use independently salted scrypt hashes. Anyone with an unprotected link can read it. Account sessions are HS256 JWTs in HttpOnly, SameSite=Lax, Secure-in-production cookies, expiring after seven days. Logout removes the current browser cookie; changing JWT_SECRET invalidates all tokens. This initial release does not provide email verification, password recovery, or account deletion.

**My Drops** lists active metadata only, without revealing content or consuming burns. It supports paginated loading, remaining time, link/QR redisplay, and owner-only revocation. Guest drops cannot be revoked through an account.

## API

All bodies and responses are JSON. Errors use `{ "error": "English message" }`. All API responses are `no-store`. Mutating routes require an exact canonical `Origin` header. Content and passwords are never placed in URLs or logged by application code.

| Method | Path                                | Request / response                                                      |
| ------ | ----------------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/auth/register`                | `{email,password}` → public user + session cookie                       |
| POST   | `/api/auth/login`                   | `{email,password}` → public user + session cookie                       |
| POST   | `/api/auth/logout`                  | Clears session cookie                                                   |
| GET    | `/api/auth/me`                      | `{user: {id,email} \| null}`                                            |
| POST   | `/api/drops`                        | `{content,expiration,password?}` → `{id,expires_at,burn_after_reading}` |
| GET    | `/api/drops?before=<ISO timestamp>` | Authenticated `{drops,next}`; 50 per page                               |
| GET    | `/api/drops/:id`                    | `{protected,burn_after_reading,expires_at}` only                        |
| POST   | `/api/drops/:id`                    | `{password?: string}` → content after access check; consumes burns      |
| DELETE | `/api/drops/:id`                    | Owner-only revocation                                                   |
| GET    | `/api/cron/cleanup`                 | Bearer secret required; `{deleted:number}`                              |

Expiration values: `30m`, `1h`, `24h`, `burn`, `48h`, `7d`. The values `1h`, `48h`, and `7d` require an account. For count-based deletion, send `expiration: "burn"` and `maxViews` as an integer from 1 to 1,000. Omitting `maxViews` with `burn` preserves one-time behavior. Creation, metadata, dashboard entries and reveal responses include `remaining_views`: null means time-only, and zero in a reveal response means the row has just been deleted. Missing, burned, and expired drops return the same 404 message. Shared Postgres counters limit authentication to 15, creation to 30, and reveals to 60 requests per IP per ten minutes. Keys are HMACs with JWT_SECRET. Trust proxy IP headers only behind Vercel or an equivalently configured trusted proxy. Rate limits are a basic abuse control, not a replacement for deployment-level protection.

## PWA and offline behavior

The manifest includes PNG and maskable icons, shortcuts, and a GET text share target. Compatible installed browsers pass title/text/URL into the editor; the query is removed from browser history after import. GET share targets have browser-specific URL length limits. Native sharing and installation depend on browser support; Copy Link remains available, and iOS users can use **Add to Home Screen**.

The service worker caches a public offline HTML editor shell and static assets only. APIs, dashboard pages, recipient pages, shared query data, and drop content are never cached. Offline writing is temporary: copy the text before reconnecting. There is no background submission or persistent draft storage. HTTPS is required outside localhost.

## Validation

File: project root terminal

```powershell
npm run typecheck
npm test
npm run build
```

Tests execute the actual migration in in-memory PostgreSQL (PGlite), check Unicode and mode limits, schema constraints, concurrent burn consumption, ownership, and cleanup. The optional test bridge in `tests/bridge.mjs` is isolated test infrastructure, never an application backend. Production always uses Neon through `DATABASE_URL`. Deployment verification against your actual Neon instance is required after setting credentials.

For the full browser suite, first build with `npm run build` and install Chromium with `npx playwright install chromium`. In three terminals at the project root, run `node tests/bridge.mjs`, `node tests/start.mjs`, and `npm run test:e2e`, respectively. Ports 3000 and 5544 must be free. Restart the bridge for a fresh database between runs. The test launcher uses deliberately fake credentials and a test-only fetch preload to redirect Neon requests to local PostgreSQL. Never use the launcher or preload for deployment. The suite checks UI creation, clipboard, literal text rendering, registration, premium expiration, QR redisplay, revocation, ownership isolation, password-protected atomic burns, expiry, cron authorization, mobile layout, text share import, and the offline shell. Screenshots are written to the ignored `test-results` directory.

GitHub Actions runs type checking, database/policy tests, and a production build. Use `npm run icons` to regenerate the included original arrow icons and `npm run format` to format source files.

## Open source

Publish the full corresponding source of your deployed version and set `NEXT_PUBLIC_SOURCE_URL` so users can access it from the footer. The full license is in `LICENSE`. See `CONTRIBUTING.md` and `SECURITY.md` for contribution and security guidance.
