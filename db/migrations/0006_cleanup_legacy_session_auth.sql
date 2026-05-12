ALTER TABLE billing_events
  DROP CONSTRAINT IF EXISTS billing_events_session_id_fkey;

ALTER TABLE chat_threads
  DROP CONSTRAINT IF EXISTS chat_threads_session_id_fkey;

ALTER TABLE billing_events
  DROP COLUMN IF EXISTS session_id;

ALTER TABLE chat_threads
  DROP COLUMN IF EXISTS session_id;

DROP TABLE IF EXISTS chat_sessions;
