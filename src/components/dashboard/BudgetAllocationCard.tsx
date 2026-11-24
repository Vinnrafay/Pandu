import { memo, useState, type FormEvent } from 'react';
import { AlertCircle, PiggyBank, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import IconPicker from '@/components/ui/IconPicker';
import { formatRupiah } from '@/lib/format';
import { getIconComponent, type IconName } from '@/lib/iconRegistry';
import { cn } from '@/lib/utils';
import type { BudgetAllocation } from '@/types/workspace';

interface BudgetAllocationCardProps {
  tabTitle: string;
  budgetLimit: number;
  allocations: BudgetAllocation[];
  totalAllocated: number;
  onAddAllocation: (input: { name: string; icon: IconName; allocated: number }) => void;
  onSpendFromAllocation: (allocation: BudgetAllocation, amount: number) => void;
  onDeleteAllocation: (id: string) => void;
}

function BudgetAllocationCard({
  tabTitle,
  budgetLimit,
  allocations,
  totalAllocated,
  onAddAllocation,
  onSpendFromAllocation,
  onDeleteAllocation,
}: BudgetAllocationCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [allocated, setAllocated] = useState('');
  const [icon, setIcon] = useState<IconName>('piggybank');
  const [formError, setFormError] = useState<string | null>(null);
  const [spendInputs, setSpendInputs] = useState<Record<string, string>>({});
  const [spendErrors, setSpendErrors] = useState<Record<string, string>>({});

  const isOverAllocated = totalAllocated > budgetLimit;
  const unallocated = budgetLimit - totalAllocated;

  const handleCreate = (e: FormEvent): void => {
    e.preventDefault();
    const cleanName = name.trim();
    const numeric = Number(allocated);
    if (!cleanName) {
      setFormError('Nama pos anggaran wajib diisi (misal: Makan, Transport, Tabungan).');
      return;
    }
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setFormError('Nominal alokasi harus lebih besar dari Rp 0.');
      return;
    }
    onAddAllocation({ name: cleanName, icon, allocated: Math.round(numeric) });
    setName('');
    setAllocated('');
    setIcon('piggybank');
    setFormError(null);
    setShowAddForm(false);
  };

  const handleSpendSubmit = (e: FormEvent, item: BudgetAllocation): void => {
    e.preventDefault();
    const raw = spendInputs[item.id] ?? '';
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSpendErrors((prev) => ({ ...prev, [item.id]: 'Masukkan nominal > Rp 0' }));
      return;
    }
    setSpendErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    onSpendFromAllocation(item, Math.round(amount));
    setSpendInputs((prev) => ({ ...prev, [item.id]: '' }));
  };

  return (
    <Card>
      <CardHeader data-border className="flex-row items-start justify-between space-y-0 pb-4 gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="size-4" /> Pos Pembagian Uang
          </CardTitle>
          <CardDescription className="mt-1">
            Pecah anggaran tab <span className="font-semibold text-foreground">{tabTitle}</span> ke
            beberapa pos agar pengeluaran lebih terkontrol.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant={showAddForm ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => {
            setShowAddForm((v) => !v);
            setFormError(null);
          }}
        >
          <Plus className="size-3.5" /> {showAddForm ? 'Tutup' : 'Tambah Pos'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className={cn(
            'p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs',
            isOverAllocated
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-muted/60 border-border',
          )}
        >
          <div className="flex items-center gap-2">
            {isOverAllocated && <AlertCircle className="size-4 text-amber-600 shrink-0" />}
            <span>
              Total dialokasikan:{' '}
              <strong className="tabular-nums">{formatRupiah(totalAllocated)}</strong> dari limit{' '}
              <strong className="tabular-nums">{formatRupiah(budgetLimit)}</strong>
            </span>
          </div>
          <Badge variant={isOverAllocated ? 'warning' : 'secondary'} className="tabular-nums">
            {isOverAllocated
              ? `Melebihi ${formatRupiah(Math.abs(unallocated))}`
              : `Belum dialokasi: ${formatRupiah(unallocated)}`}
          </Badge>
        </div>

        {showAddForm && (
          <form onSubmit={handleCreate} className="p-3.5 rounded-lg border bg-muted/40 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="alloc-name">Nama Pos</Label>
                <Input
                  id="alloc-name"
                  placeholder="Misal: Makan, Kopi, Tabungan..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alloc-amount">Alokasi (Rp)</Label>
                <Input
                  id="alloc-amount"
                  type="number"
                  placeholder="50000"
                  value={allocated}
                  onChange={(e) => {
                    setAllocated(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="bg-card"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Ikon Pos</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            {formError && <p className="text-[11px] font-medium text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm">
                Simpan Pos
              </Button>
            </div>
          </form>
        )}

        {allocations.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            Belum ada pos pembagian uang di tab ini. Klik{' '}
            <span className="font-semibold text-foreground">+ Tambah Pos</span> untuk mulai membagi
            anggaran.
          </div>
        ) : (
          <div className="space-y-2.5">
            {allocations.map((item) => {
              const Icon = getIconComponent(item.icon);
              const pct =
                item.allocated > 0
                  ? Math.min(100, Math.round((item.spent / item.allocated) * 100))
                  : 0;
              const over = item.spent > item.allocated;
              const remaining = item.allocated - item.spent;
              return (
                <div key={item.id} className="p-3.5 rounded-lg border bg-card space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-muted border flex items-center justify-center shrink-0">
                        <Icon className="size-4 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{item.name}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          Terpakai {formatRupiah(item.spent)} / {formatRupiah(item.allocated)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={over ? 'destructive' : 'secondary'} className="tabular-nums">
                        {over
                          ? `- ${formatRupiah(Math.abs(remaining))}`
                          : `Sisa ${formatRupiah(remaining)}`}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteAllocation(item.id)}
                        title={`Hapus pos ${item.name}`}
                        aria-label={`Hapus pos ${item.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={pct} className={cn(over && '[&>div]:bg-rose-600')} />
                  <form
                    onSubmit={(e) => handleSpendSubmit(e, item)}
                    className="flex items-center gap-1.5 pt-0.5"
                  >
                    <Input
                      type="number"
                      placeholder={`Catat pengeluaran ${item.name} (Rp)...`}
                      value={spendInputs[item.id] ?? ''}
                      onChange={(e) =>
                        setSpendInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="h-8 text-xs"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs shrink-0"
                    >
                      Pakai
                    </Button>
                  </form>
                  {spendErrors[item.id] && (
                    <p className="text-[11px] text-destructive font-medium">
                      {spendErrors[item.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(BudgetAllocationCard);
