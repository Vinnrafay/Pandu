export type TaskCategory = 'utama' | 'kerja' | 'pribadi' | 'belajar' | 'keuangan';

export interface TaskCategoryMeta {
  key: TaskCategory;
  label: string;
  badgeClass: string;
}

export const TASK_CATEGORIES: readonly TaskCategoryMeta[] = [
  {
    key: 'utama',
    label: 'Fokus Utama',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    key: 'kerja',
    label: 'Pekerjaan',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'belajar',
    label: 'Belajar',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    key: 'keuangan',
    label: 'Keuangan',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    key: 'pribadi',
    label: 'Pribadi',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
] as const;

const CATEGORY_MAP: Record<TaskCategory, TaskCategoryMeta> = Object.fromEntries(
  TASK_CATEGORIES.map((c) => [c.key, c]),
) as Record<TaskCategory, TaskCategoryMeta>;

export function getTaskCategoryMeta(category?: TaskCategory): TaskCategoryMeta {
  if (!category) return CATEGORY_MAP.utama;
  return CATEGORY_MAP[category] ?? CATEGORY_MAP.utama;
}
