import { describe, expect, it } from 'vitest';

import {
  commitVaultChange,
  computeVaultDiff,
  createAccountFolder,
  parseManualVaultJson,
  renderSummaryTxt,
  revertToBackup,
} from './localVault';

describe('localVault diff, backup, and revert', () => {
  it('menghasilkan deskripsi perubahan yang jelas saat tugas dan limit diubah', () => {
    const folder = createAccountFolder('Alex');
    const next = {
      ...folder.data,
      budgetLimit: 200000,
      tasks: [
        ...folder.data.tasks,
        { id: 'tsk_new', title: 'Rapikan laporan', done: false, category: 'Pekerjaan' },
      ],
    };

    const diff = computeVaultDiff(folder.data, next);
    expect(diff).toContain('Mengubah batas harian dari Rp 150.000 menjadi Rp 200.000');
    expect(diff).toContain('Menambah tugas: Rapikan laporan');
  });

  it('menyimpan rolling backup dan bisa revert kembali ke versi sebelumnya', () => {
    const initial = createAccountFolder('Alex');
    const updated = commitVaultChange(initial, { ...initial.data, budgetLimit: 250000 }, 'app');

    expect(updated.data.budgetLimit).toBe(250000);
    expect(updated.backups).toHaveLength(1);
    expect(updated.pendingSync).toBe(true);

    const reverted = revertToBackup(updated, updated.backups[0].id);
    expect(reverted).not.toBeNull();
    expect(reverted?.data.budgetLimit).toBe(150000);
    expect(reverted?.backups).toHaveLength(2);
    expect(reverted?.backups[0].source).toBe('revert');
  });

  it('menolak JSON rusak saat edit manual dan menerima JSON valid', () => {
    expect(parseManualVaultJson('{ rusak ').ok).toBe(false);

    const folder = createAccountFolder('Alex');
    const valid = parseManualVaultJson(JSON.stringify(folder.data));
    expect(valid.ok).toBe(true);
  });

  it('merender ringkasan.txt yang terbaca manusia', () => {
    const folder = createAccountFolder('Alex');
    const txt = renderSummaryTxt(folder.displayName, folder.data);
    expect(txt).toContain('Akun: Alex');
    expect(txt).toContain('Kopi pagi');
  });
});
