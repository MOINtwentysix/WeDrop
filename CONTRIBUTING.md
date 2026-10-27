# Contributing

Use Node.js 24 and npm. Install with `npm ci`, configure `.env.local` using `.env.example`, and use a separate Neon development branch with the migration applied.

Keep all UI text, errors, comments, and documentation in English. Never commit secrets, real user content, or database exports. Keep text rendering literal and never cache recipient data. Changes to burn behavior must preserve atomic one-time consumption.

Run `npm run typecheck`, `npm test`, and `npm run build` before submitting a pull request. Include a brief description, validation results, and screenshots for visual changes. Contributions are provided under AGPL-3.0-only.
