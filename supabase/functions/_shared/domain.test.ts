import { describe, expect, it } from 'vitest';

import {
  asIntId,
  basePath,
  isValidISODate,
  isValidTime,
  shiftDay,
  streakFrom,
  validateHabitInput,
  validatePriorityInput,
  validateScheduleInput,
} from './domain';

describe('basePath', () => {
  it('menghapus prefix deploy, frontend v1, dan gateway api', () => {
    expect(basePath('/functions/v1/api/api/v1/dashboard')).toBe('/dashboard');
    expect(basePath('/api/priorities/1/toggle')).toBe('/priorities/1/toggle');
    expect(basePath('/auth/guest')).toBe('/auth/guest');
    expect(basePath('/api')).toBe('/');
  });
});

describe('isValidISODate & isValidTime', () => {
  it('menerima tanggal dan jam valid serta menolak nilai mustahil', () => {
    expect(isValidISODate('2026-10-14')).toBe(true);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);

    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('23:59:59')).toBe(true);
    expect(isValidTime('25:00')).toBe(false);
    expect(isValidTime('14:60')).toBe(false);
  });
});

describe('shiftDay & streakFrom', () => {
  it('menghitung streak aktif hari ini, kemarin bila hari ini belum log, dan putus bila bolong', () => {
    expect(shiftDay('2026-11-13', -1)).toBe('2026-11-12');

    const activeToday = new Set(['2026-11-13', '2026-11-12', '2026-11-11']);
    expect(streakFrom(activeToday, '2026-11-13')).toBe(3);

    const pendingToday = new Set(['2026-11-12', '2026-11-11']);
    expect(streakFrom(pendingToday, '2026-11-13')).toBe(2);

    const broken = new Set(['2026-11-10']);
    expect(streakFrom(broken, '2026-11-13')).toBe(0);
  });
});

describe('asIntId', () => {
  it('hanya menerima integer positif', () => {
    expect(asIntId('42')).toBe(42);
    expect(asIntId('0')).toBeNull();
    expect(asIntId('-5')).toBeNull();
    expect(asIntId('abc')).toBeNull();
  });
});

describe('payload validators', () => {
  it('memvalidasi priority payload', () => {
    expect(
      validatePriorityInput({ title: ' Fokus ', slot_number: 1, target_time: '14:00' }),
    ).toEqual({
      ok: true,
      data: {
        title: 'Fokus',
        slot_number: 1,
        target_time: '14:00',
        duration_minutes: undefined,
      },
    });

    expect(validatePriorityInput({ title: 'Tugas', slot_number: 4 }).ok).toBe(false);
    expect(validatePriorityInput({ title: 'Tugas', target_time: '25:99' }).ok).toBe(false);
    expect(validatePriorityInput({ title: 'Tugas', duration_minutes: 10.5 }).ok).toBe(false);
  });

  it('memvalidasi habit payload dan memberi default deskripsi', () => {
    expect(validateHabitInput({ name: 'Olahraga' })).toEqual({
      ok: true,
      data: {
        name: 'Olahraga',
        baseline_desc: 'Target Minimal',
        normal_desc: 'Target Penuh',
      },
    });
    expect(validateHabitInput({ name: '   ' }).ok).toBe(false);
  });

  it('memvalidasi schedule payload termasuk tanggal kalender dan urutan jam', () => {
    expect(
      validateScheduleInput({
        title: 'Standup',
        date: '2026-10-14',
        start_time: '09:00',
        end_time: '09:30',
        platform: 'meet',
      }),
    ).toEqual({
      ok: true,
      data: {
        title: 'Standup',
        date: '2026-10-14',
        start_time: '09:00',
        end_time: '09:30',
        platform: 'meet',
      },
    });

    expect(
      validateScheduleInput({
        title: 'Bad Date',
        date: '2026-02-30',
        start_time: '09:00',
        end_time: '09:30',
        platform: 'meet',
      }).ok,
    ).toBe(false);

    expect(
      validateScheduleInput({
        title: 'Bad Range',
        date: '2026-10-14',
        start_time: '10:00',
        end_time: '09:30',
        platform: 'meet',
      }).ok,
    ).toBe(false);
  });
});
