import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastType } from '@/components/dashboard/modals';

export interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

/** Manages transient toast notifications with automatic dismissal and unmount cleanup. */
export function useToast(durationMs = 3200) {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });
  const timerRef = useRef<number | null>(null);

  const triggerToast = useCallback(
    (message: string, type: ToastType = 'success'): void => {
      setToast({ show: true, message, type });
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { toast, triggerToast };
}
