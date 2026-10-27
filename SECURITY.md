# Security

Do not post credentials or user content in public issues. Report a suspected vulnerability privately using the source repository's private vulnerability reporting feature, if enabled by its maintainer.

The deployer must keep Neon credentials, JWT_SECRET, and CRON_SECRET private and use HTTPS. Set NEXT_PUBLIC_SOURCE_URL to the corresponding source repository. Do not log request bodies, share-target query strings, passwords, or drop contents in additional observability tools.

Password-protected drops use server-side authorization, not end-to-end encryption. Database administrators can access stored text. Burn deletion removes the active row, but does not erase browser copies, Neon backups, point-in-time recovery history, or provider retention. Configure database retention according to your deployment needs. Never promise unrecoverable secure erasure.

Application rate limits use shared Postgres counters. Deploy behind a trusted proxy that sets IP headers, such as Vercel. Consider platform-level abuse protection for public deployments. Registration has no email verification or recovery flow in this version.
