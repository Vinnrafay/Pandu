-- Pandu database hardening: Rule-of-3, budget SUM, habit idempotency, schedule overlap
-- Target: Postgres (Supabase / Neon / Vercel Postgres). Idempotent & reversible.
-- Cara pakai (Supabase CLI): supabase migration up
-- Rollback: lihat blok DOWN di bawah file.

-- ============ UP ============

-- ENUM (idempotent)
DO $$ BEGIN CREATE TYPE priority_status AS ENUM ('pending','completed','waiting_box'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE habit_level AS ENUM ('none','baseline','normal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE schedule_platform AS ENUM ('meet','zoom','teams','calendar'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- users: dibuat server-side. Frontend JANGAN lagi pakai `guest_<random>`.
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- priorities + waiting_box = 1 tabel.
-- Frontend lama: slot dihitung dari array length (App.tsx). Sekarang di-constraint DB.
CREATE TABLE IF NOT EXISTS priorities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  slot_number INT NULL CHECK (slot_number BETWEEN 1 AND 3),
  status priority_status NOT NULL DEFAULT 'pending',
  target_time TIME NULL,
  duration_minutes INT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT chk_priorities_slot_consistency CHECK (
    (status = 'waiting_box' AND slot_number IS NULL) OR
    (status IN ('pending','completed') AND slot_number IS NOT NULL)
  )
);

-- Rule-of-3: max 1 baris per (user, tanggal, slot) untuk status aktif.
-- Swap Slot 1 <-> waiting_box WAJIB dalam 1 transaksi (lihat contoh di bawah).
CREATE UNIQUE INDEX IF NOT EXISTS uq_priorities_slot
  ON priorities(user_id, date, slot_number)
  WHERE status IN ('pending','completed') AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_priorities_user_date
  ON priorities(user_id, date) WHERE deleted_at IS NULL;

-- budget: hanya limit yang disimpan. spent = SUM(expenses) per hari.
CREATE TABLE IF NOT EXISTS budgets (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  limit_amount INT NOT NULL CHECK (limit_amount > 0),
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount INT NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL DEFAULT 'Pengeluaran',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_expenses_user_date ON expenses(user_id, date DESC);

-- habits
CREATE TABLE IF NOT EXISTS habits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  baseline_desc TEXT NOT NULL DEFAULT 'Target Minimal',
  normal_desc TEXT NOT NULL DEFAULT 'Target Penuh',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NULL,
  UNIQUE(user_id, name)
);

-- habit_logs: 1 baris per habit per hari (idempotent, aman di-tap ulang).
-- streak JANGAN disimpan sebagai kolom mutable; hitung dari tabel ini.
CREATE TABLE IF NOT EXISTS habit_logs (
  habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  level habit_level NOT NULL,
  PRIMARY KEY (habit_id, date)
);
CREATE INDEX IF NOT EXISTS ix_habit_logs_user_date ON habit_logs(user_id, date DESC);

-- schedules: kolom snake_case (frontend kirim snake_case, lihat panduService.ts).
CREATE TABLE IF NOT EXISTS schedules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  platform schedule_platform NOT NULL DEFAULT 'calendar',
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS ix_schedules_user_date ON schedules(user_id, date);

-- Opsional tapi disarankan: tolak jadwal tumpang tindih di level DB.
-- Butuh: CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE schedules ADD CONSTRAINT no_overlapping_schedules EXCLUDE USING gist
--   (user_id WITH =, date WITH =, tstzrange((date + start_time)::timestamptz, (date + end_time)::timestamptz) WITH &&);

-- View yang dipakai GET /api/v1/dashboard?date=YYYY-MM-DD
CREATE OR REPLACE VIEW v_dashboard_daily AS
SELECT
  u.id AS user_id,
  d.date AS date,
  (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.user_id = u.id AND e.date = d.date) AS spent,
  (SELECT b.limit_amount FROM budgets b WHERE b.user_id = u.id AND b.date = d.date) AS limit_amount
FROM users u CROSS JOIN (SELECT CURRENT_DATE AS date) d;

-- ============ CONTOH TRANSAKSI (dipakai backend, bukan migration runner) ============
-- -- Swap waiting -> Slot 1 secara atomik:
-- BEGIN;
-- UPDATE priorities SET status='waiting_box', slot_number=NULL, updated_at=now()
--  WHERE id = :slot1_id AND user_id = :uid AND date = :today;
-- UPDATE priorities SET status='pending', slot_number=1, updated_at=now()
--  WHERE id = :waiting_id AND user_id = :uid AND date = :today;
-- COMMIT;

-- -- Log habit idempotent:
-- INSERT INTO habit_logs (habit_id, user_id, date, level)
-- VALUES (:hid, :uid, :today, :level)
-- ON CONFLICT (habit_id, date) DO UPDATE SET level = EXCLUDED.level;

-- ============ DOWN (rollback manual, jalankan hanya bila perlu) ============
-- DROP VIEW IF EXISTS v_dashboard_daily;
-- DROP INDEX IF EXISTS ix_schedules_user_date;
-- DROP TABLE IF EXISTS schedules;
-- DROP INDEX IF EXISTS ix_habit_logs_user_date;
-- DROP TABLE IF EXISTS habit_logs;
-- DROP TABLE IF EXISTS habits;
-- DROP INDEX IF EXISTS ix_expenses_user_date;
-- DROP TABLE IF EXISTS expenses;
-- DROP TABLE IF EXISTS budgets;
-- DROP INDEX IF EXISTS ix_priorities_user_date;
-- DROP INDEX IF EXISTS uq_priorities_slot;
-- DROP TABLE IF EXISTS priorities;
-- DROP TABLE IF EXISTS users;
-- DROP TYPE IF EXISTS schedule_platform;
-- DROP TYPE IF EXISTS habit_level;
-- DROP TYPE IF EXISTS priority_status;
