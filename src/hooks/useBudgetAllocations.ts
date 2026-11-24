import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IconName } from '@/lib/iconRegistry';
import { DEFAULT_ALLOCATIONS, type BudgetAllocation } from '@/types/workspace';

type AllocationMap = Record<string, BudgetAllocation[]>;

function allocStorageKey(guestId: string): string {
  return `pandu_allocations_${guestId}`;
}

function readAllAllocations(guestId: string | null): AllocationMap {
  if (!guestId) return {};
  try {
    const raw = localStorage.getItem(allocStorageKey(guestId));
    if (!raw) return {};
    return JSON.parse(raw) as AllocationMap;
  } catch {
    return {};
  }
}

/**
 * Manages per-tab money allocation envelopes ("Pos Pembagian Uang") persisted
 * in localStorage per guest user.
 */
export function useBudgetAllocations(guestId: string | null, tabId: string) {
  const [byTab, setByTab] = useState<AllocationMap>(() => readAllAllocations(guestId));

  useEffect(() => {
    if (!guestId) return;
    try {
      localStorage.setItem(allocStorageKey(guestId), JSON.stringify(byTab));
    } catch {
      /* abaikan bila storage penuh */
    }
  }, [guestId, byTab]);

  const allocations = useMemo<BudgetAllocation[]>(() => {
    const existing = byTab[tabId];
    if (existing) return existing;
    return tabId === 'tab_finance' ? [...DEFAULT_ALLOCATIONS] : [];
  }, [byTab, tabId]);

  const addAllocation = useCallback(
    (input: { name: string; icon: IconName; allocated: number }): void => {
      const next: BudgetAllocation = {
        id: `alloc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: input.name.trim(),
        icon: input.icon,
        allocated: input.allocated,
        spent: 0,
      };
      setByTab((prev) => {
        const current = prev[tabId] ?? (tabId === 'tab_finance' ? [...DEFAULT_ALLOCATIONS] : []);
        return { ...prev, [tabId]: [...current, next] };
      });
    },
    [tabId],
  );

  const recordSpend = useCallback(
    (allocId: string, amount: number): void => {
      if (amount <= 0) return;
      setByTab((prev) => {
        const current = prev[tabId] ?? (tabId === 'tab_finance' ? [...DEFAULT_ALLOCATIONS] : []);
        return {
          ...prev,
          [tabId]: current.map((item) =>
            item.id === allocId ? { ...item, spent: item.spent + amount } : item,
          ),
        };
      });
    },
    [tabId],
  );

  const deleteAllocation = useCallback(
    (allocId: string): void => {
      setByTab((prev) => {
        const current = prev[tabId] ?? (tabId === 'tab_finance' ? [...DEFAULT_ALLOCATIONS] : []);
        return { ...prev, [tabId]: current.filter((item) => item.id !== allocId) };
      });
    },
    [tabId],
  );

  const totalAllocated = useMemo(
    () => allocations.reduce((sum, item) => sum + item.allocated, 0),
    [allocations],
  );

  const totalAllocationSpent = useMemo(
    () => allocations.reduce((sum, item) => sum + item.spent, 0),
    [allocations],
  );

  return {
    allocations,
    totalAllocated,
    totalAllocationSpent,
    addAllocation,
    recordSpend,
    deleteAllocation,
  };
}
