export interface Priority {
  id: number;
  title: string;
  slot_number: number | null; // 1, 2, 3 atau null jika di Kotak Tunggu
  status: 'pending' | 'completed' | 'waiting_box';
}

export interface Habit {
  id: number;
  name: string;
  baseline_desc: string; // Target darurat
  normal_desc: string;   // Target penuh
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