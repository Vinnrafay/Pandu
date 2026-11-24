import type { IconName } from '../lib/iconRegistry';

export type TabKind = 'overview' | 'tasking' | 'finance' | 'schedule' | 'habits';

export interface WorkspaceTab {
  id: string;
  title: string;
  kind: TabKind;
  icon: IconName;
  description?: string;
}

export interface TabKindOption {
  kind: TabKind;
  label: string;
  summary: string;
  defaultIcon: IconName;
}

export const TAB_KIND_OPTIONS: readonly TabKindOption[] = [
  {
    kind: 'tasking',
    label: 'Pembagian Tasking',
    summary: 'Fokus pada Prioritas Rule-of-3, kategori tugas, dan Kotak Tunggu khusus tab ini.',
    defaultIcon: 'target',
  },
  {
    kind: 'finance',
    label: 'Pembagian Uang',
    summary: 'Atur batas anggaran, pos amplop/kategori pengeluaran, dan riwayat transaksi.',
    defaultIcon: 'wallet',
  },
  {
    kind: 'schedule',
    label: 'Agenda & Jadwal',
    summary: 'Kelola daftar pertemuan, rapat, dan time-blocking harian.',
    defaultIcon: 'calendar',
  },
  {
    kind: 'habits',
    label: 'Daily Habits',
    summary: 'Pantau target minimal/penuh kebiasaan harian serta streak.',
    defaultIcon: 'flame',
  },
  {
    kind: 'overview',
    label: 'Ringkasan',
    summary: 'Tampilan ringkas status fokus, keuangan, jadwal, dan kebiasaan hari ini.',
    defaultIcon: 'sparkles',
  },
] as const;

export const DEFAULT_WORKSPACE_TABS: readonly WorkspaceTab[] = [
  {
    id: 'tab_overview',
    title: 'Ringkasan',
    kind: 'overview',
    icon: 'sparkles',
    description:
      'Lihat kondisi fokus, sisa jajan, jadwal, dan kebiasaanmu hari ini dalam satu pandang.',
  },
  {
    id: 'tab_tasking',
    title: 'Tasking',
    kind: 'tasking',
    icon: 'target',
    description:
      'Pilih 3 tugas paling penting hari ini, sisanya simpan dulu di Kotak Tunggu agar tetap fokus.',
  },
  {
    id: 'tab_finance',
    title: 'Pembagian Uang',
    kind: 'finance',
    icon: 'wallet',
    description:
      'Tentukan batas jajan harian, bagi ke beberapa pos pengeluaran, dan pantau riwayat transaksi.',
  },
  {
    id: 'tab_schedule',
    title: 'Agenda',
    kind: 'schedule',
    icon: 'calendar',
    description: 'Susun jadwal rapat dan waktu fokus supaya kegiatanmu tidak saling bertabrakan.',
  },
  {
    id: 'tab_habits',
    title: 'Kebiasaan',
    kind: 'habits',
    icon: 'flame',
    description:
      'Jaga konsistensi harian dengan pilihan target MIN saat sibuk, atau FULL saat sedang fit.',
  },
];

export interface BudgetAllocation {
  id: string;
  name: string;
  icon: IconName;
  allocated: number;
  spent: number;
}

export const DEFAULT_ALLOCATIONS: readonly BudgetAllocation[] = [
  { id: 'alloc_food', name: 'Makan & Minum', icon: 'coffee', allocated: 60000, spent: 0 },
  { id: 'alloc_transport', name: 'Transportasi', icon: 'rocket', allocated: 40000, spent: 0 },
  { id: 'alloc_needs', name: 'Kebutuhan Harian', icon: 'shopping', allocated: 50000, spent: 0 },
];
