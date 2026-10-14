-- Seed demo Pandu (idempotent, aman dijalankan ulang).
-- Cara pakai: supabase db execute -f supabase/seed.sql
-- atau tempel di SQL Editor dashboard Supabase.

INSERT INTO users (name)
SELECT 'Demo'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE name = 'Demo');

INSERT INTO budgets (user_id, date, limit_amount)
SELECT u.id, CURRENT_DATE, 150000
FROM users u
WHERE u.name = 'Demo'
  AND NOT EXISTS (
    SELECT 1 FROM budgets b WHERE b.user_id = u.id AND b.date = CURRENT_DATE
  );

INSERT INTO priorities (user_id, date, title, slot_number, status, target_time, duration_minutes)
SELECT u.id, CURRENT_DATE, 'Fokus: selesaikan 1 tugas terpenting', 1, 'pending', '14:00', 45
FROM users u
WHERE u.name = 'Demo'
  AND NOT EXISTS (
    SELECT 1 FROM priorities p
    WHERE p.user_id = u.id AND p.date = CURRENT_DATE AND p.slot_number = 1 AND p.deleted_at IS NULL
  );

INSERT INTO priorities (user_id, date, title, slot_number, status, target_time, duration_minutes)
SELECT u.id, CURRENT_DATE, 'Review agenda mingguan', 2, 'pending', '16:00', 30
FROM users u
WHERE u.name = 'Demo'
  AND NOT EXISTS (
    SELECT 1 FROM priorities p
    WHERE p.user_id = u.id AND p.date = CURRENT_DATE AND p.slot_number = 2 AND p.deleted_at IS NULL
  );

INSERT INTO priorities (user_id, date, title, slot_number, status)
SELECT u.id, CURRENT_DATE, 'Ide: backlog untuk besok', NULL, 'waiting_box'
FROM users u
WHERE u.name = 'Demo'
  AND NOT EXISTS (
    SELECT 1 FROM priorities p
    WHERE p.user_id = u.id AND p.date = CURRENT_DATE AND p.status = 'waiting_box' AND p.deleted_at IS NULL
  );

INSERT INTO habits (user_id, name, baseline_desc, normal_desc)
SELECT u.id, 'Olahraga', '5x rep', '30x rep'
FROM users u
WHERE u.name = 'Demo'
  AND NOT EXISTS (SELECT 1 FROM habits h WHERE h.user_id = u.id AND h.name = 'Olahraga');

INSERT INTO habit_logs (habit_id, user_id, date, level)
SELECT h.id, h.user_id, CURRENT_DATE, 'baseline'
FROM habits h
JOIN users u ON u.id = h.user_id
WHERE u.name = 'Demo' AND h.name = 'Olahraga'
  AND NOT EXISTS (
    SELECT 1 FROM habit_logs l WHERE l.habit_id = h.id AND l.date = CURRENT_DATE
  );

INSERT INTO expenses (user_id, date, amount, note)
SELECT u.id, CURRENT_DATE, 25000, 'Kopi'
FROM users u
WHERE u.name = 'Demo'
  AND NOT EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.user_id = u.id AND e.date = CURRENT_DATE AND e.note = 'Kopi'
  );

INSERT INTO schedules (user_id, date, title, start_time, end_time, platform)
SELECT u.id, CURRENT_DATE + INTERVAL '1 day', 'Standup tim', '09:00', '09:30', 'meet'
FROM users u
WHERE u.name = 'Demo'
  AND NOT EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.user_id = u.id AND s.title = 'Standup tim'
  );
