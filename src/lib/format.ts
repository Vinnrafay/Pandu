export const formatRupiah = (val: number): string => `Rp ${val.toLocaleString('id-ID')}`;

export function formatScheduleDate(isoDate: string): { month: string; day: string } {
  const dateObj = new Date(isoDate);
  const isInvalid = isNaN(dateObj.getTime());
  const month = isInvalid ? 'Okt' : dateObj.toLocaleDateString('id-ID', { month: 'short' });
  const day = isInvalid ? '12' : String(dateObj.getDate()).padStart(2, '0');
  return { month, day };
}

export function formatHeaderDate(isoDate: string): string {
  const dateObj = new Date(`${isoDate}T00:00:00`);
  if (isNaN(dateObj.getTime())) return isoDate;
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}
