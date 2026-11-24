import { memo, useCallback, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Calendar, Flame, RefreshCw, Target, Wallet, WifiOff, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ExpenseItem, PlatformType, ScheduleItem } from '@/api/panduService';
import type { FriendlyError } from '@/lib/errorHandler';
import { formatRupiah, todayISODate } from '@/lib/format';
import { computeBudgetSummary, freeSlot } from '@/lib/priority';
import { useBudgetAllocations } from '@/hooks/useBudgetAllocations';
import { useWorkspaceTabs } from '@/hooks/useWorkspaceTabs';
import type { DashboardData, Habit, Priority } from '@/types/pandu';
import type { BudgetAllocation, WorkspaceTab } from '@/types/workspace';
import BrowserTabBar from './BrowserTabBar';
import BudgetAllocationCard from './BudgetAllocationCard';
import BudgetCard from './BudgetCard';
import DashboardHeader, { type FilterStatus } from './DashboardHeader';
import HabitsCard from './HabitsCard';
import MobileBottomNav from './MobileBottomNav';
import PriorityCard, { type CategoryFilter } from './PriorityCard';
import ScheduleCard from './ScheduleCard';
import { TabModal, type TabFormState } from './TabModal';
import WaitingBoxCard from './WaitingBoxCard';
import {
  ConfirmDialog,
  HabitModal,
  ScheduleModal,
  TaskModal,
  type HabitForm,
  type ScheduleForm,
  type TaskForm,
  type ToastType,
} from './modals';
import { cn } from '@/lib/utils';

const DURATION_OPTIONS = [15, 30, 45, 60] as const;
const QUICK_EXPENSE_AMOUNTS = [10000, 25000, 50000] as const;

const DEFAULT_TASK_FORM: TaskForm = {
  title: '',
  targetTime: '14:00',
  duration: 45,
  icon: 'target',
  category: 'utama',
};

const DEFAULT_HABIT_FORM: HabitForm = {
  name: '',
  baseline: '',
  normal: '',
  icon: 'flame',
};

const DEFAULT_TAB_FORM: TabFormState = {
  title: '',
  kind: 'tasking',
  icon: 'target',
  description: '',
};

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const OverbudgetAlert = memo(function OverbudgetAlert({ amount }: { amount: number }) {
  return (
    <Alert variant="destructive" className="bg-rose-50 border-rose-200">
      <AlertCircle />
      <AlertTitle>Peringatan: Batas Anggaran Terlampaui</AlertTitle>
      <AlertDescription className="text-rose-700">
        Pengeluaran hari ini melampaui limit sebesar {formatRupiah(amount)}. Evaluasi pos belanja
        atau hapus transaksi di tab Pembagian Uang.
      </AlertDescription>
    </Alert>
  );
});

export interface DashboardWorkspaceProps {
  guestId: string | null;
  userName: string;
  data: DashboardData;
  expenses: ExpenseItem[];
  schedules: ScheduleItem[];
  syncError: FriendlyError | null;
  isSyncing: boolean;
  tempBudgetLimit: string;
  onTempBudgetLimit: (v: string) => void;
  onClearSyncError: () => void;
  onRetrySync: () => Promise<void>;
  onHome: () => void;
  onLogout: () => void;
  onToast: (message: string, type?: ToastType) => void;
  onTogglePriority: (id: number) => Promise<void>;
  onDeletePriority: (id: number) => Promise<void>;
  onSaveTask: (form: TaskForm & { tabId?: string }) => Promise<boolean>;
  onDeleteWaiting: (id: number) => Promise<void>;
  onPromoteWaiting: (task: Priority) => Promise<void>;
  onAddExpense: (amount: number, note: string) => Promise<boolean>;
  onDeleteExpense: (id: number, amount: number) => Promise<void>;
  onSaveBudgetLimit: (limit: number) => Promise<boolean>;
  onHabitToggle: (id: number, level: 'baseline' | 'normal') => Promise<void>;
  onSaveHabit: (editingId: number | null, form: HabitForm) => Promise<boolean>;
  onDeleteHabit: (id: number) => Promise<void>;
  onSaveSchedule: (
    editingId: number | null,
    form: {
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      platform: PlatformType;
    },
  ) => Promise<boolean>;
  onDeleteSchedule: (id: number) => Promise<void>;
}

export default function DashboardWorkspace(props: DashboardWorkspaceProps) {
  const {
    guestId,
    userName,
    data,
    expenses,
    schedules,
    syncError,
    isSyncing,
    tempBudgetLimit,
    onTempBudgetLimit,
    onClearSyncError,
    onRetrySync,
    onHome,
    onLogout,
    onToast,
    onTogglePriority,
    onDeletePriority,
    onSaveTask,
    onDeleteWaiting,
    onPromoteWaiting,
    onAddExpense,
    onDeleteExpense,
    onSaveBudgetLimit,
    onHabitToggle,
    onSaveHabit,
    onDeleteHabit,
    onSaveSchedule,
    onDeleteSchedule,
  } = props;

  const { tabs, activeTabId, activeTab, selectTab, addTab, updateTab, closeTab, resetTabs } =
    useWorkspaceTabs(guestId);

  const { allocations, totalAllocated, addAllocation, recordSpend, deleteAllocation } =
    useBudgetAllocations(guestId, activeTabId);

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Hapus',
    onConfirm: () => {},
  });
  const openConfirm = useCallback(
    (c: Omit<ConfirmState, 'open'>) => setConfirm({ ...c, open: true }),
    [],
  );
  const closeConfirm = useCallback(() => setConfirm((p) => ({ ...p, open: false })), []);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [tabTaskScope, setTabTaskScope] = useState<'tab' | 'all'>('tab');

  const [expenseForm, setExpenseForm] = useState({ amount: '', note: '' });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>(DEFAULT_TASK_FORM);

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [habitForm, setHabitForm] = useState<HabitForm>(DEFAULT_HABIT_FORM);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    title: '',
    date: todayISODate(),
    startTime: '13:00',
    endTime: '13:45',
    platform: 'calendar',
  });

  const [showTabModal, setShowTabModal] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabForm, setTabForm] = useState<TabFormState>(DEFAULT_TAB_FORM);

  const isCustomTaskingTab = activeTab.kind === 'tasking' && activeTab.id !== 'tab_tasking';

  const openTaskModal = useCallback((): void => {
    setTaskForm({
      ...DEFAULT_TASK_FORM,
      icon: activeTab.kind === 'tasking' ? activeTab.icon : 'target',
    });
    setShowTaskModal(true);
  }, [activeTab.icon, activeTab.kind]);

  const openHabitModal = useCallback((habit?: Habit): void => {
    if (habit) {
      setEditingHabitId(habit.id);
      setHabitForm({
        name: habit.name,
        baseline: habit.baseline_desc,
        normal: habit.normal_desc,
        icon: habit.icon ?? 'flame',
      });
    } else {
      setEditingHabitId(null);
      setHabitForm(DEFAULT_HABIT_FORM);
    }
    setShowHabitModal(true);
  }, []);

  const openScheduleModal = useCallback((item?: ScheduleItem): void => {
    if (item) {
      setEditingScheduleId(item.id);
      setScheduleForm({
        title: item.title,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        platform: item.platform,
      });
    } else {
      setEditingScheduleId(null);
      setScheduleForm({
        title: '',
        date: todayISODate(),
        startTime: '13:00',
        endTime: '13:45',
        platform: 'calendar',
      });
    }
    setShowScheduleModal(true);
  }, []);

  const openNewTabModal = useCallback((): void => {
    setEditingTabId(null);
    setTabForm(DEFAULT_TAB_FORM);
    setShowTabModal(true);
  }, []);

  const openEditTabModal = useCallback((tab: WorkspaceTab): void => {
    setEditingTabId(tab.id);
    setTabForm({
      title: tab.title,
      kind: tab.kind,
      icon: tab.icon,
      description: tab.description ?? '',
    });
    setShowTabModal(true);
  }, []);

  const handleSaveTabForm = useCallback(
    (form: TabFormState): void => {
      if (editingTabId) {
        updateTab(editingTabId, form);
        onToast(`Tab "${form.title}" diperbarui`, 'success');
      } else {
        addTab(form);
        onToast(`Tab baru "${form.title}" dibuat`, 'success');
      }
      setShowTabModal(false);
    },
    [addTab, editingTabId, onToast, updateTab],
  );

  const handleCloseTab = useCallback(
    (id: string): void => {
      const target = tabs.find((t) => t.id === id);
      if (closeTab(id) && target) {
        onToast(`Tab "${target.title}" ditutup`, 'info');
      }
    },
    [closeTab, onToast, tabs],
  );

  const handleResetTabs = useCallback((): void => {
    resetTabs();
    onToast('Tab dikembalikan ke susunan bawaan', 'info');
  }, [onToast, resetTabs]);

  const onSubmitTask = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();
      const saved = await onSaveTask({
        ...taskForm,
        tabId: isCustomTaskingTab ? activeTab.id : undefined,
      });
      if (saved) {
        setTaskForm(DEFAULT_TASK_FORM);
        setShowTaskModal(false);
      }
    },
    [activeTab.id, isCustomTaskingTab, onSaveTask, taskForm],
  );

  const onSubmitHabit = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();
      const saved = await onSaveHabit(editingHabitId, habitForm);
      if (saved) setShowHabitModal(false);
    },
    [editingHabitId, habitForm, onSaveHabit],
  );

  const onSubmitSchedule = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();
      const saved = await onSaveSchedule(editingScheduleId, scheduleForm);
      if (saved) setShowScheduleModal(false);
    },
    [editingScheduleId, onSaveSchedule, scheduleForm],
  );

  const onSubmitBudgetLimit = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();
      const saved = await onSaveBudgetLimit(Number(tempBudgetLimit));
      if (saved) setIsEditingBudget(false);
    },
    [onSaveBudgetLimit, tempBudgetLimit],
  );

  const handleAddExpenseSubmit = useCallback(
    async (amount: number, customNote?: string): Promise<void> => {
      const note =
        customNote ?? (expenseForm.note.trim() !== '' ? expenseForm.note.trim() : 'Pengeluaran');
      const added = await onAddExpense(amount, note);
      if (added) setExpenseForm({ amount: '', note: '' });
    },
    [expenseForm.note, onAddExpense],
  );

  const handleSpendFromAllocation = useCallback(
    (allocation: BudgetAllocation, amount: number): void => {
      recordSpend(allocation.id, amount);
      void onAddExpense(amount, `${allocation.name} (${activeTab.title})`);
    },
    [activeTab.title, onAddExpense, recordSpend],
  );

  const budget = useMemo(
    () => computeBudgetSummary(data.budget.limit, data.budget.spent),
    [data.budget.limit, data.budget.spent],
  );

  const filteredPriorities = useMemo(() => {
    let list = data.priorities;
    if (isCustomTaskingTab && tabTaskScope === 'tab') {
      list = list.filter((p) => p.tabId === activeTab.id);
    }
    if (activeTab.kind === 'tasking' && selectedCategory !== 'all') {
      list = list.filter((p) => (p.category ?? 'utama') === selectedCategory);
    }
    if (filterStatus === 'Selesai') return list.filter((p) => p.status === 'completed');
    if (filterStatus === 'Pending') return list.filter((p) => p.status === 'pending');
    return list;
  }, [
    activeTab.id,
    activeTab.kind,
    data.priorities,
    filterStatus,
    isCustomTaskingTab,
    selectedCategory,
    tabTaskScope,
  ]);

  const filteredWaiting = useMemo(() => {
    let list = data.waiting_box;
    if (isCustomTaskingTab && tabTaskScope === 'tab') {
      list = list.filter((w) => w.tabId === activeTab.id);
    }
    if (activeTab.kind === 'tasking' && selectedCategory !== 'all') {
      list = list.filter((w) => (w.category ?? 'utama') === selectedCategory);
    }
    return list;
  }, [
    activeTab.id,
    activeTab.kind,
    data.waiting_box,
    isCustomTaskingTab,
    selectedCategory,
    tabTaskScope,
  ]);

  const completedCount = useMemo(
    () => data.priorities.filter((p) => p.status === 'completed').length,
    [data.priorities],
  );

  const activeHabitsCount = useMemo(
    () => data.habits.filter((h) => h.status !== 'none').length,
    [data.habits],
  );

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort((a, b) =>
        `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
      ),
    [schedules],
  );

  const hasFreeSlot = useMemo(() => freeSlot(data.priorities) !== null, [data.priorities]);

  const tabCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const tab of tabs) {
      if (tab.kind === 'tasking') {
        if (tab.id === 'tab_tasking') {
          counts[tab.id] = data.priorities.length + data.waiting_box.length;
        } else {
          counts[tab.id] =
            data.priorities.filter((p) => p.tabId === tab.id).length +
            data.waiting_box.filter((w) => w.tabId === tab.id).length;
        }
      } else if (tab.kind === 'finance') {
        counts[tab.id] = expenses.length;
      } else if (tab.kind === 'schedule') {
        counts[tab.id] = schedules.length;
      } else if (tab.kind === 'habits') {
        counts[tab.id] = data.habits.length;
      }
    }
    return counts;
  }, [
    data.habits.length,
    data.priorities,
    data.waiting_box,
    expenses.length,
    schedules.length,
    tabs,
  ]);

  const askDeletePriority = useCallback(
    (item: Priority) =>
      openConfirm({
        title: 'Hapus Tugas Prioritas?',
        description: `Apakah Anda yakin ingin menghapus "${item.title}" dari slot prioritas?`,
        confirmLabel: 'Hapus Prioritas',
        onConfirm: () => void onDeletePriority(item.id),
      }),
    [onDeletePriority, openConfirm],
  );

  const askDeleteSchedule = useCallback(
    (item: ScheduleItem) =>
      openConfirm({
        title: 'Hapus Agenda Pertemuan?',
        description: `Apakah Anda yakin ingin membatalkan agenda "${item.title}"?`,
        confirmLabel: 'Hapus Agenda',
        onConfirm: () => void onDeleteSchedule(item.id),
      }),
    [onDeleteSchedule, openConfirm],
  );

  const askDeleteWaiting = useCallback(
    (item: Priority) =>
      openConfirm({
        title: 'Hapus dari Antrean?',
        description: `Hapus "${item.title}" dari Kotak Tunggu? Tugas ini tidak akan masuk slot fokus.`,
        confirmLabel: 'Hapus Antrean',
        onConfirm: () => void onDeleteWaiting(item.id),
      }),
    [onDeleteWaiting, openConfirm],
  );

  const askDeleteExpense = useCallback(
    (item: ExpenseItem) =>
      openConfirm({
        title: 'Hapus Transaksi?',
        description: `Hapus catatan "${item.note}" senilai ${formatRupiah(item.amount)}? Kuota akan dipulihkan.`,
        confirmLabel: 'Hapus Transaksi',
        onConfirm: () => void onDeleteExpense(item.id, item.amount),
      }),
    [onDeleteExpense, openConfirm],
  );

  const jumpToKind = useCallback(
    (kind: WorkspaceTab['kind']): void => {
      const existing = tabs.find((t) => t.kind === kind);
      if (existing) selectTab(existing.id);
    },
    [selectTab, tabs],
  );

  const primaryAction = useMemo(() => {
    switch (activeTab.kind) {
      case 'schedule':
        return { label: 'Tambah Agenda', handler: () => openScheduleModal() };
      case 'habits':
        return { label: 'Tambah Habit', handler: () => openHabitModal() };
      case 'finance':
        return { label: 'Tab Keuangan Baru', handler: openNewTabModal };
      default:
        return { label: 'Tambah Tugas', handler: openTaskModal };
    }
  }, [activeTab.kind, openHabitModal, openNewTabModal, openScheduleModal, openTaskModal]);

  return (
    <div className="min-h-screen bg-muted/40 p-4 pb-24 sm:p-6 sm:pb-24 md:pb-8 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <DashboardHeader
          date={data.date}
          userName={userName}
          activeTab={activeTab}
          tabBar={
            <BrowserTabBar
              tabs={tabs}
              activeTabId={activeTabId}
              tabCounts={tabCounts}
              onSelect={selectTab}
              onAdd={openNewTabModal}
              onEdit={openEditTabModal}
              onClose={handleCloseTab}
              onReset={handleResetTabs}
            />
          }
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onPrimaryAction={primaryAction.handler}
          primaryActionLabel={primaryAction.label}
          onHome={onHome}
          onLogout={onLogout}
        />

        {syncError && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-950">
            <WifiOff className="text-amber-700" />
            <div className="flex flex-wrap items-start justify-between gap-2 w-full">
              <div className="min-w-0">
                <AlertTitle>{syncError.title}</AlertTitle>
                <AlertDescription className="text-amber-800">{syncError.message}</AlertDescription>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {syncError.recoverable && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSyncing}
                    onClick={() => void onRetrySync()}
                    className="h-7 text-xs bg-white"
                  >
                    <RefreshCw className={cn('size-3', isSyncing && 'animate-spin')} />
                    {isSyncing ? 'Menyinkronkan...' : 'Coba Sinkron Ulang'}
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onClearSyncError}
                  className="size-7 text-amber-800 hover:bg-amber-100"
                  aria-label="Tutup peringatan sinkronisasi"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {budget.isOverbudget && <OverbudgetAlert amount={Math.abs(budget.netRemaining)} />}

        <main className="space-y-6">
          {activeTab.kind === 'overview' && (
            <>
              <section
                aria-label="Ringkasan Cepat Hari Ini"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              >
                <button
                  type="button"
                  onClick={() => jumpToKind('tasking')}
                  className="p-4 rounded-xl bg-card border hover:border-primary/40 text-left transition-colors cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Fokus Utama</span>
                    <Target className="size-4 text-emerald-600" />
                  </div>
                  <p className="text-xl font-bold tabular-nums mt-1.5">{completedCount} / 3</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {data.waiting_box.length} di Kotak Tunggu
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => jumpToKind('finance')}
                  className="p-4 rounded-xl bg-card border hover:border-primary/40 text-left transition-colors cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Sisa Anggaran</span>
                    <Wallet className="size-4 text-amber-600" />
                  </div>
                  <p
                    className={cn(
                      'text-xl font-bold tabular-nums mt-1.5 truncate',
                      budget.isOverbudget && 'text-rose-600',
                    )}
                  >
                    {budget.isOverbudget
                      ? `- ${formatRupiah(Math.abs(budget.netRemaining))}`
                      : formatRupiah(budget.netRemaining)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {budget.percentage}% terpakai hari ini
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => jumpToKind('schedule')}
                  className="p-4 rounded-xl bg-card border hover:border-primary/40 text-left transition-colors cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Agenda</span>
                    <Calendar className="size-4 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold tabular-nums mt-1.5">{sortedSchedules.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {sortedSchedules[0]
                      ? `Berikutnya: ${sortedSchedules[0].startTime}`
                      : 'Belum ada agenda'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => jumpToKind('habits')}
                  className="p-4 rounded-xl bg-card border hover:border-primary/40 text-left transition-colors cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Daily Habits</span>
                    <Flame className="size-4 text-orange-600" />
                  </div>
                  <p className="text-xl font-bold tabular-nums mt-1.5">
                    {activeHabitsCount} / {data.habits.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Target selesai hari ini
                  </p>
                </button>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <PriorityCard
                    priorities={filteredPriorities}
                    completedCount={completedCount}
                    totalActiveCount={data.priorities.length}
                    onToggle={(id) => void onTogglePriority(id)}
                    onDelete={askDeletePriority}
                    onAdd={openTaskModal}
                  />
                  <ScheduleCard
                    schedules={sortedSchedules}
                    onAdd={() => openScheduleModal()}
                    onEdit={openScheduleModal}
                    onDelete={askDeleteSchedule}
                  />
                </div>
                <div className="lg:col-span-5 space-y-6">
                  <BudgetCard
                    limit={budget.limit}
                    spent={budget.spent}
                    percentage={budget.percentage}
                    isOverbudget={budget.isOverbudget}
                    netRemaining={budget.netRemaining}
                    expenses={expenses}
                    quickAmounts={QUICK_EXPENSE_AMOUNTS}
                    expenseAmount={expenseForm.amount}
                    expenseNote={expenseForm.note}
                    isEditingBudget={isEditingBudget}
                    tempBudgetLimit={tempBudgetLimit}
                    showHistory={showHistory}
                    onExpenseAmount={(v) => setExpenseForm((p) => ({ ...p, amount: v }))}
                    onExpenseNote={(v) => setExpenseForm((p) => ({ ...p, note: v }))}
                    onQuickAdd={(amt) =>
                      void handleAddExpenseSubmit(amt, `Pengeluaran ${formatRupiah(amt)}`)
                    }
                    onSubmitExpense={() => void handleAddExpenseSubmit(Number(expenseForm.amount))}
                    onDeleteExpense={askDeleteExpense}
                    onToggleHistory={() => setShowHistory((v) => !v)}
                    onToggleEditBudget={() => setIsEditingBudget((v) => !v)}
                    onTempBudgetLimit={onTempBudgetLimit}
                    onSaveBudgetLimit={(e) => void onSubmitBudgetLimit(e)}
                  />
                  <HabitsCard
                    habits={data.habits}
                    onAdd={() => openHabitModal()}
                    onEdit={openHabitModal}
                    onToggle={(id, lv) => void onHabitToggle(id, lv)}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab.kind === 'tasking' && (
            <div className="space-y-4">
              {isCustomTaskingTab && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-card border text-xs">
                  <span className="text-muted-foreground">
                    Menampilkan pembagian tugas untuk tab{' '}
                    <strong className="text-foreground">{activeTab.title}</strong>.
                  </span>
                  <div className="flex bg-muted p-0.5 rounded-lg border">
                    <button
                      type="button"
                      onClick={() => setTabTaskScope('tab')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer',
                        tabTaskScope === 'tab'
                          ? 'bg-card text-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Khusus Tab Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabTaskScope('all')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer',
                        tabTaskScope === 'all'
                          ? 'bg-card text-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Semua Tugas
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <PriorityCard
                    priorities={filteredPriorities}
                    completedCount={completedCount}
                    totalActiveCount={data.priorities.length}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    showCategoryFilter
                    onToggle={(id) => void onTogglePriority(id)}
                    onDelete={askDeletePriority}
                    onAdd={openTaskModal}
                  />
                </div>
                <div className="lg:col-span-5">
                  <WaitingBoxCard
                    items={filteredWaiting}
                    hasRoom={hasFreeSlot}
                    onPromote={(t) => void onPromoteWaiting(t)}
                    onDelete={askDeleteWaiting}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab.kind === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5">
                <BudgetCard
                  limit={budget.limit}
                  spent={budget.spent}
                  percentage={budget.percentage}
                  isOverbudget={budget.isOverbudget}
                  netRemaining={budget.netRemaining}
                  expenses={expenses}
                  quickAmounts={QUICK_EXPENSE_AMOUNTS}
                  expenseAmount={expenseForm.amount}
                  expenseNote={expenseForm.note}
                  isEditingBudget={isEditingBudget}
                  tempBudgetLimit={tempBudgetLimit}
                  showHistory
                  alwaysShowHistory
                  onExpenseAmount={(v) => setExpenseForm((p) => ({ ...p, amount: v }))}
                  onExpenseNote={(v) => setExpenseForm((p) => ({ ...p, note: v }))}
                  onQuickAdd={(amt) =>
                    void handleAddExpenseSubmit(amt, `Pengeluaran ${formatRupiah(amt)}`)
                  }
                  onSubmitExpense={() => void handleAddExpenseSubmit(Number(expenseForm.amount))}
                  onDeleteExpense={askDeleteExpense}
                  onToggleHistory={() => setShowHistory((v) => !v)}
                  onToggleEditBudget={() => setIsEditingBudget((v) => !v)}
                  onTempBudgetLimit={onTempBudgetLimit}
                  onSaveBudgetLimit={(e) => void onSubmitBudgetLimit(e)}
                />
              </div>
              <div className="lg:col-span-7">
                <BudgetAllocationCard
                  tabTitle={activeTab.title}
                  budgetLimit={budget.limit}
                  allocations={allocations}
                  totalAllocated={totalAllocated}
                  onAddAllocation={addAllocation}
                  onSpendFromAllocation={handleSpendFromAllocation}
                  onDeleteAllocation={deleteAllocation}
                />
              </div>
            </div>
          )}

          {activeTab.kind === 'schedule' && (
            <ScheduleCard
              schedules={sortedSchedules}
              onAdd={() => openScheduleModal()}
              onEdit={openScheduleModal}
              onDelete={askDeleteSchedule}
            />
          )}

          {activeTab.kind === 'habits' && (
            <HabitsCard
              habits={data.habits}
              onAdd={() => openHabitModal()}
              onEdit={openHabitModal}
              onToggle={(id, lv) => void onHabitToggle(id, lv)}
            />
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        onConfirm={confirm.onConfirm}
        onClose={closeConfirm}
      />

      <TaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        form={taskForm}
        onChange={(p) => setTaskForm((prev) => ({ ...prev, ...p }))}
        onSubmit={(e) => void onSubmitTask(e)}
        isFull={!hasFreeSlot}
        durations={DURATION_OPTIONS}
        activeTabTitle={isCustomTaskingTab ? activeTab.title : undefined}
      />

      <HabitModal
        open={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        editing={editingHabitId !== null}
        form={habitForm}
        onChange={(p) => setHabitForm((prev) => ({ ...prev, ...p }))}
        onSubmit={(e) => void onSubmitHabit(e)}
        onDelete={
          editingHabitId !== null
            ? () => {
                void onDeleteHabit(editingHabitId);
                setShowHabitModal(false);
              }
            : undefined
        }
      />

      <ScheduleModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        editing={editingScheduleId !== null}
        form={scheduleForm}
        onChange={(p) => setScheduleForm((prev) => ({ ...prev, ...p }))}
        onSubmit={(e) => void onSubmitSchedule(e)}
        onDelete={
          editingScheduleId !== null
            ? () =>
                openConfirm({
                  title: 'Hapus Agenda Ini?',
                  description: `Agenda "${scheduleForm.title}" akan dihapus dari daftar.`,
                  confirmLabel: 'Hapus Agenda',
                  onConfirm: () => {
                    void onDeleteSchedule(editingScheduleId);
                    setShowScheduleModal(false);
                  },
                })
            : undefined
        }
      />

      <TabModal
        open={showTabModal}
        editing={editingTabId !== null}
        form={tabForm}
        onChange={(patch) => setTabForm((prev) => ({ ...prev, ...patch }))}
        onClose={() => setShowTabModal(false)}
        onSubmit={handleSaveTabForm}
      />

      <MobileBottomNav
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={selectTab}
        onAddTab={openNewTabModal}
      />
    </div>
  );
}
