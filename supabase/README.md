# Backend Pandu (Supabase)

Satu Edge Function `api` + migrasi Postgres. Kode di-commit; secrets hanya via env.

## Setup

```bash
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>   # atau: supabase init (baru)
supabase db push                             # 20261014 constraints, 20261015 guest_tokens
supabase db execute -f supabase/seed.sql     # opsional: data demo
# TIDAK perlu secrets set untuk SUPABASE_* — URL + service_role key
# otomatis tersedia di Edge Function. Langsung deploy:
supabase functions serve api                 # lokal: http://127.0.0.1:54321/functions/v1/api
supabase functions deploy api
```

Frontend (`VITE_API_URL`):

- Lokal: `http://127.0.0.1:54321/functions/v1/api`
- Cloud: `https://<project-ref>.supabase.co/functions/v1/api`

## Kontrak endpoint (semua di bawah base di atas)

Auth: `Authorization: Bearer <token>` kecuali `POST /auth/guest`.
Error selalu `{status, code, message}`.

| Method | Path                         | Body                                                          |
| ------ | ---------------------------- | ------------------------------------------------------------- |
| POST   | `/auth/guest`                | `{name}` -> `{data:{token, user}}`                            |
| GET    | `/dashboard?date=YYYY-MM-DD` | agregat hari itu (`spent` = SUM)                              |
| POST   | `/priorities`                | `{title, slot_number\|null, target_time?, duration_minutes?}` |
| PATCH  | `/priorities/:id/toggle`     | pending <-> completed                                         |
| POST   | `/priorities/swap`           | `{waiting_id}` (Slot 1 <-> waiting)                           |
| DELETE | `/priorities/:id`            | soft-delete                                                   |
| POST   | `/expenses`                  | `{amount, note}`                                              |
| DELETE | `/expenses/:id`              | hapus permanen                                                |
| PUT    | `/budgets`                   | `{limit_amount, date}` (upsert)                               |
| POST   | `/habits`                    | `{name, baseline_desc, normal_desc}`                          |
| PUT    | `/habits/:id`                | field yang sama                                               |
| DELETE | `/habits/:id`                | arsip (soft)                                                  |
| POST   | `/habits/:id/logs`           | `{level, date?}` (upsert idempotent)                          |
| POST   | `/schedules`                 | `{title, date, start_time, end_time, platform}` + cek overlap |
| PUT    | `/schedules/:id`             | field yang sama + cek overlap                                 |
| DELETE | `/schedules/:id`             | hapus permanen                                                |

## Catatan produksi

- Service-role bypass RLS: tambah RLS policies + anon key bila perlu hardening.
- CORS masih `*` (`_shared/cors.ts`) — kunci ke origin Vercel saat rilis.
- Swap prioritas best-effort (2 update); unique index anti-duplikat, frontend rollback + retry.
- Rate-limit / abuse protection: andalkan Supabase + tambah bila traffic naik.
