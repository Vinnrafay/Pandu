import {
  BookOpen,
  Briefcase,
  Calendar,
  Code2,
  Coffee,
  Dumbbell,
  Flame,
  FolderKanban,
  Heart,
  Home,
  PiggyBank,
  Rocket,
  ShoppingBag,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type IconName =
  | 'target'
  | 'briefcase'
  | 'wallet'
  | 'calendar'
  | 'flame'
  | 'book'
  | 'code'
  | 'shopping'
  | 'coffee'
  | 'heart'
  | 'dumbbell'
  | 'home'
  | 'rocket'
  | 'folder'
  | 'sparkles'
  | 'piggybank';

export interface IconOption {
  name: IconName;
  label: string;
  Icon: LucideIcon;
}

export const ICON_OPTIONS: readonly IconOption[] = [
  { name: 'target', label: 'Fokus', Icon: Target },
  { name: 'briefcase', label: 'Kerja', Icon: Briefcase },
  { name: 'wallet', label: 'Uang', Icon: Wallet },
  { name: 'piggybank', label: 'Tabungan', Icon: PiggyBank },
  { name: 'calendar', label: 'Jadwal', Icon: Calendar },
  { name: 'flame', label: 'Habit', Icon: Flame },
  { name: 'book', label: 'Belajar', Icon: BookOpen },
  { name: 'code', label: 'Coding', Icon: Code2 },
  { name: 'shopping', label: 'Belanja', Icon: ShoppingBag },
  { name: 'coffee', label: 'Santai', Icon: Coffee },
  { name: 'dumbbell', label: 'Olahraga', Icon: Dumbbell },
  { name: 'heart', label: 'Kesehatan', Icon: Heart },
  { name: 'home', label: 'Rumah', Icon: Home },
  { name: 'rocket', label: 'Proyek', Icon: Rocket },
  { name: 'folder', label: 'Arsip', Icon: FolderKanban },
  { name: 'sparkles', label: 'Ringkasan', Icon: Sparkles },
] as const;

const ICON_MAP: Record<IconName, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map((opt) => [opt.name, opt.Icon]),
) as Record<IconName, LucideIcon>;

export function getIconComponent(name?: IconName): LucideIcon {
  if (!name) return Target;
  return ICON_MAP[name] ?? Target;
}
