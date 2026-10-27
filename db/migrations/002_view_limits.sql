-- Run after 001_initial.sql, including on existing WeDrop databases.
BEGIN;
ALTER TABLE drops ADD COLUMN IF NOT EXISTS remaining_views INTEGER
  CHECK (remaining_views BETWEEN 1 AND 1000);
UPDATE drops SET remaining_views = 1
WHERE burn_after_reading AND remaining_views IS NULL;

-- Lock each drop before consuming a view. The final view deletes its row.
CREATE OR REPLACE FUNCTION reveal_drop(drop_id TEXT)
RETURNS TABLE(content TEXT, expires_at TIMESTAMPTZ, burn_after_reading BOOLEAN, remaining_views INTEGER)
LANGUAGE plpgsql AS $$
DECLARE target drops%ROWTYPE;
BEGIN
  SELECT d.* INTO target FROM drops d
  WHERE d.id = drop_id AND d.expires_at > clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF target.expires_at <= clock_timestamp() THEN RETURN; END IF;
  content := target.content;
  expires_at := target.expires_at;
  burn_after_reading := target.burn_after_reading;
  remaining_views := CASE WHEN target.remaining_views IS NULL THEN NULL ELSE target.remaining_views - 1 END;
  IF target.remaining_views = 1 THEN
    DELETE FROM drops d WHERE d.id = drop_id;
  ELSIF target.remaining_views > 1 THEN
    UPDATE drops d SET remaining_views = target.remaining_views - 1 WHERE d.id = drop_id;
  END IF;
  RETURN NEXT;
END;
$$;
COMMIT;
