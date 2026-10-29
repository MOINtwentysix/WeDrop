# WeDrop – Drop it. Share it.

**WeDrop** is a minimal, open-source, self-hostable text and code sharing application built with Next.js App Router, TypeScript, Tailwind/CSS, Vercel Functions, and Neon Postgres. Licensed under **AGPL-3.0-only**.

WeDrop makes sharing text, code snippets, notes, and temporary secrets effortless and secure. With zero bloat, no file upload vulnerabilities, no third-party analytics, and built-in self-hosting capabilities, you can run your own instance in minutes or use a hosted version.

---

## Key Features

- ⚡ **Instant Sharing**: Paste code or text, select an expiration time, and generate an instant sharing link or QR code.
- ⏳ **Ephemeral by Design**: Drops automatically expire after a set time (30m, 1h, 24h, 48h, 7d) or after a specific number of views ("Burn after reading").
- 🔒 **Optional Password Protection**: Secure sensitive snippets with optional custom passwords using salted scrypt hashing.
- 👤 **Account Management & Usernames**: Register with a custom `@username`, manage your profile, change passwords, or permanently delete your account anytime via the Account Manager (`/account`).
- 🖥️ **Dedicated Landing Page & Editor**: Clean landing page showcases WeDrop features, while a dedicated drop editor (`/create`) handles creation.
- 🚀 **100% Self-Hostable**: Easily deploy on Vercel, Docker, or any Node.js environment backed by PostgreSQL / Neon.
- 📱 **Installable PWA**: Works offline as a Progressive Web App with Web Share Target support.

---

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
├── db/migrations/
│   ├── 001_initial.sql
│   ├── 002_view_limits.sql
│   └── 003_usernames.sql
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
│   │   ├── create/page.tsx
│   │   ├── account/page.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── my-drops/page.tsx
│   │   ├── d/[id]/page.tsx
│   │   └── api/
│   │       ├── account/route.ts
│   │       ├── auth/[action]/route.ts
│   │       ├── drops/route.ts
│   │       ├── drops/[id]/route.ts
│   │       └── cron/cleanup/route.ts
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── landing.tsx
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

With existing Neon and Vercel accounts, configuration takes a few minutes:

1. Create a Neon project. Open **SQL Editor** and run **`db/migrations/001_initial.sql`**, **`db/migrations/002_view_limits.sql`**, and **`db/migrations/003_usernames.sql`**, in order. These create tables, indexes, rate limits, view functions, and username support.
2. Copy the pooled Neon connection string from **Connect**. Keep its SSL parameters. Choose a Vercel region near your Neon database.
3. Push this repository to GitHub and import it into Vercel as a Next.js project. Use Node.js >=22 (or 24), `npm run build`, and the default output directory.
4. Add environment variables from **`.env.example`** to Vercel: `DATABASE_URL`, independently generated `JWT_SECRET` and `CRON_SECRET` (at least 32 characters each), `NEXT_PUBLIC_APP_URL` set to your final HTTPS origin, and `NEXT_PUBLIC_SOURCE_URL` pointing to your published source repository.
5. Deploy. Open the app, create a guest drop, open its link in another browser, then register and manage your account in **Account Settings**.

The default `vercel.json` runs cleanup daily at approximately 03:00 UTC and works on Vercel Hobby. Expiration is enforced by SQL on **every read**; physical cleanup timing does not extend availability.

Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically. Cleanup returns only a deletion count. To invoke manually, send that authorization header to `GET /api/cron/cleanup`; never put the secret in the URL.

## Local development

File: project root terminal

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill in .env.local, then run SQL migrations in Neon SQL Editor.
npm run dev
```

Open [localhost:3000](http://localhost:3000). Generate each secret independently:

File: project root terminal

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Behavior

| Mode    | Character limit | Expirations                                                        | Unread burn retention |
| ------- | --------------: | ------------------------------------------------------------------ | --------------------- |
| Guest   |          50,000 | 30 minutes, 24 hours, burn after reading                           | 24 hours              |
| Account |         200,000 | 30 minutes, 1 hour, 24 hours, 48 hours, 7 days, burn after reading | 7 days                |

Character limits count Unicode code points. Whitespace-only text and null characters are rejected. Text is rendered literally, including HTML and Markdown, so shared content cannot execute scripts. Drop password protection is optional for guests and accounts.

Choose **After a time** for time-based expiration, or **After a number of opens** for 1–1,000 successful reveals. Count-based drops also expire after 24 hours for guests or 7 days for accounts if their opening allowance is not used.

**My Drops** lists active metadata only, without revealing content or consuming burns.
**Account Manager** (`/account`) allows updating username, email address, password, or permanently deleting the account and all associated drops.

## API

All bodies and responses are JSON. Errors use `{ "error": "English message" }`. All API responses are `no-store`. Mutating routes require an exact canonical `Origin` header.

| Method | Path                                | Request / response                                                      |
| ------ | ----------------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/auth/register`                | `{email,password,username?}` → public user + session cookie             |
| POST   | `/api/auth/login`                   | `{email,password}` → public user + session cookie                       |
| POST   | `/api/auth/logout`                  | Clears session cookie                                                   |
| GET    | `/api/auth/me`                      | `{user: {id,email,username} \| null}`                                   |
| GET    | `/api/account`                      | `{user: {id,email,username}}`                                           |
| PATCH  | `/api/account`                      | `{username?,email?,currentPassword?,newPassword?}` → updated user       |
| DELETE | `/api/account`                      | Permanently deletes account & drops                                     |
| POST   | `/api/drops`                        | `{content,expiration,password?}` → `{id,expires_at,burn_after_reading}` |
| GET    | `/api/drops?before=<ISO timestamp>` | Authenticated `{drops,next}`; 50 per page                               |
| GET    | `/api/drops/:id`                    | `{protected,burn_after_reading,expires_at}` only                        |
| POST   | `/api/drops/:id`                    | `{password?: string}` → content after access check; consumes burns      |
| DELETE | `/api/drops/:id`                    | Owner-only revocation                                                   |
| GET    | `/api/cron/cleanup`                 | Bearer secret required; `{deleted:number}`                              |

## Open source & Self-Hosting

WeDrop is licensed under **AGPL-3.0-only**. Publish the full corresponding source of your deployed version and set `NEXT_PUBLIC_SOURCE_URL` so users can access it from the footer and landing page. See `CONTRIBUTING.md` and `SECURITY.md` for guidance.
