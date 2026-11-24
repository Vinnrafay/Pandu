import { memo, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Receipt, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExpenseItem } from '@/api/panduService';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  limit: number;
  spent: number;
  percentage: number;
  isOverbudget: boolean;
  netRemaining: number;
  expenses: ExpenseItem[];
  quickAmounts: readonly number[];
  expenseAmount: string;
  expenseNote: string;
  isEditingBudget: boolean;
  tempBudgetLimit: string;
  showHistory: boolean;
  alwaysShowHistory?: boolean;
  onExpenseAmount: (v: string) => void;
  onExpenseNote: (v: string) => void;
  onQuickAdd: (amt: number) => void;
  onSubmitExpense: () => void;
  onDeleteExpense: (item: ExpenseItem) => void;
  onToggleHistory: () => void;
  onToggleEditBudget: () => void;
  onTempBudgetLimit: (v: string) => void;
  onSaveBudgetLimit: (e: FormEvent) => void;
}

function BudgetCard(props: Props) {
  const {
    limit,
    spent,
    percentage,
    isOverbudget,
    netRemaining,
    expenses,
    quickAmounts,
    expenseAmount,
    expenseNote,
    isEditingBudget,
    tempBudgetLimit,
    showHistory,
    alwaysShowHistory = false,
    onExpenseAmount,
    onExpenseNote,
    onQuickAdd,
    onSubmitExpense,
    onDeleteExpense,
    onToggleHistory,
    onToggleEditBudget,
    onTempBudgetLimit,
    onSaveBudgetLimit,
  } = props;

  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const handleLimitSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const numeric = Number(tempBudgetLimit);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setLimitError('Limit anggaran harus angka lebih besar dari Rp 0.');
      return;
    }
    setLimitError(null);
    onSaveBudgetLimit(e);
  };

  const handleManualExpense = (e: FormEvent): void => {
    e.preventDefault();
    const numeric = Number(expenseAmount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setExpenseError('Masukkan nominal pengeluaran lebih besar dari Rp 0.');
      return;
    }
    setExpenseError(null);
    onSubmitExpense();
  };

  const historyVisible = alwaysShowHistory || showHistory;

  return (
    <Card>
      <CardHeader data-border className="flex-row items-start justify-between space-y-0 pb-4 gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4" /> Anggaran Harian
          </CardTitle>
          <CardDescription className="mt-1">
            Catat pengeluaran cepat dan pantau sisa kuota harian Anda.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!alwaysShowHistory && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleHistory}>
              <Receipt /> {showHistory ? 'Tutup' : `Riwayat (${expenses.length})`}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleEditBudget}>
            <Pencil /> Edit Limit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditingBudget && (
          <form onSubmit={handleLimitSubmit} className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tempBudgetLimit}
                onChange={(e) => {
                  onTempBudgetLimit(e.target.value);
                  if (limitError) setLimitError(null);
                }}
                placeholder="Batas harian (Rp)"
                className="bg-card"
              />
              <Button type="submit" size="sm">
                Simpan
              </Button>
            </div>
            {limitError && <p className="text-[11px] text-destructive font-medium">{limitError}</p>}
          </form>
        )}

        <div
          className={cn(
            'p-4 rounded-lg border',
            isOverbudget ? 'bg-rose-50/70 border-rose-200' : 'bg-muted border-border',
          )}
        >
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                {isOverbudget ? 'Defisit Anggaran' : 'Sisa Kuota Hari Ini'}
              </span>
              <span className="text-xl font-bold tabular-nums mt-0.5 block">
                {isOverbudget
                  ? `- ${formatRupiah(Math.abs(netRemaining))}`
                  : formatRupiah(netRemaining)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Terpakai {formatRupiah(spent)} dari limit {formatRupiah(limit)}
              </span>
            </div>
            <Badge variant={isOverbudget ? 'destructive' : 'secondary'}>
              {isOverbudget ? 'Overbudget' : `${percentage}% Terpakai`}
            </Badge>
          </div>
          <Progress
            value={percentage}
            className={cn('mt-3', isOverbudget && '[&>div]:bg-rose-600')}
          />
        </div>

        <div className="space-y-2">
          <div className="flex gap-1.5">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 h-9 text-[11px] sm:h-7"
                onClick={() => onQuickAdd(amt)}
              >
                +{amt / 1000}k
              </Button>
            ))}
          </div>
          <form onSubmit={handleManualExpense} className="space-y-1.5">
            <div className="flex flex-col sm:flex-row gap-1.5">
              <Input
                type="number"
                placeholder="Nominal (Rp)..."
                value={expenseAmount}
                onChange={(e) => {
                  onExpenseAmount(e.target.value);
                  if (expenseError) setExpenseError(null);
                }}
                className="text-xs sm:w-36"
              />
              <Input
                type="text"
                placeholder="Catatan (misal: Kopi, Makan)..."
                value={expenseNote}
                onChange={(e) => onExpenseNote(e.target.value)}
                className="text-xs flex-1"
              />
              <Button type="submit" size="sm" className="shrink-0">
                Catat
              </Button>
            </div>
            {expenseError && (
              <p className="text-[11px] text-destructive font-medium">{expenseError}</p>
            )}
          </form>
        </div>

        {historyVisible && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Riwayat Transaksi Hari Ini</span>
              <Badge variant="outline" className="text-[10px] tabular-nums">
                {expenses.length} item
              </Badge>
            </div>
            {expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">Belum ada pengeluaran hari ini.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {expenses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-medium block truncate">{item.note}</span>
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums">
                        {formatRupiah(item.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:text-destructive"
                        onClick={() => onDeleteExpense(item)}
                        title="Hapus transaksi"
                        aria-label={`Hapus transaksi ${item.note}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(BudgetCard);
