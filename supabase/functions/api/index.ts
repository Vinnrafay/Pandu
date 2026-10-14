// Pandu API — Supabase Edge Function tunggal.
// Deploy: supabase functions deploy api
// Lokal:   supabase functions serve api
// Frontend: VITE_API_URL=https://<ref>.supabase.co/functions/v1/api
//           (lokal: http://127.0.0.1:54321/functions/v1/api)
//
// Konvensi response mengikuti kontrak frontend (src/api):
// - GET /dashboard -> objek mentah {date, priorities, waiting_box, budget, habits, expenses, schedules}
// - create/update    -> {data: row}
// - error            -> {status, code, message} dengan HTTP status yang sesuai

import { handleOptions } from '../_shared/cors.ts';
import { fail, ok, raw } from '../_shared/json.ts';
import { newToken, requireUserId, type AuthContext } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/supabase.ts';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

// Hilangkan prefix deploy (/functions/v1/api), prefix kontrak frontend
// (/api/v1, lihat PREFIX di src/api/panduService.ts), dan prefix nama function
// (/api — gateway production memangkas /functions/v1 sebelum request sampai
// ke isolate) bila ada. Diulang sampai stabil agar semua kombinasi — lokal,
// proxy vite, maupun cloud — menghasilkan path kanonis yang sama:
// /dashboard, /priorities, ...
function basePath(pathname: string): string {
  let path = pathname;
  for (let i = 0; i < 4; i += 1) {
    const next = path
      .replace(/^\/functions\/v1\/api/, '')
      .replace(/^\/api\/v1/, '')
      .replace(/^\/api(?=\/|$)/, '');
    if (next === path) break;
    path = next;
  }
  return path === '' ? '/' : path;
}

function todayJakarta(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

function jakartaTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

function shiftDay(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split('T')[0] ?? isoDate;
}

// Streak = hari beruntun (s/d kemarin bila hari ini belum log) dengan level != 'none'.
function streakFrom(loggedDays: Set<string>, today: string): number {
  let cursor = loggedDays.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (loggedDays.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    if (typeof body === 'object' && body !== null) return body as Record<string, unknown>;
  } catch {
    // badan kosong / bukan JSON -> objek kosong, validasi di bawah yang menolak
  }
  return {};
}

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asIntId(segment: string): number | null {
  if (!/^\d+$/.test(segment)) return null;
  const id = Number(segment);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Petakan error PostgREST ke envelope API.
function dbError(error: { code?: string; message: string }): Response {
  if (error.code === 'PGRST116') {
    return fail(404, 'NOT_FOUND', 'Data tidak ditemukan');
  }
  if (error.code === '23505') {
    return fail(409, 'CONFLICT', 'Data bentrok: slot sudah terisi atau log hari ini sudah ada');
  }
  if (error.code === '23514' || error.code === '23502' || error.code === '22P02') {
    return fail(400, 'VALIDATION_ERROR', error.message);
  }
  return fail(500, 'INTERNAL_ERROR', 'Database error');
}

/* ---------------- dashboard ---------------- */

async function handleDashboard(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  url: URL,
): Promise<Response> {
  const date = url.searchParams.get('date') ?? todayJakarta();
  if (!DATE_RE.test(date)) {
    return fail(400, 'VALIDATION_ERROR', 'Query ?date= harus format YYYY-MM-DD');
  }

  const [prioritiesRes, budgetRes, expensesRes, habitsRes, logsRes, schedulesRes] =
    await Promise.all([
      supabase
        .from('priorities')
        .select('id,title,slot_number,status,target_time,duration_minutes')
        .eq('user_id', ctx.userId)
        .eq('date', date)
        .is('deleted_at', null)
        .order('slot_number', { ascending: true }),
      supabase
        .from('budgets')
        .select('limit_amount')
        .eq('user_id', ctx.userId)
        .eq('date', date)
        .maybeSingle(),
      supabase
        .from('expenses')
        .select('id,amount,note,occurred_at')
        .eq('user_id', ctx.userId)
        .eq('date', date)
        .order('occurred_at', { ascending: false })
        .limit(100),
      supabase
        .from('habits')
        .select('id,name,baseline_desc,normal_desc')
        .eq('user_id', ctx.userId)
        .is('archived_at', null)
        .order('id', { ascending: true }),
      supabase
        .from('habit_logs')
        .select('habit_id,date,level')
        .eq('user_id', ctx.userId)
        .order('date', { ascending: false })
        .limit(500),
      supabase
        .from('schedules')
        .select('id,title,date,start_time,end_time,platform')
        .eq('user_id', ctx.userId)
        .gte('date', date)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(100),
    ]);

  for (const res of [prioritiesRes, budgetRes, expensesRes, habitsRes, logsRes, schedulesRes]) {
    if (res.error !== null) return dbError(res.error);
  }

  const priorities = (prioritiesRes.data ?? []) as Record<string, unknown>[];
  const expenses = (expensesRes.data ?? []) as Record<string, unknown>[];
  const habits = (habitsRes.data ?? []) as Record<string, unknown>[];
  const logs = (logsRes.data ?? []) as Record<string, unknown>[];
  const schedules = (schedulesRes.data ?? []) as Record<string, unknown>[];

  const spent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const limitRow = budgetRes.data as { limit_amount: number } | null;

  const todayLevel = new Map<number, string>();
  const daysByHabit = new Map<number, Set<string>>();
  for (const log of logs) {
    const hid = Number(log.habit_id);
    const d = String(log.date);
    if (!daysByHabit.has(hid)) daysByHabit.set(hid, new Set());
    if (String(log.level) !== 'none') daysByHabit.get(hid)?.add(d);
    if (d === date) todayLevel.set(hid, String(log.level));
  }

  return raw({
    date,
    priorities: priorities.filter((p) => p.status !== 'waiting_box'),
    waiting_box: priorities.filter((p) => p.status === 'waiting_box'),
    budget: { limit: limitRow?.limit_amount ?? null, spent },
    habits: habits.map((h) => {
      const hid = Number(h.id);
      return {
        ...h,
        status: todayLevel.get(hid) ?? 'none',
        streak: streakFrom(daysByHabit.get(hid) ?? new Set(), date),
      };
    }),
    expenses: expenses.map((e) => ({
      id: e.id,
      amount: e.amount,
      note: e.note,
      time: jakartaTime(String(e.occurred_at)),
    })),
    schedules,
  });
}

/* ---------------- auth ---------------- */

async function handleAuthGuest(
  supabase: ReturnType<typeof serviceClient>,
  req: Request,
): Promise<Response> {
  const body = await readJson(req);
  const rawName = asString(body.name) ?? '';
  const name = rawName.trim().slice(0, 100) === '' ? 'Tamu' : rawName.trim().slice(0, 100);

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({ name })
    .select('id,name')
    .single();
  if (userError !== null || user === null)
    return dbError(userError ?? { message: 'Insert user gagal' });

  const token = newToken();
  const { error: tokenError } = await supabase
    .from('guest_tokens')
    .insert({ token, user_id: (user as { id: number }).id });
  if (tokenError !== null) return dbError(tokenError);

  return ok({ token, user });
}

/* ---------------- priorities ---------------- */

function validPriorityPayload(body: Record<string, unknown>): {
  title?: string;
  slot_number?: number | null;
  target_time?: string;
  duration_minutes?: number;
  error?: Response;
} {
  const title = asString(body.title)?.trim() ?? '';
  if (title === '' || title.length > 200) {
    return { error: fail(400, 'VALIDATION_ERROR', 'title wajib 1-200 karakter') };
  }
  const slotRaw = body.slot_number ?? null;
  const slot_number =
    slotRaw === null
      ? null
      : typeof slotRaw === 'number' && [1, 2, 3].includes(slotRaw)
        ? slotRaw
        : -1;
  if (slot_number === -1) {
    return { error: fail(400, 'VALIDATION_ERROR', 'slot_number harus null atau 1-3') };
  }
  const targetRaw = asString(body.target_time);
  if (targetRaw !== null && !TIME_RE.test(targetRaw)) {
    return { error: fail(400, 'VALIDATION_ERROR', 'target_time harus format HH:MM') };
  }
  const durRaw = body.duration_minutes ?? null;
  if (durRaw !== null && !(typeof durRaw === 'number' && durRaw > 0 && durRaw <= 480)) {
    return { error: fail(400, 'VALIDATION_ERROR', 'duration_minutes harus 1-480') };
  }
  return {
    title,
    slot_number,
    target_time: targetRaw ?? undefined,
    duration_minutes: typeof durRaw === 'number' ? durRaw : undefined,
  };
}

async function handleCreatePriority(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  url: URL,
): Promise<Response> {
  const parsed = validPriorityPayload(await readJson(req));
  if (parsed.error !== undefined) return parsed.error;
  const date = url.searchParams.get('date') ?? todayJakarta();
  if (!DATE_RE.test(date)) return fail(400, 'VALIDATION_ERROR', 'Query ?date= harus YYYY-MM-DD');

  const { data, error } = await supabase
    .from('priorities')
    .insert({
      user_id: ctx.userId,
      date,
      title: parsed.title,
      slot_number: parsed.slot_number,
      status: parsed.slot_number === null ? 'waiting_box' : 'pending',
      target_time: parsed.target_time ?? null,
      duration_minutes: parsed.duration_minutes ?? null,
    })
    .select('id,title,slot_number,status,target_time,duration_minutes')
    .single();
  if (error !== null) return dbError(error);
  return ok(data, 201);
}

async function handleTogglePriority(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  id: number,
): Promise<Response> {
  const { data: row, error: readError } = await supabase
    .from('priorities')
    .select('id,status')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .is('deleted_at', null)
    .maybeSingle();
  if (readError !== null) return dbError(readError);
  if (row === null || (row as { status: string }).status === 'waiting_box') {
    return fail(404, 'NOT_FOUND', `Prioritas ${id} tidak ditemukan`);
  }
  const next = (row as { status: string }).status === 'completed' ? 'pending' : 'completed';
  const { data, error } = await supabase
    .from('priorities')
    .update({ status: next })
    .eq('id', id)
    .select('id,title,slot_number,status,target_time,duration_minutes')
    .single();
  if (error !== null) return dbError(error);
  return ok(data);
}

// Best-effort swap Slot 1 <-> waiting item. Unique index mencegah duplikat slot;
// bila langkah kedua gagal, frontend rollback UI dan user dapat mengulang.
async function handleSwapPriority(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  url: URL,
): Promise<Response> {
  const body = await readJson(req);
  const waitingId = asNumber(body.waiting_id);
  if (waitingId === null || !Number.isSafeInteger(waitingId)) {
    return fail(400, 'VALIDATION_ERROR', 'waiting_id harus integer');
  }
  const date = url.searchParams.get('date') ?? todayJakarta();

  const { data: slotOne, error: slotError } = await supabase
    .from('priorities')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('date', date)
    .eq('slot_number', 1)
    .neq('status', 'waiting_box')
    .is('deleted_at', null)
    .maybeSingle();
  if (slotError !== null) return dbError(slotError);
  if (slotOne === null) return fail(404, 'NOT_FOUND', 'Slot 1 kosong');

  const park = await supabase
    .from('priorities')
    .update({ status: 'waiting_box', slot_number: null })
    .eq('id', (slotOne as { id: number }).id);
  if (park.error !== null) return dbError(park.error);

  const promote = await supabase
    .from('priorities')
    .update({ status: 'pending', slot_number: 1 })
    .eq('id', waitingId)
    .eq('user_id', ctx.userId)
    .eq('status', 'waiting_box')
    .is('deleted_at', null);
  if (promote.error !== null) return dbError(promote.error);
  return ok({ swapped: true });
}

async function handleDeletePriority(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  id: number,
): Promise<Response> {
  const { error } = await supabase
    .from('priorities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .is('deleted_at', null);
  if (error !== null) return dbError(error);
  return ok({ deleted: true });
}

/* ---------------- expenses & budget ---------------- */

async function handleCreateExpense(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  url: URL,
): Promise<Response> {
  const body = await readJson(req);
  const amount = asNumber(body.amount);
  if (amount === null || !Number.isInteger(amount) || amount <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'amount harus integer > 0');
  }
  const note = (asString(body.note)?.trim() || 'Pengeluaran').slice(0, 200);
  const date = url.searchParams.get('date') ?? todayJakarta();

  const { data, error } = await supabase
    .from('expenses')
    .insert({ user_id: ctx.userId, date, amount, note })
    .select('id,amount,note,occurred_at')
    .single();
  if (error !== null) return dbError(error);
  const row = data as { id: number; amount: number; note: string; occurred_at: string };
  return ok(
    { id: row.id, amount: row.amount, note: row.note, time: jakartaTime(row.occurred_at) },
    201,
  );
}

async function handleDeleteExpense(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  id: number,
): Promise<Response> {
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', ctx.userId);
  if (error !== null) return dbError(error);
  return ok({ deleted: true });
}

async function handleUpsertBudget(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
): Promise<Response> {
  const body = await readJson(req);
  const limit = asNumber(body.limit_amount);
  if (limit === null || !Number.isInteger(limit) || limit <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'limit_amount harus integer > 0');
  }
  const date = asString(body.date) ?? todayJakarta();
  if (!DATE_RE.test(date)) return fail(400, 'VALIDATION_ERROR', 'date harus YYYY-MM-DD');

  const { error } = await supabase
    .from('budgets')
    .upsert({ user_id: ctx.userId, date, limit_amount: limit }, { onConflict: 'user_id,date' });
  if (error !== null) return dbError(error);
  return ok({ saved: true });
}

/* ---------------- habits ---------------- */

function validHabitPayload(body: Record<string, unknown>): {
  fields?: { name: string; baseline_desc: string; normal_desc: string };
  error?: Response;
} {
  const name = asString(body.name)?.trim() ?? '';
  if (name === '' || name.length > 100) {
    return { error: fail(400, 'VALIDATION_ERROR', 'name wajib 1-100 karakter') };
  }
  return {
    fields: {
      name,
      baseline_desc: (asString(body.baseline_desc)?.trim() || 'Target Minimal').slice(0, 200),
      normal_desc: (asString(body.normal_desc)?.trim() || 'Target Penuh').slice(0, 200),
    },
  };
}

async function handleCreateHabit(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
): Promise<Response> {
  const parsed = validHabitPayload(await readJson(req));
  if (parsed.error !== undefined) return parsed.error;
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: ctx.userId, ...parsed.fields })
    .select('id,name,baseline_desc,normal_desc')
    .single();
  if (error !== null) return dbError(error);
  return ok({ ...(data as Record<string, unknown>), status: 'none', streak: 0 }, 201);
}

async function handleUpdateHabit(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  id: number,
): Promise<Response> {
  const parsed = validHabitPayload(await readJson(req));
  if (parsed.error !== undefined) return parsed.error;
  const { data, error } = await supabase
    .from('habits')
    .update(parsed.fields)
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .select('id,name,baseline_desc,normal_desc')
    .single();
  if (error !== null) return dbError(error);
  if (data === null) return fail(404, 'NOT_FOUND', `Habit ${id} tidak ditemukan`);
  return ok(data);
}

async function handleDeleteHabit(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  id: number,
): Promise<Response> {
  const { error } = await supabase
    .from('habits')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', ctx.userId);
  if (error !== null) return dbError(error);
  return ok({ deleted: true });
}

async function handleLogHabit(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  id: number,
): Promise<Response> {
  const body = await readJson(req);
  const level = asString(body.level);
  if (level !== 'none' && level !== 'baseline' && level !== 'normal') {
    return fail(400, 'VALIDATION_ERROR', 'level harus none|baseline|normal');
  }
  const date = asString(body.date) ?? todayJakarta();
  if (!DATE_RE.test(date)) return fail(400, 'VALIDATION_ERROR', 'date harus YYYY-MM-DD');

  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (habitError !== null) return dbError(habitError);
  if (habit === null) return fail(404, 'NOT_FOUND', `Habit ${id} tidak ditemukan`);

  const { error } = await supabase
    .from('habit_logs')
    .upsert({ habit_id: id, user_id: ctx.userId, date, level }, { onConflict: 'habit_id,date' });
  if (error !== null) return dbError(error);
  return ok({ logged: true });
}

/* ---------------- schedules ---------------- */

function validSchedulePayload(body: Record<string, unknown>): {
  fields?: { title: string; date: string; start_time: string; end_time: string; platform: string };
  error?: Response;
} {
  const title = asString(body.title)?.trim() ?? '';
  if (title === '' || title.length > 200) {
    return { error: fail(400, 'VALIDATION_ERROR', 'title wajib 1-200 karakter') };
  }
  const date = asString(body.date) ?? '';
  const start_time = asString(body.start_time) ?? '';
  const end_time = asString(body.end_time) ?? '';
  if (!DATE_RE.test(date) || !TIME_RE.test(start_time) || !TIME_RE.test(end_time)) {
    return { error: fail(400, 'VALIDATION_ERROR', 'date/start_time/end_time tidak valid') };
  }
  if (end_time <= start_time) {
    return { error: fail(400, 'VALIDATION_ERROR', 'end_time harus setelah start_time') };
  }
  const platform = asString(body.platform) ?? 'calendar';
  if (!['meet', 'zoom', 'teams', 'calendar'].includes(platform)) {
    return { error: fail(400, 'VALIDATION_ERROR', 'platform tidak dikenal') };
  }
  return { fields: { title, date, start_time, end_time, platform } };
}

async function scheduleOverlaps(
  supabase: ReturnType<typeof serviceClient>,
  userId: number,
  date: string,
  start: string,
  end: string,
  excludeId?: number,
): Promise<boolean> {
  let query = supabase
    .from('schedules')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .lt('start_time', end)
    .gt('end_time', start)
    .limit(1);
  if (excludeId !== undefined) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error !== null) return false;
  return (data?.length ?? 0) > 0;
}

async function handleCreateSchedule(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
): Promise<Response> {
  const parsed = validSchedulePayload(await readJson(req));
  if (parsed.error !== undefined) return parsed.error;
  const fields = parsed.fields as {
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    platform: string;
  };
  if (
    await scheduleOverlaps(supabase, ctx.userId, fields.date, fields.start_time, fields.end_time)
  ) {
    return fail(409, 'CONFLICT', 'Jadwal tumpang tindih dengan agenda lain');
  }
  const { data, error } = await supabase
    .from('schedules')
    .insert({ user_id: ctx.userId, ...fields })
    .select('id,title,date,start_time,end_time,platform')
    .single();
  if (error !== null) return dbError(error);
  return ok(data, 201);
}

async function handleUpdateSchedule(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  id: number,
): Promise<Response> {
  const parsed = validSchedulePayload(await readJson(req));
  if (parsed.error !== undefined) return parsed.error;
  const fields = parsed.fields as {
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    platform: string;
  };
  if (
    await scheduleOverlaps(
      supabase,
      ctx.userId,
      fields.date,
      fields.start_time,
      fields.end_time,
      id,
    )
  ) {
    return fail(409, 'CONFLICT', 'Jadwal tumpang tindih dengan agenda lain');
  }
  const { data, error } = await supabase
    .from('schedules')
    .update(fields)
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .select('id,title,date,start_time,end_time,platform')
    .single();
  if (error !== null) return dbError(error);
  if (data === null) return fail(404, 'NOT_FOUND', `Agenda ${id} tidak ditemukan`);
  return ok(data);
}

async function handleDeleteSchedule(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  id: number,
): Promise<Response> {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)
    .eq('user_id', ctx.userId);
  if (error !== null) return dbError(error);
  return ok({ deleted: true });
}

/* ---------------- router ---------------- */

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();

  let supabase: ReturnType<typeof serviceClient>;
  try {
    supabase = serviceClient();
  } catch {
    return fail(500, 'INTERNAL_ERROR', 'Server belum dikonfigurasi (secrets hilang)');
  }

  const url = new URL(req.url);
  const path = basePath(url.pathname);
  const seg = path.split('/').filter((s) => s !== '');
  const method = req.method;

  try {
    // Publik: penerbitan token guest.
    if (method === 'POST' && path === '/auth/guest') {
      return await handleAuthGuest(supabase, req);
    }

    // Privat: semua route lain butuh Bearer token.
    const { ctx, error: authError } = await requireUserId(supabase, req);
    if (authError !== undefined || ctx === undefined) return authError as Response;

    if (method === 'GET' && path === '/dashboard') {
      return await handleDashboard(supabase, ctx, url);
    }
    if (method === 'POST' && path === '/priorities') {
      return await handleCreatePriority(supabase, ctx, req, url);
    }
    if (seg[0] === 'priorities' && seg[2] === 'toggle' && method === 'PATCH') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID prioritas tidak valid');
      return await handleTogglePriority(supabase, ctx, id);
    }
    if (method === 'POST' && path === '/priorities/swap') {
      return await handleSwapPriority(supabase, ctx, req, url);
    }
    if (seg[0] === 'priorities' && seg.length === 2 && method === 'DELETE') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID prioritas tidak valid');
      return await handleDeletePriority(supabase, ctx, id);
    }
    if (method === 'POST' && path === '/expenses') {
      return await handleCreateExpense(supabase, ctx, req, url);
    }
    if (seg[0] === 'expenses' && seg.length === 2 && method === 'DELETE') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID transaksi tidak valid');
      return await handleDeleteExpense(supabase, ctx, id);
    }
    if (method === 'PUT' && path === '/budgets') {
      return await handleUpsertBudget(supabase, ctx, req);
    }
    if (method === 'POST' && path === '/habits') {
      return await handleCreateHabit(supabase, ctx, req);
    }
    if (seg[0] === 'habits' && seg.length === 2 && method === 'PUT') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID habit tidak valid');
      return await handleUpdateHabit(supabase, ctx, req, id);
    }
    if (seg[0] === 'habits' && seg.length === 2 && method === 'DELETE') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID habit tidak valid');
      return await handleDeleteHabit(supabase, ctx, id);
    }
    if (seg[0] === 'habits' && seg[2] === 'logs' && method === 'POST') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID habit tidak valid');
      return await handleLogHabit(supabase, ctx, req, id);
    }
    if (method === 'POST' && path === '/schedules') {
      return await handleCreateSchedule(supabase, ctx, req);
    }
    if (seg[0] === 'schedules' && seg.length === 2 && method === 'PUT') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID agenda tidak valid');
      return await handleUpdateSchedule(supabase, ctx, req, id);
    }
    if (seg[0] === 'schedules' && seg.length === 2 && method === 'DELETE') {
      const id = asIntId(seg[1] ?? '');
      if (id === null) return fail(400, 'VALIDATION_ERROR', 'ID agenda tidak valid');
      return await handleDeleteSchedule(supabase, ctx, id);
    }

    return fail(404, 'NOT_FOUND', `Route ${method} ${path} tidak dikenal`);
  } catch (e) {
    return fail(500, 'INTERNAL_ERROR', e instanceof Error ? e.message : 'Unexpected error');
  }
});
