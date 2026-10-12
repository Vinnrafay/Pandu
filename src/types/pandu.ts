export interface Priority {
  id: number;
  title: string;
  slot_number: number | null;
  status: 'pending' | 'completed' | 'waiting_box';
  target_time?: string;      // Contoh: "14:30"
  duration_minutes?: number; // Contoh: 45
}

export interface Habit {
  id: number;
  name: string;
  baseline_desc: string;
  normal_desc: string;
  status: 'none' | 'baseline' | 'normal';
  streak: number;
}

export interface DashboardData {
  date: string;
  priorities: Priority[];
  waiting_box: Priority[];
  budget: {
    limit: number;
    spent: number;
  };
  habits: Habit[];
}