import { api } from './client';
import type { DashboardData, Habit, Priority } from '../types/pandu';

export interface ExpenseItem {
  id: number;
  amount: number;
  note: string;
  time: string;
}

export type PlatformType = 'meet' | 'zoom' | 'teams' | 'calendar';

export interface ScheduleItem {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  platform: PlatformType;
}

interface RawScheduleRow {
  id: number;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  platform: PlatformType;
}

interface RawBudget {
  limit?: number;
  spent: number;
  limit_amount?: number | null;
}

interface RawDashboard {
  date: string;
  priorities: Priority[];
  waiting_box: Priority[];
  budget: RawBudget;
  habits: Habit[];
  expenses?: ExpenseItem[];
  schedules?: RawScheduleRow[];
}

export interface BackendDashboardResponse extends DashboardData {
  expenses?: ExpenseItem[];
  schedules?: ScheduleItem[];
}

const PREFIX = '/api/v1';

function unwrap<T>(payload: T | { data: T }): T {
  if (payload !== null && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function normalizeSchedule(row: RawScheduleRow): ScheduleItem {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.startTime ?? row.start_time ?? '',
    endTime: row.endTime ?? row.end_time ?? '',
    platform: row.platform,
  };
}

function toBackendSchedule(schedule: Omit<ScheduleItem, 'id'>): {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  platform: PlatformType;
} {
  return {
    title: schedule.title,
    date: schedule.date,
    start_time: schedule.startTime,
    end_time: schedule.endTime,
    platform: schedule.platform,
  };
}

function normalizeDashboard(raw: RawDashboard): BackendDashboardResponse {
  return {
    date: raw.date,
    priorities: Array.isArray(raw.priorities) ? raw.priorities : [],
    waiting_box: Array.isArray(raw.waiting_box) ? raw.waiting_box : [],
    budget: {
      limit: raw.budget.limit ?? raw.budget.limit_amount ?? 150000,
      spent: raw.budget.spent ?? 0,
    },
    habits: Array.isArray(raw.habits) ? raw.habits : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    schedules: Array.isArray(raw.schedules) ? raw.schedules.map(normalizeSchedule) : [],
  };
}

function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

export const panduService = {
  /** Best-effort guest token exchange. Return null bila backend belum ada. */
  authGuest: async (name: string): Promise<string | null> => {
    try {
      const { data } = await api.post<{ token: string } | { data: { token: string } }>(
        `${PREFIX}/auth/guest`,
        { name },
      );
      const unwrapped = unwrap<{ token: string }>(
        data as { token: string } | { data: { token: string } },
      );
      return unwrapped.token ?? null;
    } catch {
      return null;
    }
  },

  getDashboard: async (date?: string): Promise<BackendDashboardResponse> => {
    const { data } = await api.get<RawDashboard | { data: RawDashboard }>(`${PREFIX}/dashboard`, {
      params: date ? { date } : undefined,
    });
    return normalizeDashboard(unwrap<RawDashboard>(data));
  },

  // Priority — swap Slot 1 <-> waiting_box harus 1 transaksi di backend
  createPriority: async (payload: {
    title: string;
    slot_number: number | null;
    target_time?: string;
    duration_minutes?: number;
  }): Promise<Priority> => {
    const { data } = await api.post<Priority | { data: Priority }>(`${PREFIX}/priorities`, payload);
    return unwrap<Priority>(data);
  },

  togglePriority: async (id: number): Promise<Priority> => {
    const { data } = await api.patch<Priority | { data: Priority }>(
      `${PREFIX}/priorities/${id}/toggle`,
    );
    return unwrap<Priority>(data);
  },

  swapPriority: async (waitingId: number): Promise<void> => {
    await api.post(`${PREFIX}/priorities/swap`, { waiting_id: waitingId });
  },

  deletePriority: async (id: number): Promise<void> => {
    await api.delete(`${PREFIX}/priorities/${id}`);
  },

  // Expenses & Budget — spent = SUM() server-side, jangan dihitung di client
  createExpense: async (amount: number, note: string): Promise<ExpenseItem> => {
    const { data } = await api.post<ExpenseItem | { data: ExpenseItem }>(`${PREFIX}/expenses`, {
      amount,
      note,
    });
    return unwrap<ExpenseItem>(data);
  },

  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`${PREFIX}/expenses/${id}`);
  },

  updateBudgetLimit: async (limit: number, date?: string): Promise<void> => {
    await api.put(`${PREFIX}/budgets`, {
      limit_amount: limit,
      date: date ?? todayISODate(),
    });
  },

  // Habits — log idempotent per (habit_id, date), streak dihitung server
  createHabit: async (habit: {
    name: string;
    baseline_desc: string;
    normal_desc: string;
  }): Promise<Habit> => {
    const { data } = await api.post<Habit | { data: Habit }>(`${PREFIX}/habits`, habit);
    return unwrap<Habit>(data);
  },

  updateHabit: async (
    id: number,
    habit: { name: string; baseline_desc: string; normal_desc: string },
  ): Promise<Habit> => {
    const { data } = await api.put<Habit | { data: Habit }>(`${PREFIX}/habits/${id}`, habit);
    return unwrap<Habit>(data);
  },

  deleteHabit: async (id: number): Promise<void> => {
    await api.delete(`${PREFIX}/habits/${id}`);
  },

  logHabit: async (
    id: number,
    level: 'none' | 'baseline' | 'normal',
    date?: string,
  ): Promise<void> => {
    await api.post(`${PREFIX}/habits/${id}/logs`, { level, date: date ?? todayISODate() });
  },

  // Schedules — frontend camelCase, backend snake_case (dikonversi di sini)
  createSchedule: async (schedule: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> => {
    const { data } = await api.post<RawScheduleRow | { data: RawScheduleRow }>(
      `${PREFIX}/schedules`,
      toBackendSchedule(schedule),
    );
    return normalizeSchedule(unwrap<RawScheduleRow>(data));
  },

  updateSchedule: async (id: number, schedule: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> => {
    const { data } = await api.put<RawScheduleRow | { data: RawScheduleRow }>(
      `${PREFIX}/schedules/${id}`,
      toBackendSchedule(schedule),
    );
    return normalizeSchedule(unwrap<RawScheduleRow>(data));
  },

  deleteSchedule: async (id: number): Promise<void> => {
    await api.delete(`${PREFIX}/schedules/${id}`);
  },
};
