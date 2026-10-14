import { describe, expect, it } from 'vitest';

import { formatHeaderDate, formatRupiah, formatScheduleDate, todayISODate } from './format';

describe('formatRupiah', () => {
  it('memformat angka ke Rupiah id-ID', () => {
    expect(formatRupiah(150000)).toBe('Rp 150.000');
  });

  it('menangani nol', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });
});

describe('formatScheduleDate', () => {
  it('mengurai tanggal ISO valid', () => {
    const { month, day } = formatScheduleDate('2026-10-14');
    expect(day).toBe('14');
    expect(month.length).toBeGreaterThan(0);
  });

  it('fallback aman untuk tanggal tidak valid', () => {
    expect(formatScheduleDate('bukan-tanggal')).toEqual({ month: 'Okt', day: '12' });
  });
});

describe('formatHeaderDate', () => {
  it('mengembalikan string lokal untuk tanggal valid', () => {
    expect(formatHeaderDate('2026-10-14')).toContain('2026');
  });

  it('mengembalikan input apa adanya bila tidak valid', () => {
    expect(formatHeaderDate('???')).toBe('???');
  });
});

describe('todayISODate', () => {
  it('berformat YYYY-MM-DD', () => {
    expect(todayISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
