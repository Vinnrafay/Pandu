import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, setAuthToken } from '@/api/client';
import {
  panduService,
  type BackendDashboardResponse,
  type ExpenseItem,
  type PlatformType,
  type ScheduleItem,
} from '@/api/panduService';
import type { ToastType } from '@/components/dashboard/modals';
import { describeApiError, type FriendlyError } from '@/lib/errorHandler';
import { formatRupiah, todayISODate } from '@/lib/format';
import type { IconName } from '@/lib/iconRegistry';
import { validateDisplayName } from '@/lib/nameFilter';
import { freeSlot, generateUniqueId, isSlotConflict } from '@/lib/priority';
import type { TaskCategory } from '@/lib/taskCategories';
import type { DashboardData, Habit, Priority } from '@/types/pandu';

export interface GuestUser {
  id: string;
  name: string;
  token?: string | null;
  lastUsedAt?: string;
}

interface CachedDashboardPayload {
  data?: DashboardData;
  expenses?: ExpenseItem[];
  schedules?: ScheduleItem[];
}

interface PriorityMeta {
  icon?: IconName;
  category?: TaskCategory;
  tabId?: string;
}

interface HabitMeta {
  icon?: IconName;
}

interface ClientMetaStore {
  priorities: Record<number, PriorityMeta>;
  habits: Record<number, HabitMeta>;
}

const DEFAULT_BUDGET_LIMIT = 150000;

function createInitialData(): DashboardData {
  return {
    date: todayISODate(),
    priorities: [],
    waiting_box: [],
    budget: { limit: DEFAULT_BUDGET_LIMIT, spent: 0 },
    habits: [],
  };
}

function storageKeyFor(guestId: string, date: string): string {
  return `pandu_data_${guestId}_${date}`;
}

function metaKeyFor(guestId: string): string {
  return `pandu_meta_${guestId}`;
}

const SAVED_GUESTS_KEY = 'pandu_saved_guests';

function readStoredGuest(): GuestUser | null {
  try {
    const saved = localStorage.getItem('pandu_guest');
    return saved ? (JSON.parse(saved) as GuestUser) : null;
  } catch {
    return null;
  }
}

function readSavedGuests(): GuestUser[] {
  try {
    const raw = localStorage.getItem(SAVED_GUESTS_KEY);
    if (!raw) {
      const active = readStoredGuest();
      return active ? [active] : [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GuestUser[]) : [];
  } catch {
    return [];
  }
}

function writeSavedGuests(list: GuestUser[]): void {
  try {
    localStorage.setItem(SAVED_GUESTS_KEY, JSON.stringify(list));
  } catch {
    /* abaikan */
  }
}

function upsertSavedGuest(list: GuestUser[], account: GuestUser): GuestUser[] {
  const stamped: GuestUser = { ...account, lastUsedAt: new Date().toISOString() };
  const filtered = list.filter((g) => g.id !== account.id);
  return [stamped, ...filtered].slice(0, 10);
}

function readCachedPayload(guestId: string, date: string): CachedDashboardPayload | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(guestId, date));
    return raw ? (JSON.parse(raw) as CachedDashboardPayload) : null;
  } catch {
    return null;
  }
}

function readMetaStore(guestId: string | null): ClientMetaStore {
  if (!guestId) return { priorities: {}, habits: {} };
  try {
    const raw = localStorage.getItem(metaKeyFor(guestId));
    if (!raw) return { priorities: {}, habits: {} };
    const parsed = JSON.parse(raw) as Partial<ClientMetaStore>;
    return {
      priorities: parsed.priorities ?? {},
      habits: parsed.habits ?? {},
    };
  } catch {
    return { priorities: {}, habits: {} };
  }
}

function writeMetaStore(guestId: string | null, store: ClientMetaStore): void {
  if (!guestId) return;
  try {
    localStorage.setItem(metaKeyFor(guestId), JSON.stringify(store));
  } catch {
    /* storage penuh — abaikan */
  }
}

function mergeMeta(base: DashboardData, meta: ClientMetaStore): DashboardData {
  return {
    ...base,
    priorities: base.priorities.map((p) => {
      const m = meta.priorities[p.id];
      return m ? { ...p, ...m } : p;
    }),
    waiting_box: base.waiting_box.map((w) => {
      const m = meta.priorities[w.id];
      return m ? { ...w, ...m } : w;
    }),
    habits: base.habits.map((h) => {
      const m = meta.habits[h.id];
      return m ? { ...h, ...m } : h;
    }),
  };
}

function normalizePayload(
  res: BackendDashboardResponse,
  fallbackDate: string,
  meta: ClientMetaStore,
): DashboardData {
  const base: DashboardData = {
    date: res.date ?? fallbackDate,
    priorities: Array.isArray(res.priorities) ? res.priorities : [],
    waiting_box: Array.isArray(res.waiting_box) ? res.waiting_box : [],
    budget: res.budget ?? { limit: DEFAULT_BUDGET_LIMIT, spent: 0 },
    habits: Array.isArray(res.habits) ? res.habits : [],
  };
  return mergeMeta(base, meta);
}

export interface UseDashboardDataOptions {
  triggerToast: (message: string, type?: ToastType) => void;
  navigateTo: (target: 'landing' | 'dashboard') => void;
}

/**
 * Encapsulates dashboard state, guest session, localStorage caching, client
 * metadata (icons/categories/tab ownership), structured error handling,
 * optimistic mutations, and server revalidation.
 */
export function useDashboardData({ triggerToast, navigateTo }: UseDashboardDataOptions) {
  const [guestUser, setGuestUser] = useState<GuestUser | null>(readStoredGuest);
  const [savedGuests, setSavedGuests] = useState<GuestUser[]>(readSavedGuests);
  const [initialCache] = useState<CachedDashboardPayload | null>(() => {
    const guest = readStoredGuest();
    return guest ? readCachedPayload(guest.id, todayISODate()) : null;
  });

  const metaRef = useRef<ClientMetaStore>(readMetaStore(guestUser?.id ?? null));
  const guestIdRef = useRef<string | null>(guestUser?.id ?? null);

  const [data, setData] = useState<DashboardData>(() =>
    mergeMeta(
      initialCache?.data ?? createInitialData(),
      readMetaStore(readStoredGuest()?.id ?? null),
    ),
  );
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => initialCache?.expenses ?? []);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => initialCache?.schedules ?? []);
  const [tempBudgetLimit, setTempBudgetLimit] = useState<string>(() =>
    String(initialCache?.data?.budget?.limit ?? DEFAULT_BUDGET_LIMIT),
  );
  const [loading, setLoading] = useState<boolean>(() => Boolean(guestUser && !initialCache));
  const [syncError, setSyncError] = useState<FriendlyError | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const dataRef = useRef(data);
  const expensesRef = useRef(expenses);
  const schedulesRef = useRef(schedules);

  useEffect(() => {
    dataRef.current = data;
    expensesRef.current = expenses;
    schedulesRef.current = schedules;
    guestIdRef.current = guestUser?.id ?? null;
  }, [data, expenses, schedules, guestUser]);

  const setPriorityMeta = useCallback((id: number, meta: PriorityMeta): void => {
    metaRef.current = {
      ...metaRef.current,
      priorities: { ...metaRef.current.priorities, [id]: meta },
    };
    writeMetaStore(guestIdRef.current, metaRef.current);
  }, []);

  const migratePriorityMetaId = useCallback((oldId: number, newId: number): void => {
    const existing = metaRef.current.priorities[oldId];
    if (!existing) return;
    const nextPriorities = { ...metaRef.current.priorities, [newId]: existing };
    delete nextPriorities[oldId];
    metaRef.current = { ...metaRef.current, priorities: nextPriorities };
    writeMetaStore(guestIdRef.current, metaRef.current);
  }, []);

  const setHabitMeta = useCallback((id: number, meta: HabitMeta): void => {
    metaRef.current = {
      ...metaRef.current,
      habits: { ...metaRef.current.habits, [id]: meta },
    };
    writeMetaStore(guestIdRef.current, metaRef.current);
  }, []);

  const migrateHabitMetaId = useCallback((oldId: number, newId: number): void => {
    const existing = metaRef.current.habits[oldId];
    if (!existing) return;
    const nextHabits = { ...metaRef.current.habits, [newId]: existing };
    delete nextHabits[oldId];
    metaRef.current = { ...metaRef.current, habits: nextHabits };
    writeMetaStore(guestIdRef.current, metaRef.current);
  }, []);

  const reportError = useCallback(
    (error: unknown, actionLabel: string, persistBanner = false): FriendlyError => {
      const friendly = describeApiError(error, actionLabel);
      if (persistBanner) setSyncError(friendly);
      triggerToast(friendly.message, 'warning');
      return friendly;
    },
    [triggerToast],
  );

  const clearSyncError = useCallback(() => setSyncError(null), []);

  const applyFresh = useCallback(
    (res: BackendDashboardResponse | null, today: string): DashboardData | null => {
      if (!res) return null;
      const next = normalizePayload(res, today, metaRef.current);
      setData(next);
      if (Array.isArray(res.expenses)) setExpenses(res.expenses);
      if (Array.isArray(res.schedules)) setSchedules(res.schedules);
      setTempBudgetLimit(String(next.budget.limit ?? DEFAULT_BUDGET_LIMIT));
      setSyncError(null);
      return next;
    },
    [],
  );

  const revalidate = useCallback(async (): Promise<DashboardData | null> => {
    try {
      const today = todayISODate();
      const res = await panduService.getDashboard(today);
      return applyFresh(res, today);
    } catch {
      return null;
    }
  }, [applyFresh]);

  const retrySync = useCallback(async (): Promise<void> => {
    setIsSyncing(true);
    try {
      const today = todayISODate();
      const res = await panduService.getDashboard(today);
      applyFresh(res, today);
      triggerToast('Data berhasil disinkronkan dengan server', 'success');
    } catch (error) {
      reportError(error, 'menyinkronkan dashboard', true);
    } finally {
      setIsSyncing(false);
    }
  }, [applyFresh, reportError, triggerToast]);

  useEffect(() => {
    if (!guestUser) return;
    let isMounted = true;
    const today = todayISODate();

    const syncFromServer = async (): Promise<void> => {
      try {
        const res = await panduService.getDashboard(today);
        if (!isMounted) return;
        applyFresh(res, today);
      } catch (error) {
        if (isMounted) {
          const friendly = describeApiError(error, 'memuat data dari server');
          setSyncError(friendly);
          triggerToast('Mode offline aktif: gagal terhubung ke server', 'warning');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void syncFromServer();
    return () => {
      isMounted = false;
    };
  }, [guestUser, applyFresh, triggerToast]);

  useEffect(() => {
    if (!guestUser || loading) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          storageKeyFor(guestUser.id, data.date),
          JSON.stringify({ data, expenses, schedules }),
        );
      } catch {
        /* storage penuh — abaikan */
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [data, expenses, schedules, guestUser, loading]);

  const activateGuestSession = useCallback(
    (account: GuestUser, toastMessage: string): void => {
      try {
        localStorage.setItem('pandu_guest', JSON.stringify(account));
      } catch {
        /* abaikan */
      }
      setSavedGuests((prev) => {
        const next = upsertSavedGuest(prev, account);
        writeSavedGuests(next);
        return next;
      });

      metaRef.current = readMetaStore(account.id);
      guestIdRef.current = account.id;
      const cached = readCachedPayload(account.id, todayISODate());
      if (cached?.data) {
        setData(mergeMeta(cached.data, metaRef.current));
      } else {
        setData(createInitialData());
      }
      setExpenses(cached?.expenses ?? []);
      setSchedules(cached?.schedules ?? []);
      setTempBudgetLimit(String(cached?.data?.budget?.limit ?? DEFAULT_BUDGET_LIMIT));
      setSyncError(null);
      setLoading(!cached);

      if (account.token) {
        setAuthToken(account.token);
      } else {
        setAuthToken(null);
      }
      setGuestUser(account);
      navigateTo('dashboard');
      triggerToast(toastMessage, 'info');
    },
    [navigateTo, triggerToast],
  );

  const handleLoginAsGuest = useCallback(
    async (name: string): Promise<void> => {
      const validationError = validateDisplayName(name, {
        fieldLabel: 'Nama tamu',
        required: false,
        maxLength: 40,
      });
      if (validationError) {
        triggerToast(validationError, 'warning');
        return;
      }
      const cleanName = name.trim() || 'Tamu';
      const token = await panduService.authGuest(cleanName);
      const newGuest: GuestUser = {
        id: `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        token,
        lastUsedAt: new Date().toISOString(),
      };
      activateGuestSession(newGuest, `Selamat datang, ${newGuest.name}! Akun tersimpan otomatis.`);
    },
    [activateGuestSession, triggerToast],
  );

  const handleSelectSavedGuest = useCallback(
    async (account: GuestUser): Promise<void> => {
      let resolvedToken = account.token ?? null;
      if (!resolvedToken) {
        resolvedToken = await panduService.authGuest(account.name);
      }
      const resumed: GuestUser = {
        ...account,
        token: resolvedToken,
        lastUsedAt: new Date().toISOString(),
      };
      activateGuestSession(resumed, `Kembali masuk sebagai ${resumed.name}!`);
    },
    [activateGuestSession],
  );

  const handleRemoveSavedGuest = useCallback(
    (id: string): void => {
      setSavedGuests((prev) => {
        const next = prev.filter((g) => g.id !== id);
        writeSavedGuests(next);
        return next;
      });
      if (guestUser?.id === id) {
        try {
          localStorage.removeItem('pandu_guest');
        } catch {
          /* abaikan */
        }
        setAuthToken(null);
        setGuestUser(null);
      }
      triggerToast('Akun tamu dihapus dari daftar tersimpan', 'info');
    },
    [guestUser?.id, triggerToast],
  );

  const handleLogout = useCallback((): void => {
    if (guestUser) {
      setSavedGuests((prev) => {
        const next = upsertSavedGuest(prev, guestUser);
        writeSavedGuests(next);
        return next;
      });
    }
    try {
      localStorage.removeItem('pandu_guest');
    } catch {
      /* abaikan */
    }
    setAuthToken(null);
    setGuestUser(null);
    setSyncError(null);
    setLoading(false);
    navigateTo('landing');
    triggerToast('Keluar dari dashboard, akun tamu Anda tetap tersimpan', 'info');
  }, [guestUser, navigateTo, triggerToast]);

  const handleTogglePriority = useCallback(
    async (id: number): Promise<void> => {
      const snapshot = dataRef.current.priorities;
      setData((prev) => ({
        ...prev,
        priorities: prev.priorities.map((it) =>
          it.id === id
            ? { ...it, status: it.status === 'completed' ? 'pending' : 'completed' }
            : it,
        ),
      }));
      try {
        const updated = await panduService.togglePriority(id);
        if (updated) {
          setData((prev) => ({
            ...prev,
            priorities: prev.priorities.map((it) =>
              it.id === id ? { ...it, status: updated.status } : it,
            ),
          }));
        }
      } catch (error) {
        setData((prev) => ({ ...prev, priorities: snapshot }));
        reportError(error, 'memperbarui status prioritas');
      }
    },
    [reportError],
  );

  const handleDeletePriority = useCallback(
    async (id: number): Promise<void> => {
      const snapshot = dataRef.current;
      // Sengaja TIDAK me-remap slot_number lokal: server soft-delete tidak me-remap.
      setData((prev) => ({
        ...prev,
        priorities: prev.priorities.filter((it) => it.id !== id),
      }));
      try {
        await panduService.deletePriority(id);
        await revalidate();
        triggerToast('Prioritas berhasil dihapus', 'info');
      } catch (error) {
        setData(snapshot);
        reportError(error, 'menghapus prioritas');
      }
    },
    [reportError, revalidate, triggerToast],
  );

  const handleSaveTask = useCallback(
    async (taskForm: {
      title: string;
      targetTime: string;
      duration: number;
      icon: IconName;
      category: TaskCategory;
      tabId?: string;
    }): Promise<boolean> => {
      const cleanTitle = taskForm.title.trim();
      if (!cleanTitle) return false;
      const snapshot = dataRef.current;
      const slot = freeSlot(snapshot.priorities);
      const isFull = slot === null;
      const tempId = generateUniqueId();
      const meta: PriorityMeta = {
        icon: taskForm.icon,
        category: taskForm.category,
        tabId: taskForm.tabId,
      };
      setPriorityMeta(tempId, meta);

      const newTask: Priority = {
        id: tempId,
        title: cleanTitle,
        slot_number: slot,
        status: isFull ? 'waiting_box' : 'pending',
        target_time: taskForm.targetTime,
        duration_minutes: taskForm.duration,
        ...meta,
      };
      setData((prev) =>
        isFull
          ? { ...prev, waiting_box: [newTask, ...prev.waiting_box] }
          : { ...prev, priorities: [...prev.priorities, newTask] },
      );
      const payload = {
        title: cleanTitle,
        slot_number: slot,
        target_time: taskForm.targetTime,
        duration_minutes: taskForm.duration,
      };
      const announce = (assignedSlot: number | null): void => {
        triggerToast(
          assignedSlot === null
            ? 'Slot penuh! Masuk ke Kotak Tunggu'
            : 'Prioritas baru ditambahkan',
          assignedSlot === null ? 'warning' : 'success',
        );
      };
      try {
        const created = await panduService.createPriority(payload);
        if (created && created.id !== newTask.id) {
          migratePriorityMetaId(newTask.id, created.id);
          setData((prev) => ({
            ...prev,
            priorities: prev.priorities.map((p) =>
              p.id === newTask.id ? { ...p, id: created.id } : p,
            ),
            waiting_box: prev.waiting_box.map((w) =>
              w.id === newTask.id ? { ...w, id: created.id } : w,
            ),
          }));
        }
        await revalidate();
        announce(slot);
        return true;
      } catch (error) {
        if (isSlotConflict(error)) {
          setData(snapshot);
          const fresh = await revalidate();
          if (fresh) {
            const retrySlot = freeSlot(fresh.priorities);
            try {
              const retried = await panduService.createPriority({
                ...payload,
                slot_number: retrySlot,
              });
              if (retried) migratePriorityMetaId(tempId, retried.id);
              await revalidate();
              announce(retrySlot);
              return true;
            } catch (retryError) {
              reportError(retryError, 'menambahkan tugas baru');
              return true;
            }
          }
        } else {
          setData(snapshot);
        }
        reportError(error, 'menambahkan tugas baru');
        return true;
      }
    },
    [migratePriorityMetaId, reportError, revalidate, setPriorityMeta, triggerToast],
  );

  const handleDeleteWaiting = useCallback(
    async (id: number): Promise<void> => {
      const snapshot = dataRef.current;
      setData((prev) => ({
        ...prev,
        waiting_box: prev.waiting_box.filter((w) => w.id !== id),
      }));
      try {
        await panduService.deletePriority(id);
        await revalidate();
        triggerToast('Antrean dihapus', 'info');
      } catch (error) {
        setData(snapshot);
        reportError(error, 'menghapus antrean');
      }
    },
    [reportError, revalidate, triggerToast],
  );

  const handleSwapPriority = useCallback(
    async (waitingTask: Priority): Promise<void> => {
      const snapshot = dataRef.current;
      const slotOne = snapshot.priorities.find((p) => p.slot_number === 1);
      if (!slotOne) {
        await revalidate();
        triggerToast('Data prioritas berubah, silakan coba lagi', 'info');
        return;
      }
      setData((prev) => ({
        ...prev,
        priorities: [
          { ...waitingTask, slot_number: 1, status: 'pending' },
          ...prev.priorities.filter((p) => p.id !== slotOne.id && p.id !== waitingTask.id),
        ],
        waiting_box: [
          { ...slotOne, slot_number: null, status: 'waiting_box' },
          ...prev.waiting_box.filter((w) => w.id !== waitingTask.id),
        ],
      }));
      try {
        await panduService.swapPriority(waitingTask.id);
        await revalidate();
        triggerToast('Tugas ditukar ke Slot 1', 'success');
      } catch (error) {
        setData(snapshot);
        if (error instanceof ApiError && error.status === 404) {
          await revalidate();
          triggerToast('Slot 1 sudah berubah di server, data disegarkan', 'info');
        } else {
          reportError(error, 'menukar prioritas ke Slot 1');
        }
      }
    },
    [reportError, revalidate, triggerToast],
  );

  const handlePromoteWaiting = useCallback(
    async (task: Priority): Promise<void> => {
      const snapshot = dataRef.current;
      const slot = freeSlot(snapshot.priorities);
      if (slot === null) {
        await handleSwapPriority(task);
        return;
      }
      setData((prev) => ({
        ...prev,
        priorities: [...prev.priorities, { ...task, slot_number: slot, status: 'pending' }],
        waiting_box: prev.waiting_box.filter((w) => w.id !== task.id),
      }));
      const payload = {
        title: task.title,
        slot_number: slot,
        target_time: task.target_time,
        duration_minutes: task.duration_minutes,
      };
      const deleteOriginalBestEffort = async (): Promise<void> => {
        try {
          await panduService.deletePriority(task.id);
        } catch {
          /* abaikan — revalidate menentukan kebenaran */
        }
      };
      try {
        const created = await panduService.createPriority(payload);
        await deleteOriginalBestEffort();
        if (created && created.id !== task.id) {
          migratePriorityMetaId(task.id, created.id);
          setData((prev) => ({
            ...prev,
            priorities: prev.priorities.map((p) =>
              p.id === task.id ? { ...p, id: created.id } : p,
            ),
          }));
        }
        await revalidate();
        triggerToast(`"${task.title}" naik ke Slot ${slot}`, 'success');
      } catch (error) {
        if (isSlotConflict(error)) {
          setData(snapshot);
          const fresh = await revalidate();
          if (fresh) {
            const retrySlot = freeSlot(fresh.priorities);
            try {
              const retried = await panduService.createPriority({
                ...payload,
                slot_number: retrySlot,
              });
              if (retried) migratePriorityMetaId(task.id, retried.id);
              await deleteOriginalBestEffort();
              await revalidate();
              triggerToast(
                retrySlot === null
                  ? `"${task.title}" dipindah ke Kotak Tunggu (slot penuh)`
                  : `"${task.title}" naik ke Slot ${retrySlot}`,
                retrySlot === null ? 'warning' : 'success',
              );
              return;
            } catch (retryError) {
              reportError(retryError, 'menaikkan tugas ke fokus');
              return;
            }
          }
        } else {
          setData(snapshot);
        }
        reportError(error, 'menaikkan tugas ke fokus');
      }
    },
    [handleSwapPriority, migratePriorityMetaId, reportError, revalidate, triggerToast],
  );

  const handleAddExpense = useCallback(
    async (amount: number, note: string): Promise<boolean> => {
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        triggerToast('Nominal pengeluaran harus lebih dari Rp 0', 'warning');
        return false;
      }
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const item: ExpenseItem = { id: generateUniqueId(), amount, note, time };
      setExpenses((p) => [item, ...p]);
      setData((p) => ({ ...p, budget: { ...p.budget, spent: p.budget.spent + amount } }));
      try {
        const created = await panduService.createExpense(amount, note);
        if (created && created.id !== item.id) {
          setExpenses((p) => p.map((x) => (x.id === item.id ? { ...x, id: created.id } : x)));
        }
        triggerToast(`Pengeluaran ${formatRupiah(amount)} dicatat`, 'success');
      } catch (error) {
        setExpenses((p) => p.filter((x) => x.id !== item.id));
        setData((p) => ({
          ...p,
          budget: { ...p.budget, spent: Math.max(0, p.budget.spent - amount) },
        }));
        reportError(error, 'mencatat transaksi');
      }
      return true;
    },
    [reportError, triggerToast],
  );

  const handleDeleteExpense = useCallback(
    async (id: number, amount: number): Promise<void> => {
      const snapE = expensesRef.current;
      const snapD = dataRef.current;
      setExpenses((p) => p.filter((x) => x.id !== id));
      setData((p) => ({
        ...p,
        budget: { ...p.budget, spent: Math.max(0, p.budget.spent - amount) },
      }));
      try {
        await panduService.deleteExpense(id);
        triggerToast('Transaksi dihapus & kuota dipulihkan', 'info');
      } catch (error) {
        setExpenses(snapE);
        setData(snapD);
        reportError(error, 'menghapus transaksi');
      }
    },
    [reportError, triggerToast],
  );

  const handleSaveBudgetLimit = useCallback(
    async (limit: number): Promise<boolean> => {
      if (!limit || Number.isNaN(limit) || limit <= 0) {
        triggerToast('Limit harus berupa angka lebih dari Rp 0', 'warning');
        return false;
      }
      const snapshot = dataRef.current;
      setData((p) => ({ ...p, budget: { ...p.budget, limit } }));
      try {
        await panduService.updateBudgetLimit(limit, snapshot.date);
        triggerToast('Batas anggaran harian disimpan', 'success');
      } catch (error) {
        setData(snapshot);
        reportError(error, 'memperbarui batas anggaran');
      }
      return true;
    },
    [reportError, triggerToast],
  );

  const handleHabitToggle = useCallback(
    async (habitId: number, level: 'baseline' | 'normal'): Promise<void> => {
      const snapshot = dataRef.current.habits;
      const current = snapshot.find((h) => h.id === habitId);
      const next = current?.status === level ? 'none' : level;
      setData((p) => ({
        ...p,
        habits: p.habits.map((h) => (h.id === habitId ? { ...h, status: next } : h)),
      }));
      try {
        await panduService.logHabit(habitId, next, dataRef.current.date);
      } catch (error) {
        setData((p) => ({ ...p, habits: snapshot }));
        reportError(error, 'mencatat kebiasaan');
      }
    },
    [reportError],
  );

  const handleSaveHabit = useCallback(
    async (
      editingHabitId: number | null,
      form: { name: string; baseline: string; normal: string; icon: IconName },
    ): Promise<boolean> => {
      const name = form.name.trim();
      if (!name) return false;
      const baseline = form.baseline.trim() !== '' ? form.baseline.trim() : 'Target Minimal';
      const normal = form.normal.trim() !== '' ? form.normal.trim() : 'Target Penuh';

      if (editingHabitId !== null) {
        const snapshot = dataRef.current.habits;
        setHabitMeta(editingHabitId, { icon: form.icon });
        setData((p) => ({
          ...p,
          habits: p.habits.map((h) =>
            h.id === editingHabitId
              ? { ...h, name, baseline_desc: baseline, normal_desc: normal, icon: form.icon }
              : h,
          ),
        }));
        try {
          await panduService.updateHabit(editingHabitId, {
            name,
            baseline_desc: baseline,
            normal_desc: normal,
          });
          triggerToast('Kebiasaan diperbarui', 'success');
        } catch (error) {
          setData((p) => ({ ...p, habits: snapshot }));
          reportError(error, 'memperbarui kebiasaan');
        }
      } else {
        const tempId = generateUniqueId();
        setHabitMeta(tempId, { icon: form.icon });
        const temp: Habit = {
          id: tempId,
          name,
          baseline_desc: baseline,
          normal_desc: normal,
          status: 'none',
          streak: 0,
          icon: form.icon,
        };
        setData((p) => ({ ...p, habits: [...p.habits, temp] }));
        try {
          const created = await panduService.createHabit({
            name,
            baseline_desc: baseline,
            normal_desc: normal,
          });
          if (created && created.id !== temp.id) {
            migrateHabitMetaId(temp.id, created.id);
            setData((p) => ({
              ...p,
              habits: p.habits.map((h) => (h.id === temp.id ? { ...h, id: created.id } : h)),
            }));
          }
          triggerToast('Kebiasaan baru ditambahkan', 'success');
        } catch (error) {
          setData((p) => ({ ...p, habits: p.habits.filter((h) => h.id !== temp.id) }));
          reportError(error, 'menambahkan kebiasaan baru');
        }
      }
      return true;
    },
    [migrateHabitMetaId, reportError, setHabitMeta, triggerToast],
  );

  const handleDeleteHabit = useCallback(
    async (id: number): Promise<void> => {
      const snapshot = dataRef.current.habits;
      setData((p) => ({ ...p, habits: p.habits.filter((h) => h.id !== id) }));
      try {
        await panduService.deleteHabit(id);
        triggerToast('Kebiasaan dihapus', 'info');
      } catch (error) {
        setData((p) => ({ ...p, habits: snapshot }));
        reportError(error, 'menghapus kebiasaan');
      }
    },
    [reportError, triggerToast],
  );

  const handleSaveSchedule = useCallback(
    async (
      editingScheduleId: number | null,
      form: {
        title: string;
        date: string;
        startTime: string;
        endTime: string;
        platform: PlatformType;
      },
    ): Promise<boolean> => {
      const title = form.title.trim();
      if (!title || form.endTime <= form.startTime) return false;
      if (editingScheduleId !== null) {
        const snapshot = schedulesRef.current;
        setSchedules((p) =>
          p.map((it) => (it.id === editingScheduleId ? { ...it, ...form, title } : it)),
        );
        try {
          await panduService.updateSchedule(editingScheduleId, { ...form, title });
          triggerToast('Agenda berhasil diperbarui', 'success');
        } catch (error) {
          setSchedules(snapshot);
          reportError(error, 'memperbarui agenda');
        }
      } else {
        const temp: ScheduleItem = { id: generateUniqueId(), ...form, title };
        setSchedules((p) => [...p, temp]);
        try {
          const created = await panduService.createSchedule({ ...form, title });
          if (created && created.id !== temp.id) {
            setSchedules((p) =>
              p.map((it) => (it.id === temp.id ? { ...it, id: created.id } : it)),
            );
          }
          triggerToast('Agenda berhasil dijadwalkan', 'success');
        } catch (error) {
          setSchedules((p) => p.filter((it) => it.id !== temp.id));
          reportError(error, 'menambahkan agenda baru');
        }
      }
      return true;
    },
    [reportError, triggerToast],
  );

  const handleDeleteSchedule = useCallback(
    async (id: number): Promise<void> => {
      const snapshot = schedulesRef.current;
      setSchedules((p) => p.filter((it) => it.id !== id));
      try {
        await panduService.deleteSchedule(id);
        triggerToast('Agenda dihapus', 'info');
      } catch (error) {
        setSchedules(snapshot);
        reportError(error, 'menghapus agenda');
      }
    },
    [reportError, triggerToast],
  );

  return {
    guestUser,
    savedGuests,
    data,
    expenses,
    schedules,
    loading,
    syncError,
    isSyncing,
    clearSyncError,
    retrySync,
    tempBudgetLimit,
    setTempBudgetLimit,
    handleLoginAsGuest,
    handleSelectSavedGuest,
    handleRemoveSavedGuest,
    handleLogout,
    handleTogglePriority,
    handleDeletePriority,
    handleSaveTask,
    handleDeleteWaiting,
    handlePromoteWaiting,
    handleAddExpense,
    handleDeleteExpense,
    handleSaveBudgetLimit,
    handleHabitToggle,
    handleSaveHabit,
    handleDeleteHabit,
    handleSaveSchedule,
    handleDeleteSchedule,
  };
}
