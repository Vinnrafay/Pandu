import { memo } from 'react';
import { Check, Clock, Plus, Timer, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/AppIcon';
import { getTaskCategoryMeta, TASK_CATEGORIES, type TaskCategory } from '@/lib/taskCategories';
import type { Priority } from '@/types/pandu';
import { cn } from '@/lib/utils';

export type CategoryFilter = 'all' | TaskCategory;

interface Props {
  priorities: Priority[];
  completedCount: number;
  totalActiveCount: number;
  selectedCategory?: CategoryFilter;
  onCategoryChange?: (category: CategoryFilter) => void;
  showCategoryFilter?: boolean;
  onToggle: (id: number) => void;
  onDelete: (item: Priority) => void;
  onAdd: () => void;
}

function PriorityRow({
  item,
  index,
  onToggle,
  onDelete,
}: {
  item: Priority;
  index: number;
  onToggle: (id: number) => void;
  onDelete: (item: Priority) => void;
}) {
  const isDone = item.status === 'completed';
  const category = getTaskCategoryMeta(item.category);
  const slotLabel = item.slot_number ?? index + 1;

  return (
    <div
      className={cn(
        'group p-3.5 rounded-lg border transition-colors flex items-center justify-between gap-3',
        isDone
          ? 'bg-muted/60 border-border/70'
          : 'bg-card border-border hover:border-ring hover:shadow-xs',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          aria-label={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
          className={cn(
            'size-6 rounded-md flex items-center justify-center border transition-colors shrink-0 cursor-pointer',
            isDone
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-background border-input hover:border-foreground text-transparent',
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </button>

        <div
          className={cn(
            'size-8 rounded-lg border flex items-center justify-center shrink-0',
            isDone ? 'bg-muted text-muted-foreground' : 'bg-muted/60 text-foreground',
          )}
        >
          <AppIcon name={item.icon} className="size-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className="font-bold tabular-nums shrink-0 text-[10px] px-1.5"
            >
              Slot {slotLabel}
            </Badge>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded border text-[10px] font-semibold leading-none',
                category.badgeClass,
              )}
            >
              {category.label}
            </span>
          </div>
          <span
            className={cn(
              'text-[13px] font-semibold block truncate mt-1',
              isDone && 'line-through text-muted-foreground',
            )}
          >
            {item.title}
          </span>
          {(item.target_time ?? item.duration_minutes) && (
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
              {item.target_time && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {item.target_time}
                </span>
              )}
              {item.duration_minutes != null && (
                <span className="flex items-center gap-1">
                  <Timer className="size-3" /> {item.duration_minutes}m
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={isDone ? 'info' : 'warning'}>{isDone ? 'Selesai' : 'Pending'}</Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive lg:size-7 lg:opacity-0 lg:group-hover:opacity-100"
          onClick={() => onDelete(item)}
          title="Hapus prioritas ini"
          aria-label={`Hapus ${item.title}`}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

const MemoRow = memo(PriorityRow);

function PriorityCard({
  priorities,
  completedCount,
  totalActiveCount,
  selectedCategory = 'all',
  onCategoryChange,
  showCategoryFilter = false,
  onToggle,
  onDelete,
  onAdd,
}: Props) {
  return (
    <Card>
      <CardHeader data-border className="flex-row items-start justify-between space-y-0 pb-4 gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4" /> Prioritas Fokus (Rule of 3)
          </CardTitle>
          <CardDescription className="mt-1">
            Batasi maksimal 3 fokus utama agar energi tidak terpecah. Tugas ke-4 masuk Kotak Tunggu.
          </CardDescription>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {completedCount} / 3 Selesai
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {showCategoryFilter && onCategoryChange && (
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer',
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent',
              )}
            >
              Semua Kategori
            </button>
            {TASK_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => onCategoryChange(cat.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer',
                  selectedCategory === cat.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {priorities.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            Tidak ada prioritas yang cocok dengan filter saat ini. Klik{' '}
            <span className="font-semibold text-foreground">+ Tambah Tugas</span> untuk mulai.
          </div>
        ) : (
          <div className="space-y-2.5">
            {priorities.map((item, index) => (
              <MemoRow
                key={item.id}
                item={item}
                index={index}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {totalActiveCount < 3 && (
          <Button
            variant="outline"
            onClick={onAdd}
            className="w-full border-dashed text-muted-foreground"
          >
            <Plus /> Isi Slot Prioritas {totalActiveCount + 1}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(PriorityCard);
