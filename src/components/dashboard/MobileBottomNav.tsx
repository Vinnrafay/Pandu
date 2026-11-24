import { memo } from 'react';
import { Plus } from 'lucide-react';
import { AppIcon } from '@/components/ui/AppIcon';
import { cn } from '@/lib/utils';
import type { WorkspaceTab } from '@/types/workspace';

interface MobileBottomNavProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onAddTab: () => void;
}

/**
 * Navigasi bawah khusus layar mobile (md:hidden) agar perpindahan tab
 * nyaman dijangkau satu tangan seperti aplikasi native.
 */
function MobileBottomNav({ tabs, activeTabId, onSelect, onAddTab }: MobileBottomNavProps) {
  const visibleTabs = tabs.slice(0, 4);

  return (
    <nav
      aria-label="Navigasi Mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-colors cursor-pointer min-w-0',
                isActive ? 'text-primary font-bold bg-accent/80' : 'text-muted-foreground',
              )}
            >
              <AppIcon name={tab.icon} className="size-4 shrink-0" />
              <span className="text-[10px] leading-none truncate w-full text-center">
                {tab.title}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAddTab}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Buat tab baru"
        >
          <Plus className="size-4 shrink-0" />
          <span className="text-[10px] leading-none font-semibold">Tab Baru</span>
        </button>
      </div>
    </nav>
  );
}

export default memo(MobileBottomNav);
