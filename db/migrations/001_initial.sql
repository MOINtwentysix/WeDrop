-- WeDrop initial schema. Run this entire script in the Neon SQL Editor.
BEGIN;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS drops (
  id TEXT PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{21}$'),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200000),
  password_hash TEXT,
  burn_after_reading BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CHECK (expires_at > created_at),
  CHECK (user_id IS NOT NULL OR char_length(content) <= 50000)
);
CREATE INDEX IF NOT EXISTS drops_expires_at_idx ON drops(expires_at);
CREATE INDEX IF NOT EXISTS drops_user_id_expires_at_idx ON drops(user_id, expires_at DESC);
-- Shared, atomic limits work across serverless instances. Keys contain HMACs, not raw IPs.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx ON rate_limits(expires_at);
COMMIT;
