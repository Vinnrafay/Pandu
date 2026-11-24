import { type FormEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Download,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  History,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Target,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';

import { PanduLogo } from '@/components/icons';
import type { ToastType } from '@/components/dashboard/modals';
import { formatRupiah } from '@/lib/format';
import {
  commitVaultChange,
  createAccountFolder,
  makeUuid,
  parseManualVaultJson,
  renderSummaryTxt,
  revertToBackup,
  type VaultAccountFolder,
  type VaultBackupEntry,
  type VaultSnapshotData,
} from '@/lib/localVault';
import { validateDisplayName } from '@/lib/nameFilter';

const STORAGE_KEY = 'pandu_desktop_prototype_v1';

interface StoredVaultState {
  accounts: VaultAccountFolder[];
  activeAccountId: string;
}

type DesktopView = 'dashboard' | 'settings';
type SettingsTab = 'folders' | 'history' | 'json' | 'txt';

interface DesktopPrototypePageProps {
  onBackDownload: () => void;
  onBackHome: () => void;
  onNotify: (message: string, type?: ToastType) => void;
}

function loadInitialVault(): StoredVaultState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredVaultState>;
        if (Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
          const validActive = parsed.accounts.some((a) => a.id === parsed.activeAccountId)
            ? (parsed.activeAccountId as string)
            : parsed.accounts[0].id;
          return { accounts: parsed.accounts, activeAccountId: validActive };
        }
      }
    } catch {
      // Abaikan data storage rusak dan buat akun starter baru
    }
  }
  const starter = createAccountFolder('Pribadi');
  return { accounts: [starter], activeAccountId: starter.id };
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Baru saja';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function sourceLabel(source: VaultBackupEntry['source']): string {
  if (source === 'manual_edit') return 'Edit Manual JSON';
  if (source === 'revert') return 'Revert Backup';
  return 'Aplikasi';
}

function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Prototype aplikasi Desktop Pandu dengan tampilan utama berupa dashboard bersih
 * untuk mengatur tugas, tab, dan keuangan harian, sementara pengaturan teknis
 * (folder per akun, riwayat backup/revert, edit JSON, dan ringkasan.txt) dipisah
 * di halaman Pengaturan Lokal.
 */
export default function DesktopPrototypePage({
  onBackDownload,
  onBackHome,
  onNotify,
}: DesktopPrototypePageProps): ReactElement {
  const [vault, setVault] = useState<StoredVaultState>(loadInitialVault);
  const [view, setView] = useState<DesktopView>('dashboard');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('folders');
  const [isSyncing, setIsSyncing] = useState(false);

  // Dropdown akun cepat di titlebar + tambah tab inline
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [addingTab, setAddingTab] = useState(false);

  // Form tambah akun
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);

  // Form dashboard
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [newTabTitle, setNewTabTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Utama');
  const [newExpenseNote, setNewExpenseNote] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [budgetDraft, setBudgetDraft] = useState<string | null>(null);

  // Editor JSON manual (di Pengaturan Lokal)
  const [jsonDraft, setJsonDraft] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
    } catch {
      // Abaikan jika kuota localStorage penuh
    }
  }, [vault]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const activeFolder = useMemo<VaultAccountFolder>(() => {
    return vault.accounts.find((a) => a.id === vault.activeAccountId) ?? vault.accounts[0];
  }, [vault]);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const liveJsonText = useMemo(
    () => JSON.stringify(activeFolder.data, null, 2),
    [activeFolder.data],
  );
  const displayedJson = jsonDraft ?? liveJsonText;

  const summaryTxt = useMemo(
    () => renderSummaryTxt(activeFolder.displayName, activeFolder.data),
    [activeFolder.displayName, activeFolder.data],
  );

  const totalSpent = useMemo(
    () => activeFolder.data.expenses.reduce((sum, e) => sum + e.amount, 0),
    [activeFolder.data.expenses],
  );
  const remainingBudget = activeFolder.data.budgetLimit - totalSpent;
  const spentPercent = useMemo(() => {
    if (activeFolder.data.budgetLimit <= 0) return totalSpent > 0 ? 100 : 0;
    return Math.min(100, Math.round((totalSpent / activeFolder.data.budgetLimit) * 100));
  }, [activeFolder.data.budgetLimit, totalSpent]);

  const completedTasks = useMemo(
    () => activeFolder.data.tasks.filter((t) => t.done).length,
    [activeFolder.data.tasks],
  );

  const activeTab = useMemo(() => {
    return (
      activeFolder.data.tabs.find((t) => t.id === activeTabId) ??
      activeFolder.data.tabs[0] ?? { id: 'default', title: 'Utama' }
    );
  }, [activeFolder.data.tabs, activeTabId]);

  const updateActiveFolder = (
    updater: (folder: VaultAccountFolder) => VaultAccountFolder,
  ): void => {
    setVault((prev) => ({
      ...prev,
      accounts: prev.accounts.map((acc) => (acc.id === activeFolder.id ? updater(acc) : acc)),
    }));
  };

  const applyDataChange = (
    nextData: VaultSnapshotData,
    source: 'app' | 'manual_edit' = 'app',
    toastMessage?: string,
  ): void => {
    let changed = false;
    updateActiveFolder((folder) => {
      const updated = commitVaultChange(folder, nextData, source);
      if (updated !== folder) changed = true;
      return updated;
    });
    setJsonDraft(null);
    setJsonError(null);
    setBudgetDraft(null);
    if (changed && toastMessage) {
      onNotify(toastMessage, 'success');
    }
  };

  const handleSelectAccount = (accountId: string): void => {
    setVault((prev) => ({ ...prev, activeAccountId: accountId }));
    setAccountMenuOpen(false);
    setJsonDraft(null);
    setJsonError(null);
    setBudgetDraft(null);
    setActiveTabId(null);
  };

  const handleCreateAccount = (e: FormEvent): void => {
    e.preventDefault();
    const err = validateDisplayName(newAccountName, {
      fieldLabel: 'Nama akun',
      required: true,
      maxLength: 24,
    });
    if (err) {
      setAccountError(err);
      return;
    }
    const created = createAccountFolder(newAccountName.trim());
    setVault((prev) => ({
      accounts: [...prev.accounts, created],
      activeAccountId: created.id,
    }));
    setNewAccountName('');
    setAccountError(null);
    setShowNewAccount(false);
    setAccountMenuOpen(false);
    setJsonDraft(null);
    setJsonError(null);
    setBudgetDraft(null);
    onNotify(`Akun ${created.displayName} siap dipakai secara offline.`, 'success');
  };

  const handleAddTab = (e: FormEvent): void => {
    e.preventDefault();
    const err = validateDisplayName(newTabTitle, {
      fieldLabel: 'Nama tab',
      required: true,
      maxLength: 20,
    });
    if (err) {
      onNotify(err, 'warning');
      return;
    }
    const tab = { id: makeUuid('tab'), title: newTabTitle.trim() };
    applyDataChange(
      { ...activeFolder.data, tabs: [...activeFolder.data.tabs, tab] },
      'app',
      `Tab "${tab.title}" ditambahkan.`,
    );
    setActiveTabId(tab.id);
    setNewTabTitle('');
    setAddingTab(false);
  };

  const handleCloseTab = (tabId: string): void => {
    if (activeFolder.data.tabs.length <= 1) {
      onNotify('Minimal harus ada 1 tab aktif.', 'info');
      return;
    }
    applyDataChange(
      { ...activeFolder.data, tabs: activeFolder.data.tabs.filter((t) => t.id !== tabId) },
      'app',
    );
  };

  const handleAddTask = (e: FormEvent): void => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const nextTask = {
      id: makeUuid('tsk'),
      title: trimmed,
      done: false,
      category: newTaskCategory,
    };
    applyDataChange(
      { ...activeFolder.data, tasks: [...activeFolder.data.tasks, nextTask] },
      'app',
      'Tugas tersimpan otomatis.',
    );
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string): void => {
    applyDataChange(
      {
        ...activeFolder.data,
        tasks: activeFolder.data.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      },
      'app',
    );
  };

  const handleDeleteTask = (taskId: string): void => {
    applyDataChange(
      {
        ...activeFolder.data,
        tasks: activeFolder.data.tasks.filter((t) => t.id !== taskId),
      },
      'app',
      'Tugas dihapus.',
    );
  };

  const handleAddExpense = (e: FormEvent): void => {
    e.preventDefault();
    const note = newExpenseNote.trim();
    const amount = Number(newExpenseAmount.replace(/[^0-9]/g, ''));
    if (!note || !Number.isFinite(amount) || amount <= 0) {
      onNotify('Isi keterangan dan nominal pengeluaran lebih dari 0.', 'warning');
      return;
    }
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const nextExpense = { id: makeUuid('exp'), note, amount, time };
    applyDataChange(
      { ...activeFolder.data, expenses: [nextExpense, ...activeFolder.data.expenses] },
      'app',
      `Pengeluaran ${formatRupiah(amount)} tercatat.`,
    );
    setNewExpenseNote('');
    setNewExpenseAmount('');
  };

  const handleDeleteExpense = (expenseId: string): void => {
    applyDataChange(
      {
        ...activeFolder.data,
        expenses: activeFolder.data.expenses.filter((e) => e.id !== expenseId),
      },
      'app',
      'Transaksi dihapus.',
    );
  };

  const handleSaveBudget = (e: FormEvent): void => {
    e.preventDefault();
    const raw = (budgetDraft ?? String(activeFolder.data.budgetLimit)).replace(/[^0-9]/g, '');
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      onNotify('Nominal batas harian tidak valid.', 'warning');
      return;
    }
    applyDataChange(
      { ...activeFolder.data, budgetLimit: parsed },
      'app',
      `Batas harian diubah ke ${formatRupiah(parsed)}.`,
    );
  };

  const handleSaveManualJson = (): void => {
    const result = parseManualVaultJson(displayedJson);
    if (!result.ok) {
      setJsonError(result.error);
      onNotify('File JSON tidak valid, data utama tetap aman.', 'warning');
      return;
    }
    const updated = commitVaultChange(activeFolder, result.data, 'manual_edit');
    if (updated === activeFolder) {
      setJsonError(null);
      setJsonDraft(null);
      onNotify('Tidak ada perubahan nilai yang terdeteksi di JSON.', 'info');
      return;
    }
    updateActiveFolder(() => updated);
    setJsonDraft(null);
    setJsonError(null);
    setSettingsTab('history');
    onNotify('Editan JSON diterapkan dan dicatat di riwayat.', 'success');
  };

  const handleRevert = (backupId: string): void => {
    const reverted = revertToBackup(activeFolder, backupId);
    if (!reverted) return;
    updateActiveFolder(() => reverted);
    setJsonDraft(null);
    setJsonError(null);
    setBudgetDraft(null);
    onNotify('Data berhasil dikembalikan ke versi backup pilihan.', 'success');
  };

  const handleRecoverLatestBackup = (): void => {
    setJsonDraft(null);
    setJsonError(null);
    onNotify('Editor JSON dipulihkan ke versi valid terakhir.', 'success');
  };

  const handleCloudSync = (): void => {
    if (isSyncing) return;
    setIsSyncing(true);
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      setVault((prev) => ({
        ...prev,
        accounts: prev.accounts.map((acc) =>
          acc.id === activeFolder.id ? { ...acc, pendingSync: false } : acc,
        ),
      }));
      setIsSyncing(false);
      onNotify(`Data ${activeFolder.displayName} tersinkron ke cloud.`, 'success');
    }, 650);
  };

  const handleExportJson = (): void => {
    triggerFileDownload(
      `${activeFolder.folderName}-data-${currentMonthKey}.json`,
      liveJsonText,
      'application/json;charset=utf-8',
    );
    onNotify('File JSON lokal berhasil diunduh.', 'success');
  };

  const handleExportTxt = (): void => {
    triggerFileDownload(
      `${activeFolder.folderName}-ringkasan.txt`,
      summaryTxt,
      'text/plain;charset=utf-8',
    );
    onNotify('File ringkasan.txt berhasil diunduh.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#ECEBE8] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] antialiased flex flex-col p-2 sm:p-4">
      {/* Native-Style Desktop App Window */}
      <div className="flex-1 max-w-6xl w-full mx-auto rounded-2xl bg-white border border-slate-300/90 shadow-xl overflow-hidden flex flex-col">
        {/* Desktop Window Titlebar + Browser Tabs */}
        <header className="bg-[#F7F6F3] border-b border-slate-200 px-3 sm:px-4 pt-2.5 pb-0 flex flex-col gap-2">
          {/* Baris 1: Window Controls, Logo, Account Switcher, Sync & Pengaturan */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 mr-1" aria-hidden="true">
                <button
                  type="button"
                  onClick={onBackDownload}
                  title="Kembali ke Halaman Download"
                  className="size-3 rounded-sm bg-slate-300 hover:bg-rose-400 transition cursor-pointer"
                />
                <span className="size-3 rounded-sm bg-slate-300" />
                <span className="size-3 rounded-sm bg-slate-300" />
              </div>

              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900 hover:text-emerald-700 transition cursor-pointer"
              >
                <PanduLogo className="size-4 text-slate-900" />
                <span>Pandu</span>
              </button>

              {/* Quick Account Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Folder className="size-3.5 text-emerald-600" />
                  <span>{activeFolder.displayName}</span>
                  <ChevronDown className="size-3 text-slate-400" />
                </button>

                {accountMenuOpen && (
                  <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-lg p-1.5 z-40 space-y-1">
                    {vault.accounts.map((acc) => {
                      const selected = acc.id === activeFolder.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectAccount(acc.id)}
                          className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            selected
                              ? 'bg-[#F7F6F3] text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{acc.displayName}</span>
                          {selected && <Check className="size-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          setView('settings');
                          setSettingsTab('folders');
                          setShowNewAccount(true);
                        }}
                        className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FolderPlus className="size-3.5" />
                        <span>Kelola atau Tambah Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sync Status Button */}
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={isSyncing}
                title="Klik untuk sinkronkan ke cloud"
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  isSyncing
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : activeFolder.pendingSync
                      ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {isSyncing ? (
                  <RefreshCw className="size-3 animate-spin" />
                ) : activeFolder.pendingSync ? (
                  <CloudOff className="size-3" />
                ) : (
                  <Cloud className="size-3" />
                )}
                <span className="hidden sm:inline">
                  {isSyncing
                    ? 'Menyinkronkan...'
                    : activeFolder.pendingSync
                      ? 'Tersimpan Lokal'
                      : 'Tersinkron'}
                </span>
              </button>

              {/* Tombol Pengaturan Lokal (Terpisah dari Dashboard) */}
              <button
                type="button"
                onClick={() => setView((v) => (v === 'settings' ? 'dashboard' : 'settings'))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  view === 'settings'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                <Settings className="size-3.5" />
                <span>{view === 'settings' ? 'Tutup Pengaturan' : 'Pengaturan Lokal'}</span>
              </button>

              <button
                type="button"
                onClick={onBackDownload}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 inline-flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span className="hidden md:inline">Download</span>
              </button>
            </div>
          </div>

          {/* Baris 2: Browser-Style Workspace Tabs (hanya tampil saat di Dashboard) */}
          {view === 'dashboard' && (
            <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
              {activeFolder.data.tabs.map((tab) => {
                const isActive = tab.id === activeTab.id;
                return (
                  <div
                    key={tab.id}
                    className={`inline-flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-t-lg text-xs font-semibold border-t border-x transition shrink-0 ${
                      isActive
                        ? 'bg-white text-slate-900 border-slate-200 -mb-px'
                        : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTabId(tab.id)}
                      className="cursor-pointer"
                    >
                      {tab.title}
                    </button>
                    {activeFolder.data.tabs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleCloseTab(tab.id)}
                        aria-label={`Tutup tab ${tab.title}`}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {addingTab ? (
                <form onSubmit={handleAddTab} className="inline-flex items-center gap-1 px-1 pb-1">
                  <input
                    type="text"
                    value={newTabTitle}
                    onChange={(e) => setNewTabTitle(e.target.value)}
                    placeholder="Nama tab..."
                    autoFocus
                    className="w-32 px-2 py-1 rounded-md border border-slate-300 bg-white text-xs focus:outline-none focus:border-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Tambah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTab(false);
                      setNewTabTitle('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingTab(true)}
                  title="Tambah tab baru"
                  className="px-2 py-1.5 mb-0.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 inline-flex items-center gap-1 text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Tab Baru</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* BODY: DASHBOARD UTAMA ATAU PENGATURAN LOKAL TERPISAH */}
        {view === 'dashboard' ? (
          <main className="flex-1 bg-white p-5 sm:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header Ringkas Dashboard */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200/80">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {activeTab.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Ruang kerja {activeFolder.displayName}, semua catatan tersimpan otomatis di
                    perangkat.
                  </p>
                </div>

                {/* 3 Ringkasan Cepat */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Tugas Selesai</span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {completedTasks} / {activeFolder.data.tasks.length}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Terpakai</span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(totalSpent)}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#F7F6F3] border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Sisa Kuota</span>
                    <span
                      className={`text-sm font-extrabold tabular-nums ${
                        remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatRupiah(remainingBudget)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Utama 2 Kolom: Prioritas Tugas & Keuangan Harian */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kiri: Prioritas Tugas */}
                <section className="lg:col-span-7 p-5 rounded-2xl bg-[#F7F6F3] border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-slate-900 inline-flex items-center gap-2">
                      <Target className="size-4 text-emerald-600" />
                      Prioritas Tugas
                    </h2>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      {completedTasks} dari {activeFolder.data.tasks.length} selesai
                    </span>
                  </div>

                  <form onSubmit={handleAddTask} className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Apa yang mau kamu selesaikan hari ini?"
                      className="flex-1 min-w-[180px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                    />
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      aria-label="Kategori tugas"
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-900"
                    >
                      <option value="Utama">Utama</option>
                      <option value="Keuangan">Keuangan</option>
                      <option value="Pribadi">Pribadi</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Tambah</span>
                    </button>
                  </form>

                  <div className="space-y-2">
                    {activeFolder.data.tasks.length === 0 ? (
                      <div className="p-8 rounded-xl bg-white border border-slate-200/80 text-center space-y-1">
                        <p className="text-sm font-bold text-slate-700">Belum ada tugas</p>
                        <p className="text-xs text-slate-500">
                          Tambahkan prioritas pertamamu di kolom atas.
                        </p>
                      </div>
                    ) : (
                      activeFolder.data.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                            task.done
                              ? 'bg-white/60 border-slate-200/70'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleTask(task.id)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <span
                              className={`size-5 rounded-md flex items-center justify-center border shrink-0 transition ${
                                task.done
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-slate-300 text-transparent'
                              }`}
                            >
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-semibold truncate ${
                                task.done ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </span>
                          </button>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                            {task.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            aria-label={`Hapus tugas ${task.title}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Kanan: Keuangan Harian */}
                <section className="lg:col-span-5 p-5 rounded-2xl bg-[#F7F6F3] border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-slate-900 inline-flex items-center gap-2">
                      <Wallet className="size-4 text-amber-600" />
                      Keuangan Harian
                    </h2>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      {spentPercent}% terpakai
                    </span>
                  </div>

                  {/* Progress & Batas Harian */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Sisa kuota hari ini</span>
                      <span
                        className={`text-xl font-extrabold tabular-nums ${
                          remainingBudget < 0 ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {formatRupiah(remainingBudget)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-sm bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          remainingBudget < 0 ? 'bg-rose-500' : 'bg-slate-900'
                        }`}
                        style={{ width: `${spentPercent}%` }}
                      />
                    </div>
                    <form
                      onSubmit={handleSaveBudget}
                      className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2"
                    >
                      <label htmlFor="desktop-budget-limit" className="text-xs text-slate-500">
                        Batas harian
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="desktop-budget-limit"
                          type="number"
                          min={0}
                          step={5000}
                          value={budgetDraft ?? String(activeFolder.data.budgetLimit)}
                          onChange={(e) => setBudgetDraft(e.target.value)}
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold tabular-nums focus:outline-none focus:border-slate-900"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Ubah
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Catat Pengeluaran */}
                  <form onSubmit={handleAddExpense} className="space-y-2">
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={newExpenseNote}
                        onChange={(e) => setNewExpenseNote(e.target.value)}
                        placeholder="Catatan, misal Makan siang"
                        className="col-span-7 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-slate-900"
                      />
                      <input
                        type="number"
                        min={0}
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                        placeholder="Nominal"
                        className="col-span-5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs tabular-nums focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Catat Pengeluaran
                    </button>
                  </form>

                  {/* Daftar Transaksi */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {activeFolder.data.expenses.length === 0 ? (
                      <div className="p-5 rounded-xl bg-white border border-slate-200/80 text-center text-xs text-slate-500">
                        Belum ada pengeluaran hari ini.
                      </div>
                    ) : (
                      activeFolder.data.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">
                              {exp.note}
                            </span>
                            <span className="text-[10px] text-slate-400">{exp.time}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-900 tabular-nums">
                              {formatRupiah(exp.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              aria-label={`Hapus pengeluaran ${exp.note}`}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          </main>
        ) : (
          /* HALAMAN TERPISAH: PENGATURAN & PENYIMPANAN LOKAL */
          <main className="flex-1 bg-[#FAF9F7] p-5 sm:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header Pengaturan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setView('dashboard')}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Kembali ke Dashboard</span>
                    </button>
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Pengaturan dan Penyimpanan Lokal
                    </h1>
                  </div>
                  <p className="text-xs font-mono text-slate-500">
                    Documents/Pandu/accounts/{activeFolder.folderName}/
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="size-3.5 text-emerald-600" />
                    <span>Unduh .txt</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileCode2 className="size-3.5 text-slate-700" />
                    <span>Unduh .json</span>
                  </button>
                </div>
              </div>

              {/* Navigasi Sub-Tab Pengaturan */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'folders' as const, label: 'Folder Akun', icon: HardDrive },
                  {
                    id: 'history' as const,
                    label: `Riwayat dan Revert (${activeFolder.backups.length})`,
                    icon: History,
                  },
                  { id: 'json' as const, label: 'Edit JSON Manual', icon: FileCode2 },
                  { id: 'txt' as const, label: 'Pratinjau ringkasan.txt', icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = settingsTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSettingsTab(item.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 1: FOLDER AKUN */}
              {settingsTab === 'folders' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Daftar Folder Akun
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Setiap akun terpisah di foldernya sendiri agar data rapi dan tidak
                          tercampur.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewAccount((v) => !v);
                          setAccountError(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <FolderPlus className="size-3.5" />
                        <span>Akun Baru</span>
                      </button>
                    </div>

                    {showNewAccount && (
                      <form
                        onSubmit={handleCreateAccount}
                        className="p-3.5 rounded-xl bg-[#F7F6F3] border border-slate-200 space-y-2.5"
                      >
                        <input
                          type="text"
                          value={newAccountName}
                          onChange={(e) => {
                            setNewAccountName(e.target.value);
                            if (accountError) setAccountError(null);
                          }}
                          placeholder="Nama akun baru, misal Kerja atau Bisnis"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-slate-900"
                        />
                        {accountError && (
                          <p className="text-xs text-rose-600 font-medium">{accountError}</p>
                        )}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewAccount(false);
                              setAccountError(null);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                          >
                            Buat Folder
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-2">
                      {vault.accounts.map((acc) => {
                        const selected = acc.id === activeFolder.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => handleSelectAccount(acc.id)}
                            className={`w-full p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                              selected
                                ? 'bg-[#F7F6F3] border-slate-900'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {selected ? (
                                <FolderOpen className="size-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Folder className="size-4 text-slate-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 block truncate">
                                  {acc.displayName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 block truncate">
                                  Documents/Pandu/accounts/{acc.folderName}/
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                              {selected ? 'Aktif' : `${acc.backups.length} backup`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <h2 className="text-sm font-extrabold text-slate-900">
                      Struktur File di Folder Aktif
                    </h2>
                    <div className="space-y-1.5 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => setSettingsTab('json')}
                        className="w-full p-2.5 rounded-xl bg-[#F7F6F3] hover:bg-slate-200/70 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2 text-slate-800">
                          <FileCode2 className="size-4 text-slate-600" />
                          data-{currentMonthKey}.json
                        </span>
                        <span className="text-[11px] font-sans font-semibold text-emerald-700">
                          Buka Editor
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsTab('txt')}
                        className="w-full p-2.5 rounded-xl bg-[#F7F6F3] hover:bg-slate-200/70 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2 text-slate-800">
                          <FileText className="size-4 text-amber-600" />
                          ringkasan.txt
                        </span>
                        <span className="text-[11px] font-sans font-semibold text-emerald-700">
                          Baca
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsTab('history')}
                        className="w-full p-2.5 rounded-xl bg-[#F7F6F3] hover:bg-slate-200/70 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2 text-slate-800">
                          <History className="size-4 text-emerald-600" />
                          backups/ ({activeFolder.backups.length}/15)
                        </span>
                        <span className="text-[11px] font-sans font-semibold text-emerald-700">
                          Lihat Riwayat
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pt-1">
                      File utama selalu ditimpa rapi agar tidak mengganda. Riwayat dibatasi maksimal
                      15 versi terakhir sehingga tetap ringan di laptop.
                    </p>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: RIWAYAT & REVERT */}
              {settingsTab === 'history' && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      Riwayat Perubahan dan Revert
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Menampilkan catatan perubahan dari aplikasi maupun edit manual JSON, lengkap
                      dengan tombol Revert 1 klik.
                    </p>
                  </div>

                  {activeFolder.backups.length === 0 ? (
                    <div className="p-8 rounded-xl bg-[#F7F6F3] border border-dashed border-slate-300 text-center space-y-1">
                      <p className="text-sm font-bold text-slate-700">Belum ada riwayat backup</p>
                      <p className="text-xs text-slate-500">
                        Lakukan perubahan di Dashboard atau di tab Edit JSON Manual untuk melihat
                        daftar diff di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeFolder.backups.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 rounded-xl bg-[#F7F6F3] border border-slate-200/90 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                {sourceLabel(entry.source)}
                              </span>
                              <span className="text-[11px] text-slate-500 tabular-nums">
                                {formatClock(entry.createdAt)}
                              </span>
                            </div>
                            <ol className="space-y-1 text-xs text-slate-700 list-decimal list-inside">
                              {entry.changes.map((chg, idx) => (
                                <li key={`${entry.id}-${idx}`}>{chg}</li>
                              ))}
                            </ol>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevert(entry.id)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 w-fit"
                          >
                            <RotateCcw className="size-3.5" />
                            <span>Revert ke Sebelum Ini</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 3: EDIT JSON MANUAL */}
              {settingsTab === 'json' && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Editor Manual data-{currentMonthKey}.json
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Simulasi mengubah file save langsung di Notepad. Jika format rusak, data
                        utama tetap terlindungi.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setJsonDraft(null);
                          setJsonError(null);
                        }}
                        disabled={jsonDraft === null}
                        className="px-3 py-2 rounded-lg bg-[#F7F6F3] hover:bg-slate-200/70 disabled:opacity-40 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveManualJson}
                        className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="size-3.5" />
                        <span>Simpan Editan JSON</span>
                      </button>
                    </div>
                  </div>

                  {jsonError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2 text-xs text-rose-800 font-semibold">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                        <span>{jsonError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRecoverLatestBackup}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 w-fit"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Pulihkan Versi Valid Terakhir</span>
                      </button>
                    </div>
                  )}

                  <textarea
                    value={displayedJson}
                    onChange={(e) => {
                      setJsonDraft(e.target.value);
                      if (jsonError) setJsonError(null);
                    }}
                    spellCheck={false}
                    aria-label="Editor file JSON lokal"
                    className="w-full min-h-[380px] p-4 rounded-xl bg-slate-900 text-emerald-200 font-mono text-xs leading-relaxed border border-slate-800 focus:outline-none focus:border-emerald-500 resize-y"
                  />
                </div>
              )}

              {/* SUB-TAB 4: PRATINJAU ringkasan.txt */}
              {settingsTab === 'txt' && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Pratinjau ringkasan.txt
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Selalu diperbarui otomatis agar mudah dibaca langsung dari Notepad atau File
                        Explorer.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportTxt}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer w-fit"
                    >
                      <Download className="size-3.5" />
                      <span>Unduh ringkasan.txt</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#F7F6F3] border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                    {summaryTxt}
                  </pre>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
