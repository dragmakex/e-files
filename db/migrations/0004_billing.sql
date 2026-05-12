ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS query_credits integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS billing_events (
  id text PRIMARY KEY,
  stripe_event_id text NOT NULL UNIQUE,
  stripe_checkout_session_id text NOT NULL UNIQUE,
  session_id text NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  credits integer NOT NULL CHECK (credits > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
