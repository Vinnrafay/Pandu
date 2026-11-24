import { memo } from 'react';
import type { ReactElement } from 'react';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PlatformType, ScheduleItem } from '@/api/panduService';
import { formatScheduleDate } from '@/lib/format';
import { GoogleCalendarIcon, GoogleMeetIcon, TeamsIcon, ZoomIcon } from '@/components/icons';

const PLATFORM_ICON: Record<PlatformType, (p: { className?: string }) => ReactElement> = {
  meet: GoogleMeetIcon,
  zoom: ZoomIcon,
  teams: TeamsIcon,
  calendar: GoogleCalendarIcon,
};

interface Props {
  schedules: ScheduleItem[];
  onAdd: () => void;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => void;
}

function ScheduleCard({ schedules, onAdd, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardHeader data-border className="flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardDescription className="uppercase tracking-widest text-[10px] font-semibold">
            Your Schedule
          </CardDescription>
          <CardTitle className="mt-1">Agenda Mingguan</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Tambah Agenda
        </Button>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {schedules.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            Belum ada agenda mingguan. Klik{' '}
            <span className="font-semibold text-foreground">+ Tambah Agenda</span> untuk
            menjadwalkan.
          </div>
        ) : (
          schedules.map((item) => {
            const { month, day } = formatScheduleDate(item.date);
            const PlatformIcon = PLATFORM_ICON[item.platform];
            return (
              <div
                key={item.id}
                className="group p-3 bg-muted/60 hover:bg-muted border border-transparent hover:border-border rounded-lg flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 bg-card border rounded-lg flex flex-col items-center justify-center shadow-xs shrink-0">
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase leading-none">
                      {month}
                    </span>
                    <span className="text-sm font-bold leading-tight tabular-nums">{day}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold block truncate">{item.title}</span>
                    <Badge variant="info" className="mt-1">
                      <Clock className="size-3" />
                      {item.startTime} - {item.endTime}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 lg:size-7 lg:opacity-0 lg:group-hover:opacity-100"
                    onClick={() => onEdit(item)}
                    title="Edit agenda"
                    aria-label={`Edit ${item.title}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 hover:text-destructive lg:size-7 lg:opacity-0 lg:group-hover:opacity-100"
                    onClick={() => onDelete(item)}
                    title="Hapus agenda"
                    aria-label={`Hapus ${item.title}`}
                  >
                    <Trash2 />
                  </Button>
                  <div className="size-8 rounded-lg bg-card border flex items-center justify-center shadow-xs ml-1">
                    <PlatformIcon className="size-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ScheduleCard);
