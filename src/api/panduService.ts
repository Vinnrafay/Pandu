import { api } from './client';
import type { DashboardData, Priority, Habit } from '../types/pandu';

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

export interface BackendDashboardResponse extends DashboardData {
  expenses?: ExpenseItem[];
  schedules?: ScheduleItem[];
}

export const panduService = {
  getDashboard: async (): Promise<BackendDashboardResponse> => {
    const { data } = await api.get<BackendDashboardResponse>('/pandu');
    return data;
  },

  // Priority
  createPriority: async (payload: {
    title: string;
    slot_number: number | null;
    target_time?: string;
    duration_minutes?: number;
  }): Promise<Priority> => {
    const { data } = await api.post<{ data: Priority }>('/pandu/priority', payload);
    return data.data;
  },

  togglePriority: async (id: number): Promise<Priority> => {
    const { data } = await api.patch<{ data: Priority }>(`/pandu/priority/${id}/toggle`);
    return data.data;
  },

  swapPriority: async (waitingId: number): Promise<void> => {
    await api.post('/pandu/priority/swap', { waiting_id: waitingId });
  },

  deletePriority: async (id: number): Promise<void> => {
  await api.delete(`/pandu/priority/${id}`);
},

  // Expenses & Budget
  createExpense: async (amount: number, note: string): Promise<ExpenseItem> => {
    const { data } = await api.post<{ data: ExpenseItem }>('/pandu/expense', { amount, note });
    return data.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`/pandu/expense/${id}`);
  },

  updateBudgetLimit: async (limit: number): Promise<void> => {
    await api.put('/pandu/budget-limit', { limit });
  },

  // Habits
  createHabit: async (habit: { name: string; baseline_desc: string; normal_desc: string }): Promise<Habit> => {
    const { data } = await api.post<{ data: Habit }>('/pandu/habits', habit);
    return data.data;
  },

  updateHabit: async (id: number, habit: { name: string; baseline_desc: string; normal_desc: string }): Promise<Habit> => {
    const { data } = await api.put<{ data: Habit }>(`/pandu/habits/${id}`, habit);
    return data.data;
  },

  deleteHabit: async (id: number): Promise<void> => {
    await api.delete(`/pandu/habits/${id}`);
  },

  logHabit: async (id: number, level: 'none' | 'baseline' | 'normal'): Promise<void> => {
    await api.post(`/pandu/habits/${id}/log`, { level });
  },

  // Schedules
  createSchedule: async (schedule: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> => {
    const { data } = await api.post<{ data: ScheduleItem }>('/pandu/schedules', schedule);
    return data.data;
  },

  updateSchedule: async (id: number, schedule: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> => {
    const { data } = await api.put<{ data: ScheduleItem }>(`/pandu/schedules/${id}`, schedule);
    return data.data;
  },

  deleteSchedule: async (id: number): Promise<void> => {
    await api.delete(`/pandu/schedules/${id}`);
  },
};