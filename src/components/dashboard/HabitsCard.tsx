import { memo } from 'react';
import { Flame, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconComponent } from '@/lib/iconRegistry';
import type { Habit } from '@/types/pandu';
import { cn } from '@/lib/utils';

interface Props {
  habits: Habit[];
  onAdd: () => void;
  onEdit: (h: Habit) => void;
  onToggle: (id: number, level: 'baseline' | 'normal') => void;
}

function HabitsCard({ habits, onAdd, onEdit, onToggle }: Props) {
  return (
    <Card>
      <CardHeader data-border className="flex-row items-start justify-between space-y-0 pb-4 gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-4" /> Daily Habits
          </CardTitle>
          <CardDescription className="mt-1">
            Pilih MIN saat energi rendah agar streak tetap hidup, atau FULL saat optimal.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={onAdd}>
          <Plus className="size-3.5" /> Tambah Habit
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {habits.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            Belum ada daily habit. Klik{' '}
            <span className="font-semibold text-foreground">+ Tambah Habit</span> untuk menambahkan.
          </div>
        ) : (
          habits.map((habit) => {
            const HabitIcon = getIconComponent(habit.icon ?? 'flame');
            return (
              <div
                key={habit.id}
                className="p-3 bg-muted rounded-lg flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-card border flex items-center justify-center shrink-0">
                    <HabitIcon className="size-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate">{habit.name}</span>
                      <Badge variant="secondary" className="tabular-nums">
                        {habit.streak}d
                      </Badge>
                      <button
                        type="button"
                        onClick={() => onEdit(habit)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={`Edit ${habit.name}`}
                      >
                        <Pencil className="size-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      MIN: {habit.baseline_desc}, FULL: {habit.normal_desc}
                    </p>
                  </div>
                </div>
                <div className="flex bg-background border p-0.5 rounded-lg text-[11px] font-semibold shrink-0 w-full sm:w-auto">
                  {(['baseline', 'normal'] as const).map((level) => {
                    const active = habit.status === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => onToggle(habit.id, level)}
                        className={cn(
                          'flex-1 sm:flex-none px-2.5 py-1.5 sm:py-1 rounded-md transition-colors cursor-pointer',
                          active
                            ? level === 'normal'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {level === 'baseline' ? 'MIN' : 'FULL'}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default memo(HabitsCard);
