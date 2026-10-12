import { api } from './client';
import type { DashboardData, Priority, Habit } from '../types/pandu';

export const panduService = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await api.get<DashboardData>('/pandu');
    return data;
  },

  togglePriority: async (id: number): Promise<Priority> => {
    const { data } = await api.patch<{ data: Priority }>(`/pandu/priority/${id}/toggle`);
    return data.data;
  },

  createPriority: async (title: string, slotNumber?: number | null): Promise<Priority> => {
    const { data } = await api.post<{ data: Priority }>('/pandu/priority', {
      title,
      slot_number: slotNumber ?? null,
    });
    return data.data;
  },

  createExpense: async (amount: number, note?: string): Promise<void> => {
    await api.post('/pandu/expense', { amount, note });
  },

  logHabit: async (id: number, level: 'none' | 'baseline' | 'normal'): Promise<Habit> => {
    const { data } = await api.post<{ data: Habit }>(`/pandu/habits/${id}/log`, { level });
    return data.data;
  },
};