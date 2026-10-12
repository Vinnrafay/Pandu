import { useEffect, useState, type FormEvent, useCallback } from 'react';
import { 
  CheckCircle2, 
  Wallet, 
  Zap, 
  Flame, 
  Plus, 
  Inbox, 
  ArrowRightLeft, 
  X, 
  Clock, 
  Timer, 
  Pencil, 
  Trash2, 
  Receipt, 
  Calendar, 
  Filter, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  LogOut, 
  User 
} from 'lucide-react';
import { panduService, type ExpenseItem, type ScheduleItem, type PlatformType } from './api/panduService';
import type { DashboardData, Priority, Habit } from './types/pandu';
import LandingPage from './LandingPage';

/* ==========================================
   BRAND ICONS
   ========================================== */

function GoogleMeetIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M15 12.5L19.5 9V15L15 11.5V12.5Z" fill="#00AC47" />
      <path d="M4.5 7H12.5C13.6 7 14.5 7.9 14.5 9V15C14.5 16.1 13.6 17 12.5 17H4.5C3.4 17 2.5 16.1 2.5 15V9C2.5 7.9 3.4 7 4.5 7Z" fill="#00832D" />
      <path d="M2.5 9C2.5 7.9 3.4 7 4.5 7H12.5V10.5H2.5V9Z" fill="#EA4335" />
      <path d="M2.5 10.5H14.5V13.5H2.5V10.5Z" fill="#FFBA00" />
      <path d="M2.5 13.5H14.5V15C14.5 16.1 13.6 17 12.5 17H4.5C3.4 17 2.5 16.1 2.5 15V13.5Z" fill="#2684FC" />
      <path d="M14.5 9L19.5 7V10L14.5 11.5V9Z" fill="#0066DA" />
      <path d="M14.5 12.5L19.5 14V17L14.5 15V12.5Z" fill="#00832D" />
    </svg>
  );
}

function ZoomIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#2D8CFF" />
      <rect x="5" y="7.5" width="8.5" height="9" rx="1.5" fill="white" />
      <path d="M14 10.2L18.5 7.8V16.2L14 13.8V10.2Z" fill="white" />
    </svg>
  );
}

function TeamsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#505AC9" />
      <circle cx="15.5" cy="7" r="1.5" fill="#7B83EB" />
      <path d="M13.5 9.5H17.5C18.3 9.5 19 10.2 19 11V12.5C19 13.3 18.3 14 17.5 14H13.5V9.5Z" fill="#7B83EB" />
      <rect x="4.5" y="7" width="9.5" height="10" rx="1.5" fill="#3940AB" />
      <path d="M6.5 9.5H12V11H10V15H8.5V11H6.5V9.5Z" fill="white" />
    </svg>
  );
}

function GoogleCalendarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="3" y="3" width="18" height="6" rx="1" fill="#4285F4" />
      <text x="12" y="18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#3C4043">31</text>
    </svg>
  );
}

const PLATFORM_CONFIG: Record<PlatformType, { label: string; Icon: React.FC<{ className?: string }> }> = {
  meet: { label: 'Meet', Icon: GoogleMeetIcon },
  zoom: { label: 'Zoom', Icon: ZoomIcon },
  teams: { label: 'Teams', Icon: TeamsIcon },
  calendar: { label: 'Acara', Icon: GoogleCalendarIcon },
};

const formatRupiah = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

const formatScheduleDate = (isoDate: string) => {
  const dateObj = new Date(isoDate);
  const month = isNaN(dateObj.getTime()) ? 'Okt' : dateObj.toLocaleDateString('id-ID', { month: 'short' });
  const day = isNaN(dateObj.getTime()) ? '12' : String(dateObj.getDate()).padStart(2, '0');
  return { month, day };
};

const INITIAL_DATA: DashboardData = {
  date: new Date().toISOString().split('T')[0],
  priorities: [],
  waiting_box: [],
  budget: { limit: 150000, spent: 0 },
  habits: []
};

interface AlertDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

/* ============================================================
   KOMPONEN SKELETON LOADER (MIRROR DARI DASHBOARD SEBENARNYA)
   ============================================================ */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] p-6 lg:p-8 antialiased animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navbar Skeleton */}
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

        {/* Title Bar Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-36 h-7 bg-slate-200 rounded-lg" />
            <div className="w-64 h-3.5 bg-slate-200 rounded-md" />
          </div>
          <div className="w-36 h-9 bg-slate-200 rounded-lg" />
        </div>

        {/* Bento Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Kolom Kiri Skeleton (7 Kolom) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Prioritas Skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-200 rounded-md" />
                  <div className="w-32 h-4 bg-slate-200 rounded-md" />
                </div>
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

            {/* 2. Agenda Mingguan Skeleton */}
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

            {/* 3. Kotak Tunggu Skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-16 h-5 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 bg-slate-50 rounded-lg h-9 bg-slate-100" />
                <div className="p-2.5 bg-slate-50 rounded-lg h-9 bg-slate-100" />
              </div>
            </div>

          </div>

          {/* Kolom Kanan Skeleton (5 Kolom) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Anggaran Harian Skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="w-28 h-4 bg-slate-200 rounded" />
                <div className="flex gap-2">
                  <div className="w-16 h-5 bg-slate-200 rounded" />
                  <div className="w-16 h-5 bg-slate-200 rounded" />
                </div>
              </div>

              {/* Status Box */}
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

              {/* Action Buttons Skeleton */}
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

            {/* 2. Daily Habits Skeleton */}
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
   MAIN APP CONTROLLER
   ============================================================ */

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'dashboard'>(() => {
    return window.location.hash === '#/dashboard' ? 'dashboard' : 'landing';
  });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [displayRoute, setDisplayRoute] = useState<'landing' | 'dashboard'>(currentRoute);

  const [guestUser, setGuestUser] = useState<{ id: string; name: string } | null>(() => {
    const saved = localStorage.getItem('pandu_guest');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Alerts
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Hapus',
    isDestructive: true,
    onConfirm: () => {},
  });

  const [toastAlert, setToastAlert] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'warning' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const triggerToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => {
      setToastAlert((prev) => ({ ...prev, show: false }));
    }, 3200);
  };

  const openConfirmation = (config: Omit<AlertDialogState, 'isOpen'>) => {
    setAlertDialog({ ...config, isOpen: true });
  };

  const closeConfirmation = () => {
    setAlertDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Filter & Budget Forms
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Pending' | 'Selesai'>('Semua');

  const [expenseForm, setExpenseForm] = useState({ amount: '', note: '' });
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [tempBudgetLimit, setTempBudgetLimit] = useState<string>('150000');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Dialog Forms
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

  /* ---------------- SMOOTH ROUTE TRANSITION ---------------- */
  const navigateTo = useCallback((target: 'landing' | 'dashboard') => {
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
  }, [currentRoute, displayRoute]);

  // Handle Browser Back / Forward Button
  useEffect(() => {
    const handleHashChange = () => {
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

  // Load Saved Data
  const loadSavedData = useCallback(async (guestId: string) => {
    setLoading(true);

    const localStore = localStorage.getItem(`pandu_data_${guestId}`);
    if (localStore) {
      try {
        const parsed = JSON.parse(localStore);
        if (parsed.data) setData(parsed.data);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.schedules) setSchedules(parsed.schedules);
        setTempBudgetLimit(String(parsed.data?.budget?.limit ?? 150000));
        setLoading(false);
        return;
      } catch {
        // Fallback
      }
    }

    try {
      const res = await panduService.getDashboard();
      if (res) {
        setData({
          date: res.date ?? INITIAL_DATA.date,
          priorities: Array.isArray(res.priorities) ? res.priorities : [],
          waiting_box: Array.isArray(res.waiting_box) ? res.waiting_box : [],
          budget: res.budget ?? { limit: 150000, spent: 0 },
          habits: Array.isArray(res.habits) ? res.habits : [],
        });
        if (Array.isArray(res.expenses)) setExpenses(res.expenses);
        if (Array.isArray(res.schedules)) setSchedules(res.schedules);
        setTempBudgetLimit(String(res.budget?.limit ?? 150000));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (guestUser) {
      loadSavedData(guestUser.id);
    } else {
      setLoading(false);
    }
  }, [guestUser, loadSavedData]);

  // Auto-Save Perubahan
  useEffect(() => {
    if (guestUser && !loading) {
      const bundle = { data, expenses, schedules };
      localStorage.setItem(`pandu_data_${guestUser.id}`, JSON.stringify(bundle));
    }
  }, [data, expenses, schedules, guestUser, loading]);

  const handleLoginAsGuest = (name: string) => {
    let activeGuest = guestUser;
    if (!activeGuest) {
      activeGuest = {
        id: 'guest_' + Math.random().toString(36).substring(2, 9),
        name: name || 'Tamu',
      };
    } else {
      activeGuest = { ...activeGuest, name: name || activeGuest.name };
    }

    localStorage.setItem('pandu_guest', JSON.stringify(activeGuest));
    setGuestUser(activeGuest);
    loadSavedData(activeGuest.id);
    navigateTo('dashboard');
    triggerToast(`Selamat datang, ${activeGuest.name}!`, 'info');
  };

  const handleLogout = () => {
    localStorage.removeItem('pandu_guest');
    setGuestUser(null);
    navigateTo('landing');
    triggerToast('Berhasil keluar dari sesi', 'info');
  };

  /* ---------------- CRUD HANDLERS ---------------- */
  const handleTogglePriority = async (id: number) => {
    setData((prev) => ({
      ...prev,
      priorities: prev.priorities.map((item) =>
        item.id === id ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' } : item
      ),
    }));

    try {
      await panduService.togglePriority(id);
    } catch {
      // Local storage persists
    }
  };

  const handleDeletePriority = async (id: number) => {
    setData((prev) => ({
      ...prev,
      priorities: prev.priorities
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, slot_number: idx + 1 })),
    }));

    try {
      await panduService.deletePriority(id);
    } catch {
      // Local storage persists
    }
    triggerToast('Prioritas berhasil dihapus', 'info');
  };

  const handleSaveTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const currentPriorities = data.priorities ?? [];
    const isFull = currentPriorities.length >= 3;
    const targetSlot = isFull ? null : currentPriorities.length + 1;

    const newTask: Priority = {
      id: Date.now(),
      title: taskForm.title.trim(),
      slot_number: targetSlot,
      status: isFull ? 'waiting_box' : 'pending',
      target_time: taskForm.targetTime,
      duration_minutes: taskForm.duration,
    };

    if (isFull) {
      setData((prev) => ({ ...prev, waiting_box: [newTask, ...prev.waiting_box] }));
      triggerToast('Slot penuh! Masuk ke Kotak Tunggu', 'warning');
    } else {
      setData((prev) => ({ ...prev, priorities: [...prev.priorities, newTask] }));
      triggerToast('Prioritas baru ditambahkan', 'success');
    }

    try {
      await panduService.createPriority({
        title: taskForm.title.trim(),
        slot_number: targetSlot,
        target_time: taskForm.targetTime,
        duration_minutes: taskForm.duration,
      });
    } catch {
      // Local storage persists
    }

    setTaskForm({ title: '', targetTime: '14:00', duration: 45 });
    setShowTaskModal(false);
  };

  const handleSwapPriority = async (waitingTask: Priority) => {
    const slotOne = data.priorities[0];
    if (!slotOne) return;

    setData((prev) => ({
      ...prev,
      priorities: [{ ...waitingTask, slot_number: 1, status: 'pending' }, ...prev.priorities.slice(1)],
      waiting_box: [{ ...slotOne, slot_number: null, status: 'waiting_box' }, ...prev.waiting_box.filter((w) => w.id !== waitingTask.id)]
    }));

    try {
      await panduService.swapPriority(waitingTask.id);
    } catch {
      // Local storage persists
    }
    triggerToast('Tugas ditukar ke Slot 1', 'success');
  };

  const handleAddExpense = async (amount: number, customNote?: string) => {
    if (!amount || isNaN(amount) || amount <= 0) return;
    const note = customNote || expenseForm.note.trim() || 'Pengeluaran';
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newExpense: ExpenseItem = { id: Date.now(), amount, note, time };
    setExpenses((prev) => [newExpense, ...prev]);
    setData((prev) => ({
      ...prev,
      budget: { ...prev.budget, spent: prev.budget.spent + amount },
    }));

    try {
      await panduService.createExpense(amount, note);
    } catch {
      // Local storage persists
    }

    triggerToast(`Pengeluaran ${formatRupiah(amount)} dicatat`, 'success');
    setExpenseForm({ amount: '', note: '' });
  };

  const handleDeleteExpense = async (id: number, amount: number) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    setData((prev) => ({
      ...prev,
      budget: { ...prev.budget, spent: Math.max(0, prev.budget.spent - amount) },
    }));

    try {
      await panduService.deleteExpense(id);
    } catch {
      // Local storage persists
    }
    triggerToast('Transaksi dihapus & kuota dipulihkan', 'info');
  };

  const handleSaveBudgetLimit = async (e: FormEvent) => {
    e.preventDefault();
    const limit = Number(tempBudgetLimit);
    if (!limit || isNaN(limit) || limit <= 0) return;

    setData((prev) => ({ ...prev, budget: { ...prev.budget, limit } }));

    try {
      await panduService.updateBudgetLimit(limit);
    } catch {
      // Local storage persists
    }
    triggerToast('Batas anggaran harian disimpan', 'success');
    setIsEditingBudget(false);
  };

  const handleHabitToggle = async (habitId: number, level: 'baseline' | 'normal') => {
    const current = data.habits.find((h) => h.id === habitId);
    const nextStatus = current?.status === level ? 'none' : level;

    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === habitId ? { ...h, status: nextStatus } : h)),
    }));

    try {
      await panduService.logHabit(habitId, nextStatus);
    } catch {
      // Local storage persists
    }
  };

  const openHabitModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabitId(habit.id);
      setHabitForm({ name: habit.name, baseline: habit.baseline_desc, normal: habit.normal_desc });
    } else {
      setEditingHabitId(null);
      setHabitForm({ name: '', baseline: '', normal: '' });
    }
    setShowHabitModal(true);
  };

  const handleSaveHabit = async (e: FormEvent) => {
    e.preventDefault();
    if (!habitForm.name.trim()) return;

    if (editingHabitId) {
      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((h) =>
          h.id === editingHabitId
            ? { ...h, name: habitForm.name.trim(), baseline_desc: habitForm.baseline.trim(), normal_desc: habitForm.normal.trim() }
            : h
        ),
      }));
      try {
        await panduService.updateHabit(editingHabitId, {
          name: habitForm.name.trim(),
          baseline_desc: habitForm.baseline.trim(),
          normal_desc: habitForm.normal.trim(),
        });
      } catch {
        // Local storage persists
      }
      triggerToast('Habit diperbarui', 'success');
    } else {
      const newHabit: Habit = {
        id: Date.now(),
        name: habitForm.name.trim(),
        baseline_desc: habitForm.baseline.trim() || 'Target Minimal',
        normal_desc: habitForm.normal.trim() || 'Target Penuh',
        status: 'none',
        streak: 0,
      };
      setData((prev) => ({ ...prev, habits: [...prev.habits, newHabit] }));
      try {
        await panduService.createHabit({
          name: habitForm.name.trim(),
          baseline_desc: habitForm.baseline.trim() || 'Target Minimal',
          normal_desc: habitForm.normal.trim() || 'Target Penuh',
        });
      } catch {
        // Local storage persists
      }
      triggerToast('Habit baru ditambahkan', 'success');
    }
    setShowHabitModal(false);
  };

  const handleDeleteHabit = async (id: number) => {
    setData((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
    try {
      await panduService.deleteHabit(id);
    } catch {
      // Local storage persists
    }
    triggerToast('Habit dihapus', 'info');
    setShowHabitModal(false);
  };

  const openScheduleModal = (item?: ScheduleItem) => {
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

  const handleSaveSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.title.trim()) return;

    if (editingScheduleId) {
      setSchedules((prev) =>
        prev.map((item) => (item.id === editingScheduleId ? { ...item, ...scheduleForm } : item))
      );
      try {
        await panduService.updateSchedule(editingScheduleId, scheduleForm);
      } catch {
        // Local storage persists
      }
      triggerToast('Agenda berhasil diperbarui', 'success');
    } else {
      const newItem: ScheduleItem = { id: Date.now(), ...scheduleForm };
      setSchedules((prev) => [...prev, newItem]);
      try {
        await panduService.createSchedule(scheduleForm);
      } catch {
        // Local storage persists
      }
      triggerToast('Agenda berhasil dijadwalkan', 'success');
    }
    setShowScheduleModal(false);
  };

  const handleDeleteSchedule = async (id: number) => {
    setSchedules((prev) => prev.filter((item) => item.id !== id));
    try {
      await panduService.deleteSchedule(id);
    } catch {
      // Local storage persists
    }
    triggerToast('Agenda dihapus', 'info');
  };

  const budgetLimit = data.budget.limit;
  const budgetSpent = data.budget.spent;
  const isOverbudget = budgetSpent > budgetLimit;
  const netRemaining = budgetLimit - budgetSpent;
  const budgetPercentage = budgetLimit > 0 ? Math.min(100, Math.round((budgetSpent / budgetLimit) * 100)) : 0;

  const filteredPriorities = data.priorities.filter((p) => {
    if (filterStatus === 'Selesai') return p.status === 'completed';
    if (filterStatus === 'Pending') return p.status === 'pending';
    return true;
  });

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-x-hidden selection:bg-slate-900 selection:text-white">
      
      {/* Toast Alert Popover */}
      {toastAlert.show && (
        <div className="fixed top-5 right-5 z-70 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`px-3.5 py-2.5 rounded-lg shadow-md border flex items-center gap-2 text-xs font-semibold ${
            toastAlert.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : toastAlert.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {toastAlert.type === 'success' && <CheckCircle2 size={15} className="text-emerald-600" />}
            {toastAlert.type === 'warning' && <AlertTriangle size={15} className="text-amber-600" />}
            {toastAlert.type === 'info' && <Info size={15} className="text-slate-300" />}
            <span>{toastAlert.message}</span>
          </div>
        </div>
      )}

      {/* TRANSITION WRAPPER */}
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
          /* JIKA MASIH LOADING, TAMPILKAN SKELETON */
          <DashboardSkeleton />
        ) : (
          /* KONTEN UTAMA SETELAH SELESAI LOADING */
          <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] p-6 lg:p-8 antialiased">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Header Bar */}
              <header className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => navigateTo('landing')}
                  title="Kembali ke Landing Page"
                >
                  <div>
                    <span className="text-base font-bold tracking-tight block">Pandu</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-700 transition block -mt-0.5">Back To Home</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Filter Popover */}
                  <div className="relative">
                    <button
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
                            onClick={() => { setFilterStatus('Semua'); setShowFilterModal(false); }}
                            className="text-[11px] font-semibold text-emerald-600 hover:underline"
                          >
                            Clear All
                          </button>
                        </div>

                        <div className="space-y-1">
                          {(['Semua', 'Pending', 'Selesai'] as const).map((statusOption) => (
                            <button
                              key={statusOption}
                              onClick={() => { setFilterStatus(statusOption); setShowFilterModal(false); }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                                filterStatus === statusOption ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>Status: {statusOption}</span>
                              {filterStatus === statusOption && <CheckCircle2 size={13} className="text-emerald-600" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5">
                    <Calendar size={13} /> Senin, 12 Okt 2026
                  </span>

                  {/* Guest Profile Badge */}
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User size={13} className="text-slate-700" />
                      {guestUser?.name || 'Tamu'}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 rounded transition"
                      title="Keluar / Ganti Akun"
                    >
                      <LogOut size={13} />
                    </button>
                  </div>
                </div>
              </header>

              {/* Title Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Fokus utama, jadwal mingguan, dan jatah anggaran.</p>
                </div>

                <button
                  onClick={() => setShowTaskModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus size={15} /> Tambah Prioritas
                </button>
              </div>

              {/* Overbudget Warning */}
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

              {/* Bento Grid */}
              <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* KOLOM KIRI (7 Kolom): Prioritas, Agenda, Kotak Tunggu */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* 1. Prioritas Hari Ini */}
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
                                  onClick={() => handleTogglePriority(item.id)}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center border transition shrink-0 ${
                                    isDone 
                                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                                      : 'bg-white border-slate-300 hover:border-slate-400 text-transparent'
                                  }`}
                                >
                                  <Check size={14} strokeWidth={3} />
                                </button>

                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  isDone ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  Slot {index + 1}
                                </span>

                                <div className="min-w-0">
                                  <span className={`text-xs font-semibold block truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
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
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isDone ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {isDone ? 'Complete' : 'Pending'}
                                </span>

                                <button
                                  onClick={() => openConfirmation({
                                    title: 'Hapus Tugas Prioritas?',
                                    description: `Apakah Anda yakin ingin menghapus "${item.title}" dari slot prioritas?`,
                                    confirmLabel: 'Hapus Prioritas',
                                    isDestructive: true,
                                    onConfirm: () => handleDeletePriority(item.id),
                                  })}
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
                          onClick={() => setShowTaskModal(true)}
                          className="w-full py-3 rounded-lg border border-dashed border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 text-xs font-medium flex items-center justify-center gap-2 transition bg-slate-50/40"
                        >
                          <Plus size={13} /> Isi Slot Prioritas {data.priorities.length + 1}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Agenda Mingguan */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">YOUR SCHEDULE</span>
                        <h3 className="text-sm font-semibold text-slate-900">Agenda Mingguan</h3>
                      </div>
                      <button
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
                                  <span className="text-[9px] font-semibold text-slate-400 uppercase leading-none">{month}</span>
                                  <span className="text-sm font-bold text-slate-900 leading-tight">{day}</span>
                                </div>

                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-slate-900 block truncate">{item.title}</span>
                                  <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md text-[11px] font-semibold mt-1">
                                    <Clock size={11} className="text-sky-600" />
                                    <span>{item.startTime} - {item.endTime}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => openScheduleModal(item)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-white transition"
                                  title="Edit agenda"
                                >
                                  <Pencil size={13} />
                                </button>

                                <button
                                  onClick={() => openConfirmation({
                                    title: 'Hapus Agenda Pertemuan?',
                                    description: `Apakah Anda yakin ingin membatalkan agenda "${item.title}"?`,
                                    confirmLabel: 'Hapus Agenda',
                                    isDestructive: true,
                                    onConfirm: () => handleDeleteSchedule(item.id),
                                  })}
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

                  {/* 3. Kotak Tunggu */}
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
                              onClick={() => handleSwapPriority(task)}
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

                {/* KOLOM KANAN (5 Kolom): Anggaran & Habits */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* 1. Anggaran Harian */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-slate-900" />
                        <h3 className="text-sm font-semibold text-slate-900">Anggaran Harian</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition"
                        >
                          <Receipt size={12} /> {showHistory ? 'Tutup' : `Riwayat (${expenses.length})`}
                        </button>
                        <button
                          onClick={() => setIsEditingBudget(!isEditingBudget)}
                          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition"
                        >
                          <Pencil size={12} /> Edit Limit
                        </button>
                      </div>
                    </div>

                    {isEditingBudget && (
                      <form onSubmit={handleSaveBudgetLimit} className="p-3 bg-slate-50 rounded-lg flex items-center gap-2">
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

                    <div className={`p-4 rounded-lg border ${
                      isOverbudget ? 'bg-rose-50/60 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-slate-500 font-medium block">
                            {isOverbudget ? 'Defisit Anggaran' : 'Sisa Kuota'}
                          </span>
                          <span className="text-xl font-bold tabular-nums mt-0.5 block">
                            {isOverbudget ? `- ${formatRupiah(Math.abs(netRemaining))}` : formatRupiah(netRemaining)}
                          </span>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isOverbudget ? 'bg-rose-200/70 text-rose-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isOverbudget ? 'Overbudget' : `${budgetPercentage}% Terpakai`}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full transition-all duration-300 ${isOverbudget ? 'bg-rose-600' : 'bg-slate-900'}`}
                          style={{ width: `${budgetPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {[10000, 25000, 50000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleAddExpense(amt, `Pengeluaran ${formatRupiah(amt)}`)}
                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[11px] font-medium text-slate-700 transition"
                          >
                            +{amt / 1000}k
                          </button>
                        ))}
                      </div>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddExpense(Number(expenseForm.amount));
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
                        <span className="text-xs font-semibold text-slate-700 block">Riwayat Transaksi:</span>
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
                                    onClick={() => openConfirmation({
                                      title: 'Hapus Transaksi?',
                                      description: `Hapus catatan pengeluaran "${item.note}" senilai ${formatRupiah(item.amount)}? Kuota belanja harian akan otomatis dipulihkan.`,
                                      confirmLabel: 'Hapus Transaksi',
                                      isDestructive: true,
                                      onConfirm: () => handleDeleteExpense(item.id, item.amount),
                                    })}
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

                  {/* 2. Daily Habits Module */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Flame size={16} className="text-slate-900" />
                        <h3 className="text-sm font-semibold text-slate-900">Daily Habits</h3>
                      </div>
                      <button
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
                                <span className="text-xs font-semibold text-slate-900 truncate">{habit.name}</span>
                                <span className="text-[10px] text-slate-600 bg-slate-200/80 px-1.5 py-0.2 rounded-full font-medium">
                                  {habit.streak}d
                                </span>
                                <button
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
                                onClick={() => handleHabitToggle(habit.id, 'baseline')}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  habit.status === 'baseline' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                MIN
                              </button>
                              <button
                                onClick={() => handleHabitToggle(habit.id, 'normal')}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  habit.status === 'normal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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

      {/* Modal: Alert Dialog Destruktif */}
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

      {/* Modal: Tambah Prioritas */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Tambah Prioritas Baru</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
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
                    {[15, 30, 45, 60].map((dur) => (
                      <button
                        type="button"
                        key={dur}
                        onClick={() => setTaskForm((p) => ({ ...p, duration: dur }))}
                        className={`py-1.5 text-[11px] font-semibold rounded-md border transition ${
                          taskForm.duration === dur ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
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

      {/* Modal: Tambah & Edit Habit */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingHabitId ? 'Edit Daily Habit' : 'Tambah Habit Baru'}
              </h3>
              <button onClick={() => setShowHabitModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-3.5">
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
                    onClick={() => handleDeleteHabit(editingHabitId)}
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

      {/* Modal: Tambah & Edit Agenda */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingScheduleId ? 'Edit Agenda Mingguan' : 'Tambah Agenda Mingguan'}
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5">
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
                  {(Object.keys(PLATFORM_CONFIG) as PlatformType[]).map((key) => {
                    const { label, Icon } = PLATFORM_CONFIG[key];
                    const isSelected = scheduleForm.platform === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setScheduleForm((p) => ({ ...p, platform: key }))}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition ${
                          isSelected ? 'border-slate-900 bg-slate-50 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'
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
                    onClick={() => openConfirmation({
                      title: 'Hapus Agenda Ini?',
                      description: `Agenda "${scheduleForm.title}" akan dihapus dari daftar.`,
                      confirmLabel: 'Hapus Agenda',
                      isDestructive: true,
                      onConfirm: () => {
                        handleDeleteSchedule(editingScheduleId);
                        setShowScheduleModal(false);
                      },
                    })}
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