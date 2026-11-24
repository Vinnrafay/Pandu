export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export const PLATFORMS = ['meet', 'zoom', 'teams', 'calendar'] as const;
export type SchedulePlatform = (typeof PLATFORMS)[number];

export const HABIT_LEVELS = ['none', 'baseline', 'normal'] as const;
export type HabitLevel = (typeof HABIT_LEVELS)[number];

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; message: string };

export interface ValidPriorityInput {
  title: string;
  slot_number: number | null;
  target_time?: string;
  duration_minutes?: number;
}

export interface ValidHabitInput {
  name: string;
  baseline_desc: string;
  normal_desc: string;
}

export interface ValidScheduleInput {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  platform: SchedulePlatform;
}

/**
 * Strips deployment (`/functions/v1/api`), frontend contract (`/api/v1`), and
 * gateway (`/api`) prefixes repeatedly so local, Vite proxy, and cloud requests
 * resolve to the same canonical route path.
 */
export function basePath(pathname: string): string {
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

/** Returns today's calendar date in Asia/Jakarta (`YYYY-MM-DD`). */
export function todayJakarta(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

/** Formats an ISO timestamp into `HH:MM` (24-hour) in Asia/Jakarta. */
export function jakartaTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

/** Validates both `YYYY-MM-DD` syntax and real calendar existence (rejects e.g. `2026-02-30`). */
export function isValidISODate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}

/** Validates 24-hour time syntax `HH:MM` or `HH:MM:SS`. */
export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** Shifts a `YYYY-MM-DD` date string by `delta` days in UTC. */
export function shiftDay(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split('T')[0] ?? isoDate;
}

/**
 * Counts consecutive logged days ending at `today`, or ending yesterday when
 * `today` has not been logged yet.
 */
export function streakFrom(loggedDays: Set<string>, today: string): number {
  let cursor = loggedDays.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (loggedDays.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

export function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function asIntId(segment: string): number | null {
  if (!/^\d+$/.test(segment)) return null;
  const id = Number(segment);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function timeToSeconds(time: string): number {
  const [h, m, s = '0'] = time.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function validatePriorityInput(
  body: Record<string, unknown>,
): ValidationResult<ValidPriorityInput> {
  const title = asString(body.title)?.trim() ?? '';
  if (title === '' || title.length > 200) {
    return { ok: false, message: 'title wajib 1-200 karakter' };
  }

  const slotRaw = body.slot_number ?? null;
  const slot_number =
    slotRaw === null
      ? null
      : typeof slotRaw === 'number' && [1, 2, 3].includes(slotRaw)
        ? slotRaw
        : -1;
  if (slot_number === -1) {
    return { ok: false, message: 'slot_number harus null atau 1-3' };
  }

  const targetRaw = asString(body.target_time);
  if (targetRaw !== null && !isValidTime(targetRaw)) {
    return { ok: false, message: 'target_time harus format HH:MM' };
  }

  const durRaw = body.duration_minutes ?? null;
  if (
    durRaw !== null &&
    !(typeof durRaw === 'number' && Number.isInteger(durRaw) && durRaw > 0 && durRaw <= 480)
  ) {
    return { ok: false, message: 'duration_minutes harus 1-480' };
  }

  return {
    ok: true,
    data: {
      title,
      slot_number,
      target_time: targetRaw ?? undefined,
      duration_minutes: typeof durRaw === 'number' ? durRaw : undefined,
    },
  };
}

export function validateHabitInput(
  body: Record<string, unknown>,
): ValidationResult<ValidHabitInput> {
  const name = asString(body.name)?.trim() ?? '';
  if (name === '' || name.length > 100) {
    return { ok: false, message: 'name wajib 1-100 karakter' };
  }

  return {
    ok: true,
    data: {
      name,
      baseline_desc: (asString(body.baseline_desc)?.trim() || 'Target Minimal').slice(0, 200),
      normal_desc: (asString(body.normal_desc)?.trim() || 'Target Penuh').slice(0, 200),
    },
  };
}

export function validateScheduleInput(
  body: Record<string, unknown>,
): ValidationResult<ValidScheduleInput> {
  const title = asString(body.title)?.trim() ?? '';
  if (title === '' || title.length > 200) {
    return { ok: false, message: 'title wajib 1-200 karakter' };
  }

  const date = asString(body.date) ?? '';
  const start_time = asString(body.start_time) ?? '';
  const end_time = asString(body.end_time) ?? '';
  if (!isValidISODate(date) || !isValidTime(start_time) || !isValidTime(end_time)) {
    return { ok: false, message: 'date/start_time/end_time tidak valid' };
  }

  if (timeToSeconds(end_time) <= timeToSeconds(start_time)) {
    return { ok: false, message: 'end_time harus setelah start_time' };
  }

  const platformRaw = asString(body.platform) ?? 'calendar';
  if (!(PLATFORMS as readonly string[]).includes(platformRaw)) {
    return { ok: false, message: 'platform tidak dikenal' };
  }

  return {
    ok: true,
    data: {
      title,
      date,
      start_time,
      end_time,
      platform: platformRaw as SchedulePlatform,
    },
  };
}
