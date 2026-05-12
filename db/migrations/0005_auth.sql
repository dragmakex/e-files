CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  query_credits integer NOT NULL DEFAULT 0,
  stripe_customer_id text
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_sessions_userId_idx ON user_sessions ("userId");

CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("providerId", "accountId")
);

CREATE INDEX IF NOT EXISTS accounts_userId_idx ON accounts ("userId");

CREATE TABLE IF NOT EXISTS verifications (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS verifications_identifier_idx ON verifications (identifier);

ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS user_id text REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_threads
  ALTER COLUMN session_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS chat_threads_user_id_idx ON chat_threads (user_id);

ALTER TABLE billing_events
  ADD COLUMN IF NOT EXISTS user_id text REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE billing_events
  ALTER COLUMN session_id DROP NOT NULL;
