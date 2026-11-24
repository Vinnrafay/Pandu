import { formatRupiah } from './format';

export interface VaultTask {
  id: string;
  title: string;
  done: boolean;
  category: string;
}

export interface VaultExpense {
  id: string;
  note: string;
  amount: number;
  time: string;
}

export interface VaultTab {
  id: string;
  title: string;
}

export interface VaultSnapshotData {
  budgetLimit: number;
  tasks: VaultTask[];
  expenses: VaultExpense[];
  tabs: VaultTab[];
}

export interface VaultBackupEntry {
  id: string;
  createdAt: string;
  source: 'app' | 'manual_edit' | 'revert';
  changes: string[];
  /** Snapshot kondisi SEBELUM perubahan diterapkan agar bisa di-revert 1 klik. */
  previousData: VaultSnapshotData;
}

export interface VaultAccountFolder {
  id: string;
  folderName: string;
  displayName: string;
  updatedAt: string;
  pendingSync: boolean;
  data: VaultSnapshotData;
  backups: VaultBackupEntry[];
}

const MAX_BACKUPS = 15;

export function makeUuid(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createStarterVaultData(): VaultSnapshotData {
  return {
    budgetLimit: 150000,
    tasks: [
      { id: 'tsk_101', title: 'Selesaikan fokus utama pagi ini', done: false, category: 'Utama' },
      { id: 'tsk_102', title: 'Cek pembagian pos uang harian', done: true, category: 'Keuangan' },
    ],
    expenses: [{ id: 'exp_101', note: 'Kopi pagi', amount: 18000, time: '08:30' }],
    tabs: [
      { id: 'tab_tasking', title: 'Tasking' },
      { id: 'tab_finance', title: 'Pembagian Uang' },
    ],
  };
}

export function createAccountFolder(displayName: string): VaultAccountFolder {
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 16);
  const id = makeUuid('acc');
  const folderName = `${slug || 'tamu'}_${id.slice(-4)}`;
  return {
    id,
    folderName,
    displayName: displayName.trim() || 'Tamu',
    updatedAt: new Date().toISOString(),
    pendingSync: false,
    data: createStarterVaultData(),
    backups: [],
  };
}

/**
 * Membandingkan dua snapshot data Pandu dan menghasilkan daftar perubahan
 * yang mudah dibaca manusia dalam bahasa Indonesia.
 */
export function computeVaultDiff(prev: VaultSnapshotData, next: VaultSnapshotData): string[] {
  const changes: string[] = [];

  if (prev.budgetLimit !== next.budgetLimit) {
    changes.push(
      `Mengubah batas harian dari ${formatRupiah(prev.budgetLimit)} menjadi ${formatRupiah(next.budgetLimit)}`,
    );
  }

  const prevTasks = new Map(prev.tasks.map((t) => [t.id, t]));
  const nextTasks = new Map(next.tasks.map((t) => [t.id, t]));

  for (const task of next.tasks) {
    const old = prevTasks.get(task.id);
    if (!old) {
      changes.push(`Menambah tugas: ${task.title}`);
    } else {
      if (old.title !== task.title) {
        changes.push(`Mengubah judul tugas "${old.title}" menjadi "${task.title}"`);
      }
      if (old.done !== task.done) {
        changes.push(
          task.done ? `Menyelesaikan tugas: ${task.title}` : `Membuka kembali tugas: ${task.title}`,
        );
      }
    }
  }
  for (const task of prev.tasks) {
    if (!nextTasks.has(task.id)) {
      changes.push(`Menghapus tugas: ${task.title}`);
    }
  }

  const prevExpenses = new Map(prev.expenses.map((e) => [e.id, e]));
  const nextExpenses = new Map(next.expenses.map((e) => [e.id, e]));

  for (const exp of next.expenses) {
    const old = prevExpenses.get(exp.id);
    if (!old) {
      changes.push(`Mencatat pengeluaran: ${exp.note} (${formatRupiah(exp.amount)})`);
    } else if (old.amount !== exp.amount || old.note !== exp.note) {
      changes.push(
        `Mengubah transaksi "${old.note}" menjadi "${exp.note}" (${formatRupiah(exp.amount)})`,
      );
    }
  }
  for (const exp of prev.expenses) {
    if (!nextExpenses.has(exp.id)) {
      changes.push(`Menghapus pengeluaran: ${exp.note} (${formatRupiah(exp.amount)})`);
    }
  }

  const prevTabs = new Map(prev.tabs.map((t) => [t.id, t]));
  const nextTabs = new Map(next.tabs.map((t) => [t.id, t]));
  for (const tab of next.tabs) {
    if (!prevTabs.has(tab.id)) {
      changes.push(`Menambah tab baru: ${tab.title}`);
    }
  }
  for (const tab of prev.tabs) {
    if (!nextTabs.has(tab.id)) {
      changes.push(`Menutup tab: ${tab.title}`);
    }
  }

  return changes;
}

/**
 * Menerapkan perubahan baru ke folder akun dengan rolling backup (maks 15 versi)
 * dan pencatatan diff otomatis.
 */
export function commitVaultChange(
  folder: VaultAccountFolder,
  nextData: VaultSnapshotData,
  source: 'app' | 'manual_edit' | 'revert' = 'app',
): VaultAccountFolder {
  const changes = computeVaultDiff(folder.data, nextData);
  if (changes.length === 0) return folder;

  const entry: VaultBackupEntry = {
    id: makeUuid('bak'),
    createdAt: new Date().toISOString(),
    source,
    changes,
    previousData: structuredClone(folder.data),
  };

  return {
    ...folder,
    updatedAt: entry.createdAt,
    pendingSync: true,
    data: structuredClone(nextData),
    backups: [entry, ...folder.backups].slice(0, MAX_BACKUPS),
  };
}

/**
 * Mengembalikan data akun ke snapshot sebelum backup tertentu, sekaligus
 * menyimpan kondisi saat ini ke riwayat backup agar revert pun tetap aman.
 */
export function revertToBackup(
  folder: VaultAccountFolder,
  backupId: string,
): VaultAccountFolder | null {
  const target = folder.backups.find((b) => b.id === backupId);
  if (!target) return null;
  return commitVaultChange(folder, target.previousData, 'revert');
}

/** Memvalidasi struktur dasar JSON saat pengguna mengedit file save secara manual. */
export function parseManualVaultJson(
  raw: string,
): { ok: true; data: VaultSnapshotData } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as Partial<VaultSnapshotData>;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Format JSON harus berupa objek utama.' };
    }
    if (
      typeof parsed.budgetLimit !== 'number' ||
      !Number.isFinite(parsed.budgetLimit) ||
      parsed.budgetLimit < 0
    ) {
      return { ok: false, error: 'Field budgetLimit harus berupa angka 0 atau lebih.' };
    }
    if (
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.expenses) ||
      !Array.isArray(parsed.tabs)
    ) {
      return { ok: false, error: 'Field tasks, expenses, dan tabs wajib berupa array.' };
    }
    return {
      ok: true,
      data: {
        budgetLimit: parsed.budgetLimit,
        tasks: parsed.tasks,
        expenses: parsed.expenses,
        tabs: parsed.tabs,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sintaks JSON tidak valid';
    return { ok: false, error: `File JSON rusak: ${msg}` };
  }
}

/** Menghasilkan teks ringkasan lokal yang bersih dan mudah dibaca di Notepad (`ringkasan.txt`). */
export function renderSummaryTxt(accountName: string, data: VaultSnapshotData): string {
  const spent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = data.budgetLimit - spent;
  const lines: string[] = [
    `PANDU RINGKASAN LOKAL`,
    `Akun: ${accountName}`,
    `Tab Aktif: ${data.tabs.map((t) => t.title).join(', ')}`,
    ``,
    `PRIORITAS TUGAS`,
    ...(data.tasks.length === 0
      ? ['Belum ada tugas tercatat.']
      : data.tasks.map(
          (t, i) => `${i + 1}. [${t.done ? 'SELESAI' : 'PENDING'}] ${t.title} (${t.category})`,
        )),
    ``,
    `KEUANGAN HARIAN`,
    `Limit: ${formatRupiah(data.budgetLimit)}`,
    `Terpakai: ${formatRupiah(spent)}`,
    `Sisa: ${formatRupiah(remaining)}`,
    ...(data.expenses.length === 0
      ? ['Belum ada transaksi.']
      : data.expenses.map((e, i) => `${i + 1}. ${e.note}, ${formatRupiah(e.amount)} (${e.time})`)),
  ];
  return lines.join('\n');
}
