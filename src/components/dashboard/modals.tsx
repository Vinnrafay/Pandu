import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import IconPicker from '@/components/ui/IconPicker';
import type { PlatformType } from '@/api/panduService';
import type { IconName } from '@/lib/iconRegistry';
import { TASK_CATEGORIES, type TaskCategory } from '@/lib/taskCategories';
import { cn } from '@/lib/utils';
import { GoogleCalendarIcon, GoogleMeetIcon, TeamsIcon, ZoomIcon } from '@/components/icons';

export type ToastType = 'success' | 'info' | 'warning';

export function Toast({
  show,
  message,
  type,
}: {
  show: boolean;
  message: string;
  type: ToastType;
}) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 right-5 z-[70] animate-in fade-in slide-in-from-top-3 duration-200"
    >
      <div
        className={cn(
          'px-3.5 py-2.5 rounded-lg shadow-md border flex items-center gap-2 text-xs font-semibold max-w-sm',
          type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-900',
          type === 'warning' && 'bg-amber-50 border-amber-200 text-amber-900',
          type === 'info' && 'bg-primary text-primary-foreground border-primary',
        )}
      >
        {type === 'success' && <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />}
        {type === 'warning' && <AlertTriangle className="size-4 text-amber-600 shrink-0" />}
        {type === 'info' && <Info className="size-4 shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
}

export interface ConfirmConfig {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmConfig) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export interface TaskForm {
  title: string;
  targetTime: string;
  duration: number;
  icon: IconName;
  category: TaskCategory;
}

export function TaskModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  isFull,
  durations,
  activeTabTitle,
}: {
  open: boolean;
  onClose: () => void;
  form: TaskForm;
  onChange: (p: Partial<TaskForm>) => void;
  onSubmit: (e: FormEvent) => void;
  isFull: boolean;
  durations: readonly number[];
  activeTabTitle?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const clean = form.title.trim();
    if (!clean) {
      setError('Judul tugas tidak boleh kosong.');
      return;
    }
    if (clean.length > 200) {
      setError('Judul tugas maksimal 200 karakter.');
      return;
    }
    setError(null);
    onSubmit(e);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Tambah Tugas / Prioritas"
      description={
        activeTabTitle
          ? `Tugas ini akan ditandai untuk tab "${activeTabTitle}". Fokus pada 3 prioritas utama.`
          : 'Fokus pada 3 hal terpenting hari ini.'
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Judul Tugas</Label>
          <Input
            id="task-title"
            placeholder="Misal: Selesaikan desain halaman checkout..."
            value={form.title}
            onChange={(e) => {
              onChange({ title: e.target.value });
              if (error) setError(null);
            }}
            autoFocus
          />
          {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Kategori Tasking</Label>
          <div className="flex flex-wrap gap-1.5">
            {TASK_CATEGORIES.map((cat) => {
              const selected = form.category === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => onChange({ category: cat.key })}
                  className={cn(
                    'px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Ikon Tugas</Label>
          <IconPicker value={form.icon} onChange={(icon) => onChange({ icon })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-time">Target Selesai</Label>
            <Input
              id="task-time"
              type="time"
              value={form.targetTime}
              onChange={(e) => onChange({ targetTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estimasi Durasi</Label>
            <div className="grid grid-cols-4 gap-1">
              {durations.map((dur) => (
                <Button
                  key={dur}
                  type="button"
                  variant={form.duration === dur ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-[11px] px-0"
                  onClick={() => onChange({ duration: dur })}
                >
                  {dur}m
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isFull && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-medium">
            Slot 1 sampai 3 utama penuh. Tugas ini akan dialihkan otomatis ke Kotak Tunggu.
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" className="flex-1">
            Simpan Tugas
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

export interface HabitForm {
  name: string;
  baseline: string;
  normal: string;
  icon: IconName;
}

export function HabitModal({
  open,
  onClose,
  editing,
  form,
  onChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  form: HabitForm;
  onChange: (p: Partial<HabitForm>) => void;
  onSubmit: (e: FormEvent) => void;
  onDelete?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const clean = form.name.trim();
    if (!clean) {
      setError('Nama kebiasaan wajib diisi.');
      return;
    }
    if (clean.length > 100) {
      setError('Nama kebiasaan maksimal 100 karakter.');
      return;
    }
    setError(null);
    onSubmit(e);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title={editing ? 'Edit Daily Habit' : 'Tambah Habit Baru'}
      description="Tentukan versi minimal (saat sibuk) dan versi penuh untuk menjaga konsistensi streak."
    >
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="habit-name">Nama Kebiasaan</Label>
          <Input
            id="habit-name"
            placeholder="Misal: Olahraga, Membaca, Meditasi..."
            value={form.name}
            onChange={(e) => {
              onChange({ name: e.target.value });
              if (error) setError(null);
            }}
            autoFocus
          />
          {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Ikon Kebiasaan</Label>
          <IconPicker value={form.icon} onChange={(icon) => onChange({ icon })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="habit-min">Target MIN</Label>
            <Input
              id="habit-min"
              placeholder="5 menit / 5x rep"
              value={form.baseline}
              onChange={(e) => onChange({ baseline: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="habit-full">Target FULL</Label>
            <Input
              id="habit-full"
              placeholder="30 menit / 30x rep"
              value={form.normal}
              onChange={(e) => onChange({ normal: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          {editing && onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              Hapus
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" className="flex-1">
            Simpan Habit
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

export interface ScheduleForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  platform: PlatformType;
}

const PLATFORMS: {
  key: PlatformType;
  label: string;
  Icon: (p: { className?: string }) => React.ReactElement;
}[] = [
  { key: 'meet', label: 'Meet', Icon: GoogleMeetIcon },
  { key: 'zoom', label: 'Zoom', Icon: ZoomIcon },
  { key: 'teams', label: 'Teams', Icon: TeamsIcon },
  { key: 'calendar', label: 'Acara', Icon: GoogleCalendarIcon },
];

export function ScheduleModal({
  open,
  onClose,
  editing,
  form,
  onChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  form: ScheduleForm;
  onChange: (p: Partial<ScheduleForm>) => void;
  onSubmit: (e: FormEvent) => void;
  onDelete?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Judul agenda tidak boleh kosong.');
      return;
    }
    if (!form.date) {
      setError('Tanggal agenda wajib dipilih.');
      return;
    }
    if (form.endTime <= form.startTime) {
      setError('Jam selesai harus lebih lambat daripada jam mulai.');
      return;
    }
    setError(null);
    onSubmit(e);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title={editing ? 'Edit Agenda Mingguan' : 'Tambah Agenda Mingguan'}
      description="Pastikan rentang waktu tidak bertabrakan dengan agenda lain di tanggal yang sama."
    >
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="schedule-title">Judul Agenda</Label>
          <Input
            id="schedule-title"
            placeholder="Sync Standup Tim..."
            value={form.title}
            onChange={(e) => {
              onChange({ title: e.target.value });
              if (error) setError(null);
            }}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="schedule-date">Tanggal</Label>
          <Input
            id="schedule-date"
            type="date"
            value={form.date}
            onChange={(e) => {
              onChange({ date: e.target.value });
              if (error) setError(null);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-start">Jam Mulai</Label>
            <Input
              id="schedule-start"
              type="time"
              value={form.startTime}
              onChange={(e) => {
                onChange({ startTime: e.target.value });
                if (error) setError(null);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-end">Jam Selesai</Label>
            <Input
              id="schedule-end"
              type="time"
              value={form.endTime}
              onChange={(e) => {
                onChange({ endTime: e.target.value });
                if (error) setError(null);
              }}
            />
          </div>
        </div>
        {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
        <div className="space-y-1.5 pt-1">
          <Label>Platform Meeting</Label>
          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.map(({ key, label, Icon }) => {
              const selected = form.platform === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ platform: key })}
                  className={cn(
                    'p-2 rounded-lg border flex flex-col items-center gap-1.5 transition-colors cursor-pointer',
                    selected
                      ? 'border-primary bg-accent shadow-xs'
                      : 'border-border bg-card hover:bg-accent/50',
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          {editing && onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              Hapus
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" className="flex-1">
            Simpan Agenda
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
