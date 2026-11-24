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

import { newToken, requireUserId, type AuthContext } from '../_shared/auth.ts';
import { handleOptions } from '../_shared/cors.ts';
import {
  asIntId,
  asNumber,
  asString,
  basePath,
  HABIT_LEVELS,
  isValidISODate,
  jakartaTime,
  streakFrom,
  todayJakarta,
  validateHabitInput,
  validatePriorityInput,
  validateScheduleInput,
} from '../_shared/domain.ts';
import { fail, ok, raw } from '../_shared/json.ts';
import { serviceClient } from '../_shared/supabase.ts';

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    if (typeof body === 'object' && body !== null) return body as Record<string, unknown>;
  } catch {
    // badan kosong / bukan JSON -> objek kosong, validasi di bawah yang menolak
  }
  return {};
}

// Petakan error PostgREST ke envelope API.
function dbError(error: { code?: string; message: string }): Response {
  if (error.code === 'PGRST116') {
    return fail(404, 'NOT_FOUND', 'Data tidak ditemukan');
  }
  if (error.code === '23505') {
    return fail(409, 'CONFLICT', 'Data bentrok: slot sudah terisi atau log hari ini sudah ada');
  }
  if (
    error.code === '23514' ||
    error.code === '23502' ||
    error.code === '22P02' ||
    error.code === '22007' ||
    error.code === '22008'
  ) {
    return fail(400, 'VALIDATION_ERROR', error.message);
  }
  return fail(500, 'INTERNAL_ERROR', 'Database error');
}

function resolveQueryDate(url: URL): { date?: string; error?: Response } {
  const date = url.searchParams.get('date') ?? todayJakarta();
  if (!isValidISODate(date)) {
    return { error: fail(400, 'VALIDATION_ERROR', 'Query ?date= harus format YYYY-MM-DD') };
  }
  return { date };
}

/* ---------------- dashboard ---------------- */

async function handleDashboard(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  url: URL,
): Promise<Response> {
  const { date, error: dateError } = resolveQueryDate(url);
  if (dateError !== undefined || date === undefined) return dateError as Response;

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
  const trimmed = rawName.trim().slice(0, 100);
  const name = trimmed === '' ? 'Tamu' : trimmed;

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({ name })
    .select('id,name')
    .single();
  if (userError !== null || user === null) {
    return dbError(userError ?? { message: 'Insert user gagal' });
  }

  const token = newToken();
  const { error: tokenError } = await supabase
    .from('guest_tokens')
    .insert({ token, user_id: (user as { id: number }).id });
  if (tokenError !== null) return dbError(tokenError);

  return ok({ token, user });
}

/* ---------------- priorities ---------------- */

async function handleCreatePriority(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  url: URL,
): Promise<Response> {
  const parsed = validatePriorityInput(await readJson(req));
  if (!parsed.ok) return fail(400, 'VALIDATION_ERROR', parsed.message);

  const { date, error: dateError } = resolveQueryDate(url);
  if (dateError !== undefined || date === undefined) return dateError as Response;

  const { data, error } = await supabase
    .from('priorities')
    .insert({
      user_id: ctx.userId,
      date,
      title: parsed.data.title,
      slot_number: parsed.data.slot_number,
      status: parsed.data.slot_number === null ? 'waiting_box' : 'pending',
      target_time: parsed.data.target_time ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
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
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .is('deleted_at', null)
    .select('id,title,slot_number,status,target_time,duration_minutes')
    .maybeSingle();
  if (error !== null) return dbError(error);
  if (data === null) return fail(404, 'NOT_FOUND', `Prioritas ${id} tidak ditemukan`);
  return ok(data);
}

// Swap Slot 1 <-> waiting item dengan pre-check kedua baris dan kompensasi rollback
// bila promosi gagal agar Slot 1 tidak ditinggalkan kosong.
async function handleSwapPriority(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
  url: URL,
): Promise<Response> {
  const body = await readJson(req);
  const waitingId = asNumber(body.waiting_id);
  if (waitingId === null || !Number.isSafeInteger(waitingId) || waitingId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'waiting_id harus integer positif');
  }
  const { date, error: dateError } = resolveQueryDate(url);
  if (dateError !== undefined || date === undefined) return dateError as Response;

  const [slotOneRes, waitingRes] = await Promise.all([
    supabase
      .from('priorities')
      .select('id,status')
      .eq('user_id', ctx.userId)
      .eq('date', date)
      .eq('slot_number', 1)
      .neq('status', 'waiting_box')
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('priorities')
      .select('id')
      .eq('id', waitingId)
      .eq('user_id', ctx.userId)
      .eq('status', 'waiting_box')
      .is('deleted_at', null)
      .maybeSingle(),
  ]);

  if (slotOneRes.error !== null) return dbError(slotOneRes.error);
  if (waitingRes.error !== null) return dbError(waitingRes.error);

  const slotOne = slotOneRes.data as { id: number; status: string } | null;
  if (slotOne === null) return fail(404, 'NOT_FOUND', 'Slot 1 kosong');
  if (waitingRes.data === null) {
    return fail(404, 'NOT_FOUND', 'Tugas kotak tunggu tidak ditemukan');
  }

  const now = new Date().toISOString();
  const park = await supabase
    .from('priorities')
    .update({ status: 'waiting_box', slot_number: null, updated_at: now })
    .eq('id', slotOne.id)
    .eq('user_id', ctx.userId)
    .is('deleted_at', null);
  if (park.error !== null) return dbError(park.error);

  const promote = await supabase
    .from('priorities')
    .update({ status: 'pending', slot_number: 1, date, updated_at: now })
    .eq('id', waitingId)
    .eq('user_id', ctx.userId)
    .eq('status', 'waiting_box')
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (promote.error !== null || promote.data === null) {
    await supabase
      .from('priorities')
      .update({ status: slotOne.status, slot_number: 1, updated_at: new Date().toISOString() })
      .eq('id', slotOne.id)
      .eq('user_id', ctx.userId);

    if (promote.error !== null) return dbError(promote.error);
    return fail(404, 'NOT_FOUND', 'Tugas kotak tunggu tidak ditemukan');
  }

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
  const { date, error: dateError } = resolveQueryDate(url);
  if (dateError !== undefined || date === undefined) return dateError as Response;

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
  if (!isValidISODate(date)) return fail(400, 'VALIDATION_ERROR', 'date harus YYYY-MM-DD');

  const { error } = await supabase
    .from('budgets')
    .upsert({ user_id: ctx.userId, date, limit_amount: limit }, { onConflict: 'user_id,date' });
  if (error !== null) return dbError(error);
  return ok({ saved: true });
}

/* ---------------- habits ---------------- */

async function handleCreateHabit(
  supabase: ReturnType<typeof serviceClient>,
  ctx: AuthContext,
  req: Request,
): Promise<Response> {
  const parsed = validateHabitInput(await readJson(req));
  if (!parsed.ok) return fail(400, 'VALIDATION_ERROR', parsed.message);

  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: ctx.userId, ...parsed.data })
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
  const parsed = validateHabitInput(await readJson(req));
  if (!parsed.ok) return fail(400, 'VALIDATION_ERROR', parsed.message);

  const { data, error } = await supabase
    .from('habits')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .is('archived_at', null)
    .select('id,name,baseline_desc,normal_desc')
    .maybeSingle();
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
    .eq('user_id', ctx.userId)
    .is('archived_at', null);
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
  if (level === null || !(HABIT_LEVELS as readonly string[]).includes(level)) {
    return fail(400, 'VALIDATION_ERROR', 'level harus none|baseline|normal');
  }
  const date = asString(body.date) ?? todayJakarta();
  if (!isValidISODate(date)) return fail(400, 'VALIDATION_ERROR', 'date harus YYYY-MM-DD');

  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .is('archived_at', null)
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
  const parsed = validateScheduleInput(await readJson(req));
  if (!parsed.ok) return fail(400, 'VALIDATION_ERROR', parsed.message);
  const fields = parsed.data;

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
  const parsed = validateScheduleInput(await readJson(req));
  if (!parsed.ok) return fail(400, 'VALIDATION_ERROR', parsed.message);
  const fields = parsed.data;

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
    .maybeSingle();
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
