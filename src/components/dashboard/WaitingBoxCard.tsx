import { memo } from 'react';
import { ArrowRightLeft, ArrowUpToLine, Inbox, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconComponent } from '@/lib/iconRegistry';
import { getTaskCategoryMeta } from '@/lib/taskCategories';
import type { Priority } from '@/types/pandu';
import { cn } from '@/lib/utils';

interface Props {
  items: Priority[];
  /** true kalau masih ada slot fokus kosong */
  hasRoom: boolean;
  onPromote: (task: Priority) => void;
  onDelete: (task: Priority) => void;
}

function WaitingBoxCard({ items, hasRoom, onPromote, onDelete }: Props) {
  return (
    <Card>
      <CardHeader data-border className="flex-row items-start justify-between space-y-0 pb-4 gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Inbox className="size-4" /> Kotak Tunggu
          </CardTitle>
          <CardDescription className="mt-1">
            Antrean tugas cadangan saat 3 slot fokus utama sedang penuh.
          </CardDescription>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {items.length} Antrean
        </Badge>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            Kotak tunggu kosong. Tugas ke-4 dan seterusnya otomatis antre di sini.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {hasRoom
                ? 'Ada slot fokus kosong, naikkan tugas ke atas atau hapus yang batal.'
                : 'Slot fokus penuh, tukar salah satu antrean dengan Slot 1.'}
            </p>
            <div className="space-y-1.5">
              {items.map((task, i) => {
                const Icon = getIconComponent(task.icon);
                const category = getTaskCategoryMeta(task.category);
                return (
                  <div
                    key={task.id}
                    className="p-2.5 bg-muted rounded-lg flex items-center gap-2.5 text-xs"
                  >
                    <Badge variant="outline" className="tabular-nums shrink-0">
                      {i + 1}
                    </Badge>
                    <div className="size-7 rounded-md bg-card border flex items-center justify-center shrink-0">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block">{task.title}</span>
                      <span
                        className={cn(
                          'inline-block mt-0.5 px-1.5 py-0.5 rounded border text-[9px] font-semibold leading-none',
                          category.badgeClass,
                        )}
                      >
                        {category.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 text-[11px] px-2.5"
                        onClick={() => onPromote(task)}
                        title={hasRoom ? 'Naikkan ke slot fokus' : 'Tukar dengan Slot 1'}
                      >
                        {hasRoom ? <ArrowUpToLine /> : <ArrowRightLeft />}
                        <span className="hidden min-[400px]:inline">
                          {hasRoom ? 'Naik' : 'Slot 1'}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(task)}
                        title="Hapus dari antrean"
                        aria-label={`Hapus ${task.title} dari antrean`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(WaitingBoxCard);
