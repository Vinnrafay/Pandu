import { memo } from 'react';
import { Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getIconComponent } from '@/lib/iconRegistry';
import { cn } from '@/lib/utils';
import type { WorkspaceTab } from '@/types/workspace';

interface BrowserTabBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  tabCounts?: Record<string, number>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (tab: WorkspaceTab) => void;
  onClose: (id: string) => void;
  onReset: () => void;
}

function BrowserTabBar({
  tabs,
  activeTabId,
  tabCounts,
  onSelect,
  onAdd,
  onEdit,
  onClose,
  onReset,
}: BrowserTabBarProps) {
  return (
    <div className="bg-muted/80 border rounded-xl p-1.5 flex items-center gap-1.5 shadow-2xs">
      <div
        className="flex items-center gap-1 overflow-x-auto no-scrollbar snap-x flex-1 min-w-0"
        role="tablist"
        aria-label="Tab Workspace"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const Icon = getIconComponent(tab.icon);
          const count = tabCounts?.[tab.id];
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(tab.id);
                }
              }}
              className={cn(
                'group flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer select-none border',
                isActive
                  ? 'bg-card text-foreground border-border shadow-xs'
                  : 'bg-transparent text-muted-foreground border-transparent hover:bg-card/60 hover:text-foreground',
              )}
            >
              <Icon className={cn('size-3.5 shrink-0', isActive ? 'text-primary' : 'opacity-80')} />
              <span className="max-w-[140px] truncate">{tab.title}</span>
              {typeof count === 'number' && count > 0 && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[10px] tabular-nums leading-none',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'bg-background/80 text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(tab);
                  }}
                  title="Edit nama & ikon tab"
                  aria-label={`Edit tab ${tab.title}`}
                  className="size-5 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Pencil className="size-3" />
                </button>
              )}
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  title="Tutup tab"
                  aria-label={`Tutup tab ${tab.title}`}
                  className={cn(
                    'size-5 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer',
                    !isActive && 'opacity-60 group-hover:opacity-100',
                  )}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-border/70">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAdd}
          className="h-8 text-xs px-2.5"
          title="Buat tab baru untuk tasking atau pembagian uang"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Tab Baru</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="size-8 text-muted-foreground hover:text-foreground"
          title="Kembalikan tab ke bawaan"
          aria-label="Reset tab default"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default memo(BrowserTabBar);
