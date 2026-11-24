import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IconName } from '@/lib/iconRegistry';
import { DEFAULT_WORKSPACE_TABS, type TabKind, type WorkspaceTab } from '@/types/workspace';

interface StoredTabState {
  tabs: WorkspaceTab[];
  activeTabId: string;
}

function tabsStorageKey(guestId: string): string {
  return `pandu_workspace_tabs_${guestId}`;
}

function readTabs(guestId: string | null): StoredTabState {
  const fallback: StoredTabState = {
    tabs: [...DEFAULT_WORKSPACE_TABS],
    activeTabId: DEFAULT_WORKSPACE_TABS[0].id,
  };
  if (!guestId) return fallback;
  try {
    const raw = localStorage.getItem(tabsStorageKey(guestId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredTabState>;
    if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) return fallback;
    const activeExists = parsed.tabs.some((t) => t.id === parsed.activeTabId);
    return {
      tabs: parsed.tabs,
      activeTabId: activeExists && parsed.activeTabId ? parsed.activeTabId : parsed.tabs[0].id,
    };
  } catch {
    return fallback;
  }
}

export interface TabInput {
  title: string;
  kind: TabKind;
  icon: IconName;
  description?: string;
}

/**
 * Manages browser-like workspace tabs (add, edit, close, switch, reset)
 * persisted per guest user in localStorage.
 */
export function useWorkspaceTabs(guestId: string | null) {
  const [state, setState] = useState<StoredTabState>(() => readTabs(guestId));

  useEffect(() => {
    if (!guestId) return;
    try {
      localStorage.setItem(tabsStorageKey(guestId), JSON.stringify(state));
    } catch {
      /* abaikan bila storage penuh */
    }
  }, [guestId, state]);

  const activeTab = useMemo(
    () => state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0],
    [state.tabs, state.activeTabId],
  );

  const selectTab = useCallback((id: string): void => {
    setState((prev) => ({ ...prev, activeTabId: id }));
  }, []);

  const addTab = useCallback((input: TabInput): WorkspaceTab => {
    const tab: WorkspaceTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: input.title.trim(),
      kind: input.kind,
      icon: input.icon,
      description: input.description?.trim() || undefined,
    };
    setState((prev) => ({
      tabs: [...prev.tabs, tab],
      activeTabId: tab.id,
    }));
    return tab;
  }, []);

  const updateTab = useCallback((id: string, input: TabInput): void => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              title: input.title.trim(),
              kind: input.kind,
              icon: input.icon,
              description: input.description?.trim() || undefined,
            }
          : tab,
      ),
    }));
  }, []);

  const closeTab = useCallback((id: string): boolean => {
    let closed = false;
    setState((prev) => {
      if (prev.tabs.length <= 1) return prev;
      const idx = prev.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      closed = true;
      const nextTabs = prev.tabs.filter((t) => t.id !== id);
      const nextActive =
        prev.activeTabId === id
          ? (nextTabs[Math.max(0, idx - 1)]?.id ?? nextTabs[0].id)
          : prev.activeTabId;
      return { tabs: nextTabs, activeTabId: nextActive };
    });
    return closed;
  }, []);

  const resetTabs = useCallback((): void => {
    setState({
      tabs: [...DEFAULT_WORKSPACE_TABS],
      activeTabId: DEFAULT_WORKSPACE_TABS[0].id,
    });
  }, []);

  return {
    tabs: state.tabs,
    activeTabId: activeTab.id,
    activeTab,
    selectTab,
    addTab,
    updateTab,
    closeTab,
    resetTabs,
  };
}
