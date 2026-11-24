import { describe, expect, it } from 'vitest';

import { ApiError } from '../api/client';
import type { Priority } from '../types/pandu';
import { computeBudgetSummary, freeSlot, generateUniqueId, isSlotConflict } from './priority';

const makePriority = (id: number, slot: number | null): Priority => ({
  id,
  title: `Task ${id}`,
  slot_number: slot,
  status: 'pending',
});

describe('freeSlot', () => {
  it('mengembalikan slot 1 saat kosong', () => {
    expect(freeSlot([])).toBe(1);
  });

  it('mengisi celah slot yang kosong meskipun panjang array < 3', () => {
    expect(freeSlot([makePriority(1, 1), makePriority(2, 3)])).toBe(2);
  });

  it('mengembalikan null saat semua slot 1-3 terisi', () => {
    expect(freeSlot([makePriority(1, 1), makePriority(2, 2), makePriority(3, 3)])).toBeNull();
  });
});

describe('isSlotConflict', () => {
  it('mengembalikan true untuk ApiError dengan status 409', () => {
    expect(isSlotConflict(new ApiError({ status: 409, code: 'CONFLICT', message: 'dup' }))).toBe(
      true,
    );
  });

  it('mengembalikan false untuk status lain atau Error biasa', () => {
    expect(isSlotConflict(new ApiError({ status: 500, code: 'ERR', message: 'err' }))).toBe(false);
    expect(isSlotConflict(new Error('nope'))).toBe(false);
  });
});

describe('generateUniqueId', () => {
  it('selalu menghasilkan ID yang meningkat secara monoton', () => {
    const a = generateUniqueId();
    const b = generateUniqueId();
    const c = generateUniqueId();
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
});

describe('computeBudgetSummary', () => {
  it('menghitung persentase dan sisa anggaran normal', () => {
    expect(computeBudgetSummary(100000, 25000)).toEqual({
      limit: 100000,
      spent: 25000,
      isOverbudget: false,
      netRemaining: 75000,
      percentage: 25,
    });
  });

  it('menandai overbudget dan membatasi persentase di 100', () => {
    expect(computeBudgetSummary(100000, 150000)).toEqual({
      limit: 100000,
      spent: 150000,
      isOverbudget: true,
      netRemaining: -50000,
      percentage: 100,
    });
  });

  it('aman saat limit <= 0', () => {
    expect(computeBudgetSummary(0, 10000).percentage).toBe(0);
  });
});
