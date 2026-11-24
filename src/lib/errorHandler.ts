import { ApiError } from '../api/client';

export interface FriendlyError {
  code: string;
  title: string;
  message: string;
  recoverable: boolean;
}

/**
 * Translates low-level API / runtime errors into clear, actionable Indonesian
 * messages for toasts, banners, and form feedback.
 */
export function describeApiError(error: unknown, actionLabel: string): FriendlyError {
  if (error instanceof ApiError) {
    if (error.status === 0 || error.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        title: 'Koneksi Terputus',
        message: `Gagal ${actionLabel}: tidak dapat terhubung ke server. Periksa koneksi internet Anda.`,
        recoverable: true,
      };
    }
    if (error.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        title: 'Sesi Berakhir',
        message: `Gagal ${actionLabel}: sesi tamu telah berakhir. Silakan keluar dan masuk kembali.`,
        recoverable: false,
      };
    }
    if (error.status === 404) {
      return {
        code: 'NOT_FOUND',
        title: 'Data Tidak Ditemukan',
        message: `Gagal ${actionLabel}: data sudah berubah atau dihapus di server.`,
        recoverable: true,
      };
    }
    if (error.status === 409) {
      return {
        code: 'CONFLICT',
        title: 'Data Bentrok',
        message:
          error.message ||
          `Gagal ${actionLabel}: terjadi bentrok data (slot penuh atau jadwal tumpang tindih).`,
        recoverable: true,
      };
    }
    if (error.status === 400 || error.status === 422) {
      return {
        code: 'VALIDATION_ERROR',
        title: 'Input Tidak Valid',
        message: error.message || `Gagal ${actionLabel}: periksa kembali data yang Anda masukkan.`,
        recoverable: true,
      };
    }
    if (error.status >= 500) {
      return {
        code: error.code || 'SERVER_ERROR',
        title: 'Gangguan Server',
        message: `Gagal ${actionLabel}: server sedang mengalami gangguan (HTTP ${error.status}). Coba beberapa saat lagi.`,
        recoverable: true,
      };
    }
    return {
      code: error.code || `HTTP_${error.status}`,
      title: 'Terjadi Kesalahan',
      message: error.message || `Gagal ${actionLabel}.`,
      recoverable: true,
    };
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return {
      code: 'UNEXPECTED_ERROR',
      title: 'Terjadi Kesalahan',
      message: `Gagal ${actionLabel}: ${error.message}`,
      recoverable: true,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    title: 'Terjadi Kesalahan',
    message: `Gagal ${actionLabel}. Silakan coba lagi.`,
    recoverable: true,
  };
}
