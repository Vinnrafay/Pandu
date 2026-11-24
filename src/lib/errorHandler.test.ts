import { describe, expect, it } from 'vitest';

import { ApiError } from '../api/client';
import { describeApiError } from './errorHandler';

describe('describeApiError', () => {
  it('memetakan NETWORK_ERROR (status 0) ke pesan koneksi terputus', () => {
    const err = new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'offline' });
    const result = describeApiError(err, 'menyimpan tugas');
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.title).toBe('Koneksi Terputus');
    expect(result.message).toContain('menyimpan tugas');
    expect(result.recoverable).toBe(true);
  });

  it('memetakan 401 UNAUTHORIZED sebagai sesi berakhir (non-recoverable)', () => {
    const err = new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'expired' });
    const result = describeApiError(err, 'memuat dashboard');
    expect(result.code).toBe('UNAUTHORIZED');
    expect(result.recoverable).toBe(false);
  });

  it('memetakan 409 CONFLICT dengan pesan dari server bila tersedia', () => {
    const err = new ApiError({
      status: 409,
      code: 'CONFLICT',
      message: 'Jadwal tumpang tindih dengan agenda lain',
    });
    const result = describeApiError(err, 'menyimpan agenda');
    expect(result.code).toBe('CONFLICT');
    expect(result.message).toBe('Jadwal tumpang tindih dengan agenda lain');
  });

  it('memetakan 500+ ke Gangguan Server', () => {
    const err = new ApiError({ status: 503, code: 'HTTP_503', message: 'unavailable' });
    const result = describeApiError(err, 'menghapus transaksi');
    expect(result.title).toBe('Gangguan Server');
    expect(result.message).toContain('HTTP 503');
  });

  it('menangani error non-ApiError secara aman', () => {
    const result = describeApiError('something went wrong', 'memproses data');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toContain('memproses data');
  });
});
