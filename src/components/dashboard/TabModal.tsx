import { useState, type FormEvent } from 'react';
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
import { getIconComponent, type IconName } from '@/lib/iconRegistry';
import { validateDisplayName } from '@/lib/nameFilter';
import { cn } from '@/lib/utils';
import { TAB_KIND_OPTIONS, type TabKind } from '@/types/workspace';

export interface TabFormState {
  title: string;
  kind: TabKind;
  icon: IconName;
  description: string;
}

interface TabModalProps {
  open: boolean;
  editing: boolean;
  form: TabFormState;
  onChange: (patch: Partial<TabFormState>) => void;
  onClose: () => void;
  onSubmit: (form: TabFormState) => void;
}

export function TabModal({ open, editing, form, onChange, onClose, onSubmit }: TabModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const validationError = validateDisplayName(form.title, {
      fieldLabel: 'Nama tab',
      required: true,
      maxLength: 40,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmit({ ...form, title: form.title.trim() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Tab Workspace' : 'Buat Tab Workspace Baru'}</DialogTitle>
          <DialogDescription>
            Pisahkan fokus Anda ke tab khusus, misalnya tab untuk proyek tertentu atau tab khusus
            pembagian uang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tab-title">Nama Tab</Label>
            <Input
              id="tab-title"
              placeholder="Misal: Skripsi, Kerjaan Kantor, Uang Kos..."
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
            <Label>Tipe / Fokus Tab</Label>
            <div className="grid grid-cols-1 gap-1.5">
              {TAB_KIND_OPTIONS.map((opt) => {
                const Icon = getIconComponent(opt.defaultIcon);
                const selected = form.kind === opt.kind;
                return (
                  <button
                    key={opt.kind}
                    type="button"
                    onClick={() =>
                      onChange({
                        kind: opt.kind,
                        icon: editing ? form.icon : opt.defaultIcon,
                      })
                    }
                    className={cn(
                      'p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors cursor-pointer',
                      selected
                        ? 'border-primary bg-accent shadow-2xs'
                        : 'border-border bg-card hover:bg-muted/60',
                    )}
                  >
                    <div
                      className={cn(
                        'size-8 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block">{opt.label}</span>
                      <span className="text-[11px] text-muted-foreground block leading-snug">
                        {opt.summary}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ikon Tab</Label>
            <IconPicker value={form.icon} onChange={(icon) => onChange({ icon })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tab-desc">Catatan Singkat (Opsional)</Label>
            <Input
              id="tab-desc"
              placeholder="Tujuan tab ini..."
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? 'Simpan Perubahan' : 'Buat Tab'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
