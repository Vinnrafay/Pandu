import {
  type FormEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Inbox,
  Info,
  LogOut,
  Pencil,
  Plus,
  Receipt,
  Timer,
  Trash2,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

import {
  type ExpenseItem,
  type PlatformType,
  type ScheduleItem,
  panduService,
} from './api/panduService';
import { setAuthToken } from './api/client';
import type { DashboardData, Habit, Priority } from './types/pandu';
import LandingPage from './LandingPage';
import {
  GoogleCalendarIcon,
  GoogleMeetIcon,
  TeamsIcon,
  ZoomIcon,
} from './components/icons';
import {
  formatHeaderDate,
  formatRupiah,
  formatScheduleDate,
  todayISODate,
} from './lib/format';

/* ============================================================
   KONSTANTA & KONFIGURASI GLOBAL
   Didefinisikan di luar komponen untuk mencegah re-alokasi memori
   pada setiap siklus render React.
   ============================================================ */

const DURATION_OPTIONS = [15, 30, 45, 60] as const;
const QUICK_EXPENSE_AMOUNTS = [10000, 25000, 50000] as const;
const FILTER_OPTIONS = ['Semua', 'Pending', 'Selesai'] as const;
type FilterStatus = (typeof FILTER_OPTIONS)[number];

const INITIAL_DATA: DashboardData = {
  date: new Date().toISOString().split('T')[0],
  priorities: [],
  waiting_box: [],
  budget: { limit: 150000, spent: 0 },
  habits: [],
};

interface AlertDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'warning';
}

/* ============================================================
   HELPER UTILITIES
   ============================================================ */

let lastGeneratedId = Date.now();
const generateUniqueId = (): number => {
  const now = Date.now();
  lastGeneratedId = now > lastGeneratedId ? now : lastGeneratedId + 1;
  return lastGeneratedId;
};

const storageKeyFor = (guestId: string, date: string): string => `pandu_data_${guestId}_${date}`;

interface PlatformConfigItem {
  label: string;
  Icon: (props: { className?: string }) => ReactElement;
}

const PLATFORM_CONFIG: Record<PlatformType, PlatformConfigItem> = {
  meet: { label: 'Meet', Icon: GoogleMeetIcon },
  zoom: { label: 'Zoom', Icon: ZoomIcon },
  teams: { label: 'Teams', Icon: TeamsIcon },
  calendar: { label: 'Acara', Icon: GoogleCalendarIcon },
};

const PLATFORM_KEYS = Object.keys(PLATFORM_CONFIG) as PlatformType[];

/* ============================================================
   SKELETON LOADER
   ============================================================ */

function DashboardSkeleton(): ReactElement {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] p-6 lg:p-8 antialiased animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-200 rounded-lg" />
            <div className="space-y-1">
              <div className="w-16 h-4 bg-slate-200 rounded-md" />
              <div className="w-10 h-2 bg-slate-200 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-20 h-8 bg-slate-200 rounded-lg" />
            <div className="w-32 h-8 bg-slate-200 rounded-lg" />
            <div className="w-24 h-8 bg-slate-200 rounded-lg" />
          </div>
        </header>

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-36 h-7 bg-slate-200 rounded-lg" />
            <div className="w-64 h-3.5 bg-slate-200 rounded-md" />
          </div>
          <div className="w-36 h-9 bg-slate-200 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="w-32 h-4 bg-slate-200 rounded-md" />
                <div className="w-20 h-5 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className="p-3.5 rounded-lg border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-6 h-6 rounded-md bg-slate-200 shrink-0" />
                      <div className="w-12 h-5 rounded bg-slate-200 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="w-3/4 h-3.5 bg-slate-200 rounded" />
                        <div className="w-28 h-2.5 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="w-16 h-5 rounded-full bg-slate-200 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="w-20 h-2.5 bg-slate-200 rounded" />
                  <div className="w-28 h-4 bg-slate-200 rounded" />
                </div>
                <div className="w-28 h-7 bg-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-11 bg-slate-200 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="w-1/2 h-3.5 bg-slate-200 rounded" />
                        <div className="w-24 h-4 bg-slate-200 rounded-md" />
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-16 h-5 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 bg-slate-100 rounded-lg h-9" />
                <div className="p-2.5 bg-slate-100 rounded-lg h-9" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="w-28 h-4 bg-slate-200 rounded" />
                <div className="flex gap-2">
                  <div className="w-16 h-5 bg-slate-200 rounded" />
                  <div className="w-16 h-5 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="w-16 h-3 bg-slate-200 rounded" />
                    <div className="w-32 h-6 bg-slate-200 rounded-md" />
                  </div>
                  <div className="w-20 h-5 bg-slate-200 rounded-full" />
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <div className="flex-1 h-6 bg-slate-200 rounded-md" />
                  <div className="flex-1 h-6 bg-slate-200 rounded-md" />
                  <div className="flex-1 h-6 bg-slate-200 rounded-md" />
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1 h-8 bg-slate-200 rounded-lg" />
                  <div className="w-16 h-8 bg-slate-200 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-4 bg-slate-200 rounded" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((habit) => (
                  <div key={habit} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="w-28 h-3.5 bg-slate-200 rounded" />
                      <div className="w-36 h-2.5 bg-slate-200 rounded" />
                    </div>
                    <div className="w-24 h-7 bg-slate-200 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APLIKASI UTAMA
   ============================================================ */

/**
 * Komponen utama antarmuka Pandu.
 * Mengelola alur dashboard harian, penjadwalan, prioritas, anggaran, dan habit.
 *
 * @returns {ReactElement} Render tree aplikasi Pandu
 */
export default function App(): ReactElement {
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'dashboard'>(() => {
    return window.location.hash === '#/dashboard' ? 'dashboard' : 'landing';
  });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [displayRoute, setDisplayRoute] = useState<'landing' | 'dashboard'>(currentRoute);

  const [guestUser, setGuestUser] = useState<{ id: string; name: string } | null>(() => {
    const saved = localStorage.getItem('pandu_guest');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (parseError) {
        console.error('Gagal melakukan parsing data guest dari storage:', parseError);
        return null;
      }
    }
    return null;
  });

  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Hapus',
    isDestructive: true,
    onConfirm: () => {},
  });

  const [toastAlert, setToastAlert] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const toastTimer = useRef<number | null>(null);

  const triggerToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' = 'success'): void => {
      setToastAlert({ show: true, message, type });
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
      toastTimer.current = window.setTimeout(() => {
        setToastAlert((prev) => ({ ...prev, show: false }));
        toastTimer.current = null;
      }, 3200);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const openConfirmation = (config: Omit<AlertDialogState, 'isOpen'>): void => {
    setAlertDialog({ ...config, isOpen: true });
  };

  const closeConfirmation = (): void => {
    setAlertDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');

  const [expenseForm, setExpenseForm] = useState({ amount: '', note: '' });
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [tempBudgetLimit, setTempBudgetLimit] = useState<string>('150000');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [taskForm, setTaskForm] = useState({ title: '', targetTime: '14:00', duration: 45 });

  const [showHabitModal, setShowHabitModal] = useState<boolean>(false);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [habitForm, setHabitForm] = useState({ name: '', baseline: '', normal: '' });

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    platform: PlatformType;
  }>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '13:00',
    endTime: '13:45',
    platform: 'calendar',
  });

  const navigateTo = useCallback(
    (target: 'landing' | 'dashboard'): void => {
      if (target === currentRoute && target === displayRoute) return;

      setIsTransitioning(true);

      const targetHash = target === 'dashboard' ? '#/dashboard' : '#/';
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }

      setTimeout(() => {
        setDisplayRoute(target);
        setCurrentRoute(target);
        window.scrollTo({ top: 0, behavior: 'instant' });

        setTimeout(() => {
          setIsTransitioning(false);
        }, 30);
      }, 180);
    },
    [currentRoute, displayRoute],
  );

  useEffect(() => {
    const handleHashChange = (): void => {
      const route = window.location.hash === '#/dashboard' ? 'dashboard' : 'landing';
      if (route !== currentRoute) {
        setIsTransitioning(true);
        setTimeout(() => {
          setDisplayRoute(route);
          setCurrentRoute(route);
          window.scrollTo({ top: 0, behavior: 'instant' });
          setTimeout(() => setIsTransitioning(false), 30);
        }, 180);
      }
    };

    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
  }, [currentRoute]);

  const loadSavedData = useCallback(
    async (guestId: string, signal?: { isMounted: boolean }): Promise<void> => {
      setLoading(true);
      const today = todayISODate();

      // Cache-then-revalidate: tampilkan cache hari ini dulu, lalu segarkan dari server.
      const localStore = localStorage.getItem(storageKeyFor(guestId, today));
      if (localStore) {
        try {
          const parsed = JSON.parse(localStore);
          if (signal && !signal.isMounted) return;
          if (parsed.data) setData(parsed.data);
          if (parsed.expenses) setExpenses(parsed.expenses);
          if (parsed.schedules) setSchedules(parsed.schedules);
          setTempBudgetLimit(String(parsed.data?.budget?.limit ?? 150000));
          setLoading(false);
        } catch (parseError) {
          console.error('Gagal memuat cache lokal Pandu:', parseError);
        }
      }

      try {
        const res = await panduService.getDashboard(today);
        if (signal && !signal.isMounted) return;
        if (res) {
          setData({
            date: res.date ?? today,
            priorities: Array.isArray(res.priorities) ? res.priorities : [],
            waiting_box: Array.isArray(res.waiting_box) ? res.waiting_box : [],
            budget: res.budget ?? { limit: 150000, spent: 0 },
            habits: Array.isArray(res.habits) ? res.habits : [],
          });
          if (Array.isArray(res.expenses)) setExpenses(res.expenses);
          if (Array.isArray(res.schedules)) setSchedules(res.schedules);
          setTempBudgetLimit(String(res.budget?.limit ?? 150000));
        }
      } catch (fetchError) {
        console.error('Gagal mengambil data dashboard dari backend:', fetchError);
        if (signal?.isMounted) {
          triggerToast('Gagal terhubung ke server, data offline aktif', 'warning');
        }
      } finally {
        if (!signal || signal.isMounted) {
          setLoading(false);
        }
      }
    },
    [triggerToast],
  );

  useEffect(() => {
    const signal = { isMounted: true };
    if (guestUser) {
      // Sinkronisasi ke sistem eksternal (localStorage + jaringan): loading cache-then-revalidate
      // hanya jalan saat guest berubah. Pengecualian sah untuk react-hooks/set-state-in-effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadSavedData(guestUser.id, signal);
    } else {
      setLoading(false);
    }
    return () => {
      signal.isMounted = false;
    };
  }, [guestUser, loadSavedData]);

  // Debounce penyimpanan lokal per hari agar tidak membebani event loop pada mutasi beruntun
  useEffect(() => {
    if (!guestUser || loading) return;

    const timerId = setTimeout(() => {
      try {
        const bundle = { data, expenses, schedules };
        localStorage.setItem(storageKeyFor(guestUser.id, data.date), JSON.stringify(bundle));
      } catch (storageError) {
        console.error('Gagal menyimpan otomatis data ke storage:', storageError);
      }
    }, 250);

    return () => clearTimeout(timerId);
  }, [data, expenses, schedules, guestUser, loading]);

  const handleLoginAsGuest = async (name: string): Promise<void> => {
    const cleanName = name.trim();
    let activeGuest = guestUser;

    if (!activeGuest) {
      activeGuest = {
        id: `guest_${Math.random().toString(36).substring(2, 9)}`,
        name: cleanName !== '' ? cleanName : 'Tamu',
      };
    } else {
      activeGuest = {
        ...activeGuest,
        name: cleanName !== '' ? cleanName : activeGuest.name,
      };
    }

    try {
      localStorage.setItem('pandu_guest', JSON.stringify(activeGuest));
    } catch (storageError) {
      console.error('Gagal menyimpan sesi guest:', storageError);
    }

    // Best-effort: tukar nama guest dengan token server bila backend sudah mendukungnya.
    const token = await panduService.authGuest(activeGuest.name);
    if (token) setAuthToken(token);

    setGuestUser(activeGuest);
    void loadSavedData(activeGuest.id);
    navigateTo('dashboard');
    triggerToast(`Selamat datang, ${activeGuest.name}!`, 'info');
  };

  const handleLogout = (): void => {
    try {
      localStorage.removeItem('pandu_guest');
    } catch (storageError) {
      console.error('Gagal membersihkan sesi guest:', storageError);
    }
    setAuthToken(null);
    setGuestUser(null);
    navigateTo('landing');
    triggerToast('Berhasil keluar dari sesi', 'info');
  };

  const handleTogglePriority = async (id: number): Promise<void> => {
    const snapshot = data.priorities;
    setData((prev) => ({
      ...prev,
      priorities: prev.priorities.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' }
          : item,
      ),
    }));

    try {
      await panduService.togglePriority(id);
    } catch (error) {
      console.error(`Gagal sinkron toggle prioritas ${id}:`, error);
      setData((prev) => ({ ...prev, priorities: snapshot }));
      triggerToast('Gagal sinkron prioritas ke server, dibatalkan', 'warning');
    }
  };

  const handleDeletePriority = async (id: number): Promise<void> => {
    const snapshot = data;
    setData((prev) => ({
      ...prev,
      priorities: prev.priorities
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, slot_number: idx + 1 })),
    }));

    try {
      await panduService.deletePriority(id);
      triggerToast('Prioritas berhasil dihapus', 'info');
    } catch (error) {
      console.error(`Gagal menghapus prioritas ${id} di server:`, error);
      setData(snapshot);
      triggerToast('Gagal menghapus prioritas di server, dibatalkan', 'warning');
    }
  };

  const handleSaveTask = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const cleanTitle = taskForm.title.trim();
    if (!cleanTitle) return;

    const currentPriorities = data.priorities ?? [];
    const isFull = currentPriorities.length >= 3;
    const targetSlot = isFull ? null : currentPriorities.length + 1;

    const newTask: Priority = {
      id: generateUniqueId(),
      title: cleanTitle,
      slot_number: targetSlot,
      status: isFull ? 'waiting_box' : 'pending',
      target_time: taskForm.targetTime,
      duration_minutes: taskForm.duration,
    };

    if (isFull) {
      setData((prev) => ({ ...prev, waiting_box: [newTask, ...prev.waiting_box] }));
    } else {
      setData((prev) => ({ ...prev, priorities: [...prev.priorities, newTask] }));
    }

    try {
      const created = await panduService.createPriority({
        title: cleanTitle,
        slot_number: targetSlot,
        target_time: taskForm.targetTime,
        duration_minutes: taskForm.duration,
      });
      // Ganti temp ID lokal dengan ID authoritative dari server.
      if (created && created.id !== newTask.id) {
        if (isFull) {
          setData((prev) => ({
            ...prev,
            waiting_box: prev.waiting_box.map((w) =>
              w.id === newTask.id ? { ...w, id: created.id } : w,
            ),
          }));
        } else {
          setData((prev) => ({
            ...prev,
            priorities: prev.priorities.map((p) =>
              p.id === newTask.id ? { ...p, id: created.id } : p,
            ),
          }));
        }
      }
      triggerToast(
        isFull ? 'Slot penuh! Masuk ke Kotak Tunggu' : 'Prioritas baru ditambahkan',
        isFull ? 'warning' : 'success',
      );
    } catch (error) {
      console.error('Gagal membuat prioritas di server:', error);
      // Rollback: hapus item optimistik agar tidak divergen dengan server.
      if (isFull) {
        setData((prev) => ({ ...prev, waiting_box: prev.waiting_box.filter((w) => w.id !== newTask.id) }));
      } else {
        setData((prev) => ({ ...prev, priorities: prev.priorities.filter((p) => p.id !== newTask.id) }));
      }
      triggerToast('Gagal menyinkronkan tugas baru ke server', 'warning');
    }

    setTaskForm({ title: '', targetTime: '14:00', duration: 45 });
    setShowTaskModal(false);
  };

  const handleSwapPriority = async (waitingTask: Priority): Promise<void> => {
    const slotOne = data.priorities[0];
    if (!slotOne) return;
    const snapshot = data;

    setData((prev) => ({
      ...prev,
      priorities: [{ ...waitingTask, slot_number: 1, status: 'pending' }, ...prev.priorities.slice(1)],
      waiting_box: [
        { ...slotOne, slot_number: null, status: 'waiting_box' },
        ...prev.waiting_box.filter((w) => w.id !== waitingTask.id),
      ],
    }));

    try {
      await panduService.swapPriority(waitingTask.id);
      triggerToast('Tugas ditukar ke Slot 1', 'success');
    } catch (error) {
      console.error(`Gagal swap tugas prioritas ID ${waitingTask.id}:`, error);
      setData(snapshot);
      triggerToast('Gagal menyinkronkan pertukaran tugas ke server', 'warning');
    }
  };

  const handleAddExpense = async (amount: number, customNote?: string): Promise<void> => {
    if (!amount || isNaN(amount) || amount <= 0) {
      triggerToast('Nominal pengeluaran harus lebih dari 0', 'warning');
      return;
    }
    const defaultNote = expenseForm.note.trim() !== '' ? expenseForm.note.trim() : 'Pengeluaran';
    const note = customNote ?? defaultNote;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newExpense: ExpenseItem = { id: generateUniqueId(), amount, note, time };
    setExpenses((prev) => [newExpense, ...prev]);
    setData((prev) => ({
      ...prev,
      budget: { ...prev.budget, spent: prev.budget.spent + amount },
    }));

    try {
      const created = await panduService.createExpense(amount, note);
      if (created && created.id !== newExpense.id) {
        setExpenses((prev) =>
          prev.map((item) => (item.id === newExpense.id ? { ...item, id: created.id } : item)),
        );
      }
      triggerToast(`Pengeluaran ${formatRupiah(amount)} dicatat`, 'success');
    } catch (error) {
      console.error('Gagal mencatat pengeluaran di server:', error);
      setExpenses((prev) => prev.filter((item) => item.id !== newExpense.id));
      setData((prev) => ({
        ...prev,
        budget: { ...prev.budget, spent: Math.max(0, prev.budget.spent - amount) },
      }));
      triggerToast('Gagal sinkron data transaksi ke server', 'warning');
    }

    setExpenseForm({ amount: '', note: '' });
  };

  const handleDeleteExpense = async (id: number, amount: number): Promise<void> => {
    const snapshotExpenses = expenses;
    const snapshotData = data;
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    setData((prev) => ({
      ...prev,
      budget: { ...prev.budget, spent: Math.max(0, prev.budget.spent - amount) },
    }));

    try {
      await panduService.deleteExpense(id);
      triggerToast('Transaksi dihapus & kuota dipulihkan', 'info');
    } catch (error) {
      console.error(`Gagal menghapus pengeluaran ${id} di server:`, error);
      setExpenses(snapshotExpenses);
      setData(snapshotData);
      triggerToast('Gagal sinkron penghapusan transaksi ke server', 'warning');
    }
  };

  const handleSaveBudgetLimit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const limit = Number(tempBudgetLimit);
    if (!limit || isNaN(limit) || limit <= 0) {
      triggerToast('Limit harus angka lebih dari 0', 'warning');
      return;
    }

    const snapshot = data;
    setData((prev) => ({ ...prev, budget: { ...prev.budget, limit } }));

    try {
      await panduService.updateBudgetLimit(limit, data.date);
      triggerToast('Batas anggaran harian disimpan', 'success');
    } catch (error) {
      console.error('Gagal memperbarui batas anggaran di server:', error);
      setData(snapshot);
      triggerToast('Gagal memperbarui limit di server', 'warning');
    }
    setIsEditingBudget(false);
  };

  const handleHabitToggle = async (habitId: number, level: 'baseline' | 'normal'): Promise<void> => {
    const current = data.habits.find((h) => h.id === habitId);
    const nextStatus = current?.status === level ? 'none' : level;
    const snapshot = data.habits;

    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === habitId ? { ...h, status: nextStatus } : h)),
    }));

    try {
      await panduService.logHabit(habitId, nextStatus, data.date);
    } catch (error) {
      console.error(`Gagal memperbarui status habit ${habitId} di server:`, error);
      setData((prev) => ({ ...prev, habits: snapshot }));
      triggerToast('Gagal sinkron habit ke server', 'warning');
    }
  };

  const openHabitModal = (habit?: Habit): void => {
    if (habit) {
      setEditingHabitId(habit.id);
      setHabitForm({ name: habit.name, baseline: habit.baseline_desc, normal: habit.normal_desc });
    } else {
      setEditingHabitId(null);
      setHabitForm({ name: '', baseline: '', normal: '' });
    }
    setShowHabitModal(true);
  };

  const handleSaveHabit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const cleanHabitName = habitForm.name.trim();
    if (!cleanHabitName) return;

    const baselineDesc = habitForm.baseline.trim() !== '' ? habitForm.baseline.trim() : 'Target Minimal';
    const normalDesc = habitForm.normal.trim() !== '' ? habitForm.normal.trim() : 'Target Penuh';

    if (editingHabitId) {
      const snapshot = data.habits;
      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((h) =>
          h.id === editingHabitId
            ? { ...h, name: cleanHabitName, baseline_desc: baselineDesc, normal_desc: normalDesc }
            : h,
        ),
      }));

      try {
        await panduService.updateHabit(editingHabitId, {
          name: cleanHabitName,
          baseline_desc: baselineDesc,
          normal_desc: normalDesc,
        });
        triggerToast('Habit diperbarui', 'success');
      } catch (error) {
        console.error(`Gagal update habit ${editingHabitId} di server:`, error);
        setData((prev) => ({ ...prev, habits: snapshot }));
        triggerToast('Gagal sinkron pembaruan habit ke server', 'warning');
      }
    } else {
      const tempHabit: Habit = {
        id: generateUniqueId(),
        name: cleanHabitName,
        baseline_desc: baselineDesc,
        normal_desc: normalDesc,
        status: 'none',
        streak: 0,
      };
      setData((prev) => ({ ...prev, habits: [...prev.habits, tempHabit] }));

      try {
        const created = await panduService.createHabit({
          name: cleanHabitName,
          baseline_desc: baselineDesc,
          normal_desc: normalDesc,
        });
        if (created && created.id !== tempHabit.id) {
          setData((prev) => ({
            ...prev,
            habits: prev.habits.map((h) => (h.id === tempHabit.id ? { ...h, id: created.id } : h)),
          }));
        }
        triggerToast('Habit baru ditambahkan', 'success');
      } catch (error) {
        console.error('Gagal membuat habit di server:', error);
        setData((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== tempHabit.id) }));
        triggerToast('Gagal sinkron habit baru ke server', 'warning');
      }
    }
    setShowHabitModal(false);
  };

  const handleDeleteHabit = async (id: number): Promise<void> => {
    const snapshot = data.habits;
    setData((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
    try {
      await panduService.deleteHabit(id);
      triggerToast('Habit dihapus', 'info');
    } catch (error) {
      console.error(`Gagal menghapus habit ${id} di server:`, error);
      setData((prev) => ({ ...prev, habits: snapshot }));
      triggerToast('Gagal sinkron penghapusan habit ke server', 'warning');
    }
    setShowHabitModal(false);
  };

  const openScheduleModal = (item?: ScheduleItem): void => {
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
        date: new Date().toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '13:45',
        platform: 'calendar',
      });
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const cleanTitle = scheduleForm.title.trim();
    if (!cleanTitle) {
      triggerToast('Judul agenda tidak boleh kosong', 'warning');
      return;
    }
    if (scheduleForm.endTime <= scheduleForm.startTime) {
      triggerToast('Jam selesai harus setelah jam mulai', 'warning');
      return;
    }

    if (editingScheduleId) {
      const snapshot = schedules;
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === editingScheduleId ? { ...item, ...scheduleForm, title: cleanTitle } : item,
        ),
      );
      try {
        await panduService.updateSchedule(editingScheduleId, { ...scheduleForm, title: cleanTitle });
        triggerToast('Agenda berhasil diperbarui', 'success');
      } catch (error) {
        console.error(`Gagal update agenda ${editingScheduleId} di server:`, error);
        setSchedules(snapshot);
        triggerToast('Gagal sinkron update agenda ke server', 'warning');
      }
    } else {
      const tempItem: ScheduleItem = { id: generateUniqueId(), ...scheduleForm, title: cleanTitle };
      setSchedules((prev) => [...prev, tempItem]);
      try {
        const created = await panduService.createSchedule({ ...scheduleForm, title: cleanTitle });
        if (created && created.id !== tempItem.id) {
          setSchedules((prev) =>
            prev.map((item) => (item.id === tempItem.id ? { ...item, id: created.id } : item)),
          );
        }
        triggerToast('Agenda berhasil dijadwalkan', 'success');
      } catch (error) {
        console.error('Gagal membuat agenda di server:', error);
        setSchedules((prev) => prev.filter((item) => item.id !== tempItem.id));
        triggerToast('Gagal sinkron agenda baru ke server', 'warning');
      }
    }
    setShowScheduleModal(false);
  };

  const handleDeleteSchedule = async (id: number): Promise<void> => {
    const snapshot = schedules;
    setSchedules((prev) => prev.filter((item) => item.id !== id));
    try {
      await panduService.deleteSchedule(id);
      triggerToast('Agenda dihapus', 'info');
    } catch (error) {
      console.error(`Gagal menghapus agenda ${id} di server:`, error);
      setSchedules(snapshot);
      triggerToast('Gagal sinkron penghapusan agenda ke server', 'warning');
    }
  };

  const budgetLimit = data.budget.limit;
  const budgetSpent = data.budget.spent;
  const isOverbudget = budgetSpent > budgetLimit;
  const netRemaining = budgetLimit - budgetSpent;
  const budgetPercentage =
    budgetLimit > 0 ? Math.min(100, Math.round((budgetSpent / budgetLimit) * 100)) : 0;

  const filteredPriorities = data.priorities.filter((p) => {
    if (filterStatus === 'Selesai') return p.status === 'completed';
    if (filterStatus === 'Pending') return p.status === 'pending';
    return true;
  });

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {toastAlert.show && (
        <div className="fixed top-5 right-5 z-70 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-3.5 py-2.5 rounded-lg shadow-md border flex items-center gap-2 text-xs font-semibold ${
              toastAlert.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toastAlert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {toastAlert.type === 'success' && <CheckCircle2 size={15} className="text-emerald-600" />}
            {toastAlert.type === 'warning' && <AlertTriangle size={15} className="text-amber-600" />}
            {toastAlert.type === 'info' && <Info size={15} className="text-slate-300" />}
            <span>{toastAlert.message}</span>
          </div>
        </div>
      )}

      <div
        className={`transition-all duration-200 ease-out transform ${
          isTransitioning
            ? 'opacity-0 scale-[0.99] translate-y-1 pointer-events-none'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {displayRoute === 'landing' ? (
          <LandingPage onEnterApp={handleLoginAsGuest} />
        ) : loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] p-6 lg:p-8 antialiased">
            <div className="max-w-6xl mx-auto space-y-6">
              <header className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => navigateTo('landing')}
                  title="Kembali ke Landing Page"
                >
                  <div>
                    <span className="text-base font-bold tracking-tight block">Pandu</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-700 transition block -mt-0.5">
                      Back To Home
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFilterModal(!showFilterModal)}
                      className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Filter size={13} className="text-slate-500" /> Filter
                      {filterStatus !== 'Semua' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </button>

                    {showFilterModal && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-40 space-y-2.5">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-900">Filter Prioritas</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterStatus('Semua');
                              setShowFilterModal(false);
                            }}
                            className="text-[11px] font-semibold text-emerald-600 hover:underline"
                          >
                            Clear All
                          </button>
                        </div>

                        <div className="space-y-1">
                          {FILTER_OPTIONS.map((statusOption) => (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() => {
                                setFilterStatus(statusOption);
                                setShowFilterModal(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                                filterStatus === statusOption
                                  ? 'bg-slate-100 font-bold text-slate-900'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>Status: {statusOption}</span>
                              {filterStatus === statusOption && (
                                <CheckCircle2 size={13} className="text-emerald-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5">
                    <Calendar size={13} /> {formatHeaderDate(data.date)}
                  </span>

                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User size={13} className="text-slate-700" />
                      {guestUser?.name ?? 'Tamu'}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 rounded transition"
                      title="Keluar / Ganti Akun"
                    >
                      <LogOut size={13} />
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Fokus utama, jadwal mingguan, dan jatah anggaran.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTaskModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus size={15} /> Tambah Prioritas
                </button>
              </div>

              {isOverbudget && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-rose-900">Peringatan: Batas Anggaran Terlampaui</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Pengeluaran hari ini telah melampaui limit sebesar {formatRupiah(Math.abs(netRemaining))}. Evaluasi pos belanja atau hapus transaksi di menu Riwayat.
                    </p>
                  </div>
                </div>
              )}

              <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-slate-900" />
                        <h2 className="text-sm font-semibold text-slate-900">Prioritas Hari Ini</h2>
                      </div>
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {data.priorities.filter((p) => p.status === 'completed').length} / 3 Selesai
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {filteredPriorities.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                          Belum ada prioritas hari ini. Klik <span className="font-semibold text-slate-700">+ Tambah Prioritas</span> di atas.
                        </div>
                      ) : (
                        filteredPriorities.map((item, index) => {
                          const isDone = item.status === 'completed';
                          return (
                            <div
                              key={item.id}
                              className={`group p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                                isDone
                                  ? 'bg-slate-50/70 border-slate-200/80 text-slate-400'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleTogglePriority(item.id);
                                  }}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center border transition shrink-0 ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'bg-white border-slate-300 hover:border-slate-400 text-transparent'
                                  }`}
                                >
                                  <Check size={14} strokeWidth={3} />
                                </button>

                                <span
                                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    isDone ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  Slot {index + 1}
                                </span>

                                <div className="min-w-0">
                                  <span
                                    className={`text-xs font-semibold block truncate ${
                                      isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                    }`}
                                  >
                                    {item.title}
                                  </span>

                                  {(item.target_time || item.duration_minutes) && (
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                      {item.target_time && (
                                        <span className="flex items-center gap-1">
                                          <Clock size={11} /> {item.target_time}
                                        </span>
                                      )}
                                      {item.duration_minutes && (
                                        <span className="flex items-center gap-1">
                                          <Timer size={11} /> {item.duration_minutes}m
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isDone ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {isDone ? 'Complete' : 'Pending'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openConfirmation({
                                      title: 'Hapus Tugas Prioritas?',
                                      description: `Apakah Anda yakin ingin menghapus "${item.title}" dari slot prioritas?`,
                                      confirmLabel: 'Hapus Prioritas',
                                      isDestructive: true,
                                      onConfirm: () => {
                                        void handleDeletePriority(item.id);
                                      },
                                    })
                                  }
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition opacity-0 group-hover:opacity-100"
                                  title="Hapus prioritas ini"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {data.priorities.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setShowTaskModal(true)}
                          className="w-full py-3 rounded-lg border border-dashed border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 text-xs font-medium flex items-center justify-center gap-2 transition bg-slate-50/40"
                        >
                          <Plus size={13} /> Isi Slot Prioritas {data.priorities.length + 1}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                          YOUR SCHEDULE
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900">Agenda Mingguan</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openScheduleModal()}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-2xs"
                      >
                        <Plus size={13} /> Tambah Agenda
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {schedules.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                          Belum ada agenda mingguan. Klik <span className="font-semibold text-slate-700">+ Tambah Agenda</span> untuk menjadwalkan.
                        </div>
                      ) : (
                        schedules.map((item) => {
                          const { month, day } = formatScheduleDate(item.date);
                          const { Icon: PlatformIcon } = PLATFORM_CONFIG[item.platform];

                          return (
                            <div
                              key={item.id}
                              className="group p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 hover:border-slate-200 rounded-lg flex items-center justify-between gap-3 transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-11 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center shadow-2xs shrink-0">
                                  <span className="text-[9px] font-semibold text-slate-400 uppercase leading-none">
                                    {month}
                                  </span>
                                  <span className="text-sm font-bold text-slate-900 leading-tight">
                                    {day}
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-slate-900 block truncate">
                                    {item.title}
                                  </span>
                                  <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md text-[11px] font-semibold mt-1">
                                    <Clock size={11} className="text-sky-600" />
                                    <span>
                                      {item.startTime} - {item.endTime}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openScheduleModal(item)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-white transition"
                                  title="Edit agenda"
                                >
                                  <Pencil size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openConfirmation({
                                      title: 'Hapus Agenda Pertemuan?',
                                      description: `Apakah Anda yakin ingin membatalkan agenda "${item.title}"?`,
                                      confirmLabel: 'Hapus Agenda',
                                      isDestructive: true,
                                      onConfirm: () => {
                                        void handleDeleteSchedule(item.id);
                                      },
                                    })
                                  }
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white transition"
                                  title="Hapus agenda"
                                >
                                  <Trash2 size={13} />
                                </button>

                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs ml-1">
                                  <PlatformIcon className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Inbox size={16} className="text-slate-600" />
                        <h3 className="text-sm font-semibold text-slate-900">Kotak Tunggu</h3>
                      </div>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {data.waiting_box.length} Antrean
                      </span>
                    </div>

                    {data.waiting_box.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                        Kotak tunggu kosong. Tidak ada antrean tugas di luar fokus utama.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {data.waiting_box.map((task) => (
                          <div
                            key={task.id}
                            className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="font-medium text-slate-700 truncate">{task.title}</span>
                            <button
                              type="button"
                              onClick={() => {
                                void handleSwapPriority(task);
                              }}
                              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1 shrink-0 ml-2"
                            >
                              <ArrowRightLeft size={11} /> Tukar ke Slot 1
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-slate-900" />
                        <h3 className="text-sm font-semibold text-slate-900">Anggaran Harian</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowHistory(!showHistory)}
                          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition"
                        >
                          <Receipt size={12} /> {showHistory ? 'Tutup' : `Riwayat (${expenses.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingBudget(!isEditingBudget)}
                          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition"
                        >
                          <Pencil size={12} /> Edit Limit
                        </button>
                      </div>
                    </div>

                    {isEditingBudget && (
                      <form
                        onSubmit={(e) => {
                          void handleSaveBudgetLimit(e);
                        }}
                        className="p-3 bg-slate-50 rounded-lg flex items-center gap-2"
                      >
                        <input
                          type="number"
                          value={tempBudgetLimit}
                          onChange={(e) => setTempBudgetLimit(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-slate-900"
                        />
                        <button
                          type="submit"
                          className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-800"
                        >
                          Simpan
                        </button>
                      </form>
                    )}

                    <div
                      className={`p-4 rounded-lg border ${
                        isOverbudget
                          ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-slate-500 font-medium block">
                            {isOverbudget ? 'Defisit Anggaran' : 'Sisa Kuota'}
                          </span>
                          <span className="text-xl font-bold tabular-nums mt-0.5 block">
                            {isOverbudget
                              ? `- ${formatRupiah(Math.abs(netRemaining))}`
                              : formatRupiah(netRemaining)}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isOverbudget ? 'bg-rose-200/70 text-rose-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isOverbudget ? 'Overbudget' : `${budgetPercentage}% Terpakai`}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isOverbudget ? 'bg-rose-600' : 'bg-slate-900'
                          }`}
                          style={{ width: `${budgetPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {QUICK_EXPENSE_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              void handleAddExpense(amt, `Pengeluaran ${formatRupiah(amt)}`);
                            }}
                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[11px] font-medium text-slate-700 transition"
                          >
                            +{amt / 1000}k
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void handleAddExpense(Number(expenseForm.amount));
                        }}
                        className="flex gap-1.5"
                      >
                        <input
                          type="number"
                          placeholder="Nominal manual (Rp)..."
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-900"
                        />
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition"
                        >
                          Catat
                        </button>
                      </form>
                    </div>

                    {showHistory && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Riwayat Transaksi:
                        </span>
                        {expenses.length === 0 ? (
                          <p className="text-xs text-slate-400 py-1">Belum ada pengeluaran hari ini.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {expenses.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs"
                              >
                                <div>
                                  <span className="font-medium text-slate-800 block">{item.note}</span>
                                  <span className="text-[10px] text-slate-400">{item.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-700 tabular-nums">
                                    {formatRupiah(item.amount)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openConfirmation({
                                        title: 'Hapus Transaksi?',
                                        description: `Hapus catatan pengeluaran "${item.note}" senilai ${formatRupiah(
                                          item.amount,
                                        )}? Kuota belanja harian akan otomatis dipulihkan.`,
                                        confirmLabel: 'Hapus Transaksi',
                                        isDestructive: true,
                                        onConfirm: () => {
                                          void handleDeleteExpense(item.id, item.amount);
                                        },
                                      })
                                    }
                                    className="text-slate-400 hover:text-rose-600 transition p-0.5"
                                    title="Hapus transaksi"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Flame size={16} className="text-slate-900" />
                        <h3 className="text-sm font-semibold text-slate-900">Daily Habits</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openHabitModal()}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
                      >
                        <Plus size={13} /> Tambah Habit
                      </button>
                    </div>

                    <div className="space-y-2">
                      {data.habits.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                          Belum ada daily habit. Klik <span className="font-semibold text-slate-700">+ Tambah Habit</span> untuk menambahkan.
                        </div>
                      ) : (
                        data.habits.map((habit) => (
                          <div
                            key={habit.id}
                            className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {habit.name}
                                </span>
                                <span className="text-[10px] text-slate-600 bg-slate-200/80 px-1.5 py-0.2 rounded-full font-medium">
                                  {habit.streak}d
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openHabitModal(habit)}
                                  className="text-slate-400 hover:text-slate-700"
                                >
                                  <Pencil size={11} />
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {habit.baseline_desc} / {habit.normal_desc}
                              </p>
                            </div>

                            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  void handleHabitToggle(habit.id, 'baseline');
                                }}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  habit.status === 'baseline'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                MIN
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleHabitToggle(habit.id, 'normal');
                                }}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  habit.status === 'normal'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                FULL
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </div>

      {alertDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-70 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{alertDialog.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{alertDialog.description}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeConfirmation}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  alertDialog.onConfirm();
                  closeConfirmation();
                }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
              >
                {alertDialog.confirmLabel ?? 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Tambah Prioritas Baru</h3>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                void handleSaveTask(e);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Judul Prioritas</label>
                <input
                  type="text"
                  placeholder="Deskripsi tugas..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Target Selesai</label>
                  <input
                    type="time"
                    value={taskForm.targetTime}
                    onChange={(e) => setTaskForm((p) => ({ ...p, targetTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Estimasi Durasi</label>
                  <div className="grid grid-cols-4 gap-1">
                    {DURATION_OPTIONS.map((dur) => (
                      <button
                        type="button"
                        key={dur}
                        onClick={() => setTaskForm((p) => ({ ...p, duration: dur }))}
                        className={`py-1.5 text-[11px] font-semibold rounded-md border transition ${
                          taskForm.duration === dur
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {dur}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {data.priorities.length >= 3 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-medium">
                  Slot 1–3 utama penuh. Tugas ini akan dialihkan ke Kotak Tunggu.
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Simpan Prioritas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHabitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingHabitId ? 'Edit Daily Habit' : 'Tambah Habit Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowHabitModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                void handleSaveHabit(e);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Nama Kebiasaan</label>
                <input
                  type="text"
                  placeholder="Misal: Olahraga..."
                  value={habitForm.name}
                  onChange={(e) => setHabitForm((p) => ({ ...p, name: e.target.value }))}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Target MIN</label>
                  <input
                    type="text"
                    placeholder="5x rep"
                    value={habitForm.baseline}
                    onChange={(e) => setHabitForm((p) => ({ ...p, baseline: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Target FULL</label>
                  <input
                    type="text"
                    placeholder="30x rep"
                    value={habitForm.normal}
                    onChange={(e) => setHabitForm((p) => ({ ...p, normal: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {editingHabitId && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteHabit(editingHabitId);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHabitModal(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Simpan Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingScheduleId ? 'Edit Agenda Mingguan' : 'Tambah Agenda Mingguan'}
              </h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                void handleSaveSchedule(e);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Judul Agenda</label>
                <input
                  type="text"
                  placeholder="Sync Standup Tim..."
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, title: e.target.value }))}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Tanggal</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Jam Mulai</label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Jam Selesai</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-slate-700 block">Platform Meeting</label>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORM_KEYS.map((key) => {
                    const { label, Icon } = PLATFORM_CONFIG[key];
                    const isSelected = scheduleForm.platform === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setScheduleForm((p) => ({ ...p, platform: key }))}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold text-slate-700">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {editingScheduleId && (
                  <button
                    type="button"
                    onClick={() =>
                      openConfirmation({
                        title: 'Hapus Agenda Ini?',
                        description: `Agenda "${scheduleForm.title}" akan dihapus dari daftar.`,
                        confirmLabel: 'Hapus Agenda',
                        isDestructive: true,
                        onConfirm: () => {
                          void handleDeleteSchedule(editingScheduleId);
                          setShowScheduleModal(false);
                        },
                      })
                    }
                    className="px-3 py-2 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}