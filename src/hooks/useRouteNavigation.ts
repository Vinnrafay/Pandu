import { useCallback, useEffect, useRef, useState } from 'react';

export type AppRoute = 'landing' | 'dashboard' | 'download' | 'desktop-prototype';

function readHashRoute(): AppRoute {
  if (window.location.hash === '#/dashboard') return 'dashboard';
  if (window.location.hash === '#/download') return 'download';
  if (window.location.hash === '#/desktop-prototype') return 'desktop-prototype';
  return 'landing';
}

function hashForRoute(route: AppRoute): string {
  if (route === 'dashboard') return '#/dashboard';
  if (route === 'download') return '#/download';
  if (route === 'desktop-prototype') return '#/desktop-prototype';
  return '#/';
}

/**
 * Manages hash-based route state with an opacity transition and proper timer
 * cleanup on rapid navigation or unmount.
 */
export function useRouteNavigation() {
  const [displayRoute, setDisplayRoute] = useState<AppRoute>(readHashRoute);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentRouteRef = useRef<AppRoute>(displayRoute);
  const swapTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback((): void => {
    if (swapTimerRef.current !== null) {
      window.clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const runTransition = useCallback(
    (target: AppRoute): void => {
      clearTimers();
      currentRouteRef.current = target;
      setIsTransitioning(true);
      swapTimerRef.current = window.setTimeout(() => {
        swapTimerRef.current = null;
        setDisplayRoute(target);
        window.scrollTo({ top: 0 });
        revealTimerRef.current = window.setTimeout(() => {
          revealTimerRef.current = null;
          setIsTransitioning(false);
        }, 30);
      }, 180);
    },
    [clearTimers],
  );

  const navigateTo = useCallback(
    (target: AppRoute): void => {
      if (target === currentRouteRef.current && target === displayRoute) return;
      const targetHash = hashForRoute(target);
      if (window.location.hash !== targetHash) window.history.pushState(null, '', targetHash);
      runTransition(target);
    },
    [displayRoute, runTransition],
  );

  useEffect(() => {
    const onPop = (): void => {
      const route = readHashRoute();
      if (route !== currentRouteRef.current) {
        runTransition(route);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      clearTimers();
    };
  }, [clearTimers, runTransition]);

  return { displayRoute, isTransitioning, navigateTo };
}
