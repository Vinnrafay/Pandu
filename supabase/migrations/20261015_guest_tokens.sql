-- Guest token untuk auth ringan tanpa password.
-- Alur: POST /auth/guest {name} -> {token, user}. Frontend kirim sebagai
-- Authorization: Bearer <token> (lihat client.ts setAuthToken).
-- Tabel ini bagian dari scaffold server/ yang di-commit; secrets tetap via env.

CREATE TABLE IF NOT EXISTS guest_tokens (
  token TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS ix_guest_tokens_user ON guest_tokens(user_id);
CREATE INDEX IF NOT EXISTS ix_guest_tokens_expires ON guest_tokens(expires_at);

-- ============ DOWN ============
-- DROP INDEX IF EXISTS ix_guest_tokens_expires;
-- DROP INDEX IF EXISTS ix_guest_tokens_user;
-- DROP TABLE IF EXISTS guest_tokens;
