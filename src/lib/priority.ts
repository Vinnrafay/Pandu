import { ApiError } from '../api/client';
import type { Priority } from '../types/pandu';

export const PRIORITY_SLOTS = [1, 2, 3] as const;

let lastGeneratedId = Date.now();

/**
 * Generates a monotonically increasing numeric ID for optimistic client records
 * before the server assigns a persisted ID.
 */
export function generateUniqueId(): number {
  const now = Date.now();
  lastGeneratedId = now > lastGeneratedId ? now : lastGeneratedId + 1;
  return lastGeneratedId;
}

/**
 * Returns the lowest available priority slot (1-3) by inspecting `slot_number`
 * rather than array length, because soft-deleted/completed rows on the server
 * can leave non-contiguous slot numbers.
 */
export function freeSlot(priorities: Priority[]): number | null {
  for (const slot of PRIORITY_SLOTS) {
    if (!priorities.some((p) => p.slot_number === slot)) return slot;
  }
  return null;
}

/** Returns true when an API error indicates a server-side slot uniqueness conflict (HTTP 409). */
export function isSlotConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

export interface BudgetSummary {
  limit: number;
  spent: number;
  isOverbudget: boolean;
  netRemaining: number;
  percentage: number;
}

/** Computes derived daily budget metrics for display. */
export function computeBudgetSummary(limit: number, spent: number): BudgetSummary {
  const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  return {
    limit,
    spent,
    isOverbudget: spent > limit,
    netRemaining: limit - spent,
    percentage,
  };
}
