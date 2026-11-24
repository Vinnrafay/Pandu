import { describe, expect, it } from 'vitest';

import { containsInappropriateWord, validateDisplayName } from './nameFilter';

describe('containsInappropriateWord', () => {
  it('menerima nama normal dan sopan', () => {
    expect(containsInappropriateWord('Alex')).toBe(false);
    expect(containsInappropriateWord('Kerjaan Kantor')).toBe(false);
    expect(containsInappropriateWord('Uang Bulanan')).toBe(false);
    expect(containsInappropriateWord('Analisis Data')).toBe(false);
  });

  it('menolak kata kasar Bahasa Indonesia maupun Inggris', () => {
    expect(containsInappropriateWord('anjing')).toBe(true);
    expect(containsInappropriateWord('Tab Bangsat')).toBe(true);
    expect(containsInappropriateWord('fuck this')).toBe(true);
  });

  it('mendeteksi variasi leetspeak, huruf berulang, dan spasi antar huruf', () => {
    expect(containsInappropriateWord('b4ngs@t')).toBe(true);
    expect(containsInappropriateWord('anjiiiing')).toBe(true);
    expect(containsInappropriateWord('a n j i n g')).toBe(true);
    expect(containsInappropriateWord('f u c k')).toBe(true);
  });
});

describe('validateDisplayName', () => {
  it('mengembalikan pesan error yang jelas saat kosong (jika required) atau kasar', () => {
    expect(validateDisplayName('', { fieldLabel: 'Nama tab', required: true })).toBe(
      'Nama tab wajib diisi.',
    );
    expect(validateDisplayName('goblok', { fieldLabel: 'Nama tamu' })).toContain('tidak pantas');
    expect(
      validateDisplayName('Proyek Skripsi', { fieldLabel: 'Nama tab', required: true }),
    ).toBeNull();
  });
});
