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
} from 'lucide-react';
import type { IconName } from '@/lib/iconRegistry';

interface AppIconProps {
  name?: IconName;
  className?: string;
}

/**
 * Renders a curated Lucide icon statically by name (safe for React Compiler
 * `static-components` rule).
 */
export function AppIcon({ name = 'target', className }: AppIconProps) {
  switch (name) {
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'wallet':
      return <Wallet className={className} />;
    case 'piggybank':
      return <PiggyBank className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'code':
      return <Code2 className={className} />;
    case 'shopping':
      return <ShoppingBag className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'dumbbell':
      return <Dumbbell className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'folder':
      return <FolderKanban className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'target':
    default:
      return <Target className={className} />;
  }
}
