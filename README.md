# Pandu

Pandu adalah dashboard operasi harian yang bebas distraksi untuk menjaga fokus dan energi.
Ia menggabungkan metode prioritas Rule-of-3 dengan target waktu, batas pengeluaran
dinamis yang sadar defisit, pelacakan habit baseline, dan agenda harian dalam satu
layar yang kohesif.

Demo produksi: <https://halopandu.vercel.app>

## Fitur

- Prioritas Rule-of-3: maksimal 3 slot per hari + waiting box, lengkap dengan swap Slot 1.
- Anggaran dan pengeluaran: limit harian (upsert) dengan total belanja dihitung dari data.
- Habit: target baseline dan penuh, log harian idempoten, hitungan streak otomatis.
- Agenda: jadwal harian dengan validasi tumpang tindih.
- Auth tamu ringan: `POST /auth/guest {name}` menghasilkan token, tanpa password.
- Mode offline: cache-then-revalidate via localStorage saat server tidak terjangkau.

## Teknologi

- Frontend: React 19, Vite, Tailwind CSS, Axios.
- Backend: satu Supabase Edge Function (`api`) + Postgres (migrasi di `supabase/migrations`).
- Deploy: Vercel (frontend), Supabase Seoul `oyxaukbsqayokhmfwdxz` (database + function).

## Menjalankan lokal

```bash
npm install
cp .env.example .env
npm run dev
```

Isi `VITE_API_URL` di `.env`:

- Cloud (disarankan): `https://oyxaukbsqayokhmfwdxz.supabase.co/functions/v1/api`
- Kosong: request relatif `/api/...` lewat proxy vite saat dev.

Gerbang verifikasi sebelum commit:

```bash
npm run verify
```

Perintah ini menjalankan `type-check`, `lint`, `format:check`, `test`, dan `build`
berurutan.

## Backend (Supabase)

Ringkasan saja, detail lengkap ada di `supabase/README.md`:

```bash
supabase login
supabase link --project-ref oyxaukbsqayokhmfwdxz
supabase db push
supabase functions deploy api
```

`SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` otomatis tersedia di Edge Function,
tidak perlu `secrets set`. Endpoint mengikuti kontrak `src/api`
(`GET /dashboard`, `POST /auth/guest`, CRUD priorities/expenses/budgets/habits/schedules).

## Struktur project

```text
src/            frontend React (App, LandingPage, api, components, lib)
supabase/       backend: functions/api, _shared, migrations, seed.sql
public/         aset statis
```

## Skrip

| Perintah         | Kegunaan                              |
| ---------------- | ------------------------------------- |
| `npm run dev`    | dev server Vite                       |
| `npm run build`  | build produksi                        |
| `npm run test`   | unit test (vitest)                    |
| `npm run lint`   | eslint                                |
| `npm run verify` | gerbang verifikasi lengkap pre-commit |

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
