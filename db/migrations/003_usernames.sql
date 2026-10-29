-- Run after 002_view_limits.sql. Adds optional username to users table.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$');
COMMIT;
