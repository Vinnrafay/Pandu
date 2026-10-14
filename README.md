# Pandu

Pandu adalah dashboard operasi harian yang bebas distraksi untuk menjaga fokus dan energi.
Ia menggabungkan metode prioritas Rule-of-3 dengan target waktu, batas pengeluaran
dinamis yang sadar defisit, pelacakan habit baseline, dan agenda harian dalam satu
layar yang kohesif.

Link: <https://halopandu.vercel.app>

## Riwayat versi

### v0.4.0 — Rilis produksi (14 Okt 2026)

- Deploy frontend ke `https://halopandu.vercel.app`.
- CORS Edge Function dikunci ke origin Vercel.
- Perbaikan routing `basePath` agar prefix `/api/v1` frontend dikenali backend cloud.
- Link dan push database ke project Seoul `oyxaukbsqayokhmfwdxz`.

### v0.3.0 — Backend Supabase (14 Okt 2026)

- Scaffold Edge Function `api` dengan auth tamu (`guest_tokens`, expiry 30 hari).
- Migrasi Postgres: Rule-of-3 constraints, budget, habit idempotency, schedule overlap.
- Seed demo idempoten (`supabase/seed.sql`).

### v0.2.0 — Kontrak API dan dashboard (13 Okt 2026)

- Standardisasi kontrak service v1 (expenses, schedules, dashboard).
- Mutasi rollback-safe dengan ID server dan cache per tanggal.
- Landing page dengan modal login tamu.

### v0.1.0 — Fondasi (awal Okt 2026)

- Inisialisasi project React + Vite + TypeScript + Tailwind.
- Helper format dan ikon brand bersama.
- Quality gate: prettier, eslint, vitest, `npm run verify`.
