import { memo, type ReactNode } from 'react';
import { ArrowLeft, Calendar, Filter, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PanduLogo } from '@/components/icons';
import { AppIcon } from '@/components/ui/AppIcon';
import { formatHeaderDate } from '@/lib/format';
import type { WorkspaceTab } from '@/types/workspace';

export type FilterStatus = 'Semua' | 'Pending' | 'Selesai';

interface Props {
  date: string;
  userName: string;
  activeTab: WorkspaceTab;
  tabBar?: ReactNode;
  filterStatus: FilterStatus;
  onFilterChange: (v: FilterStatus) => void;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  onHome: () => void;
  onLogout: () => void;
}

const OPTIONS: FilterStatus[] = ['Semua', 'Pending', 'Selesai'];

function DashboardHeader({
  date,
  userName,
  activeTab,
  tabBar,
  filterStatus,
  onFilterChange,
  onPrimaryAction,
  primaryActionLabel,
  onHome,
  onLogout,
}: Props) {
  const showPriorityFilter = activeTab.kind === 'overview' || activeTab.kind === 'tasking';
  const initial = (userName.trim().slice(0, 1) || 'T').toUpperCase();

  return (
    <div className="space-y-4">
      {/* Sticky header: bersih, proporsional, responsif mobile, logo tanpa background */}
      <header className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2.5 sm:py-3 bg-background/95 backdrop-blur-md border-b border-border/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group text-left rounded-lg py-0.5 pr-1 sm:pr-2 transition-colors shrink-0"
            title="Kembali ke Landing Page"
          >
            <PanduLogo className="size-7 text-foreground shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span className="leading-none">
              <span className="text-[15px] font-extrabold tracking-tight text-foreground block">
                Pandu
              </span>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors inline-flex items-center gap-1 mt-0.5">
                <ArrowLeft className="size-2.5 transition-transform group-hover:-translate-x-0.5" />
                Beranda
              </span>
            </span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {showPriorityFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg px-2.5 sm:px-3 gap-1.5 shrink-0"
                  >
                    <Filter className="size-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline text-xs font-semibold">Filter</span>
                    {filterStatus !== 'Semua' && (
                      <span className="size-2 rounded-full bg-emerald-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Filter Status
                    <button
                      type="button"
                      onClick={() => onFilterChange('Semua')}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt}
                      onSelect={() => onFilterChange(opt)}
                      className={filterStatus === opt ? 'bg-accent font-bold' : undefined}
                    >
                      Status: {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="hidden sm:inline-flex h-9 px-3 rounded-lg border bg-card items-center gap-1.5 text-xs font-semibold text-foreground/90 shrink-0">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span>{formatHeaderDate(date)}</span>
            </div>

            <div className="h-9 flex items-center gap-1.5 sm:gap-2 bg-card border pl-1.5 pr-1 sm:pr-1.5 rounded-lg min-w-0">
              <span className="size-6 rounded-md bg-emerald-500/12 text-emerald-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                {initial}
              </span>
              <span className="text-xs font-semibold max-w-[72px] sm:max-w-[110px] truncate">
                {userName}
              </span>
              <span className="h-4 w-px bg-border mx-0.5" aria-hidden="true" />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={onLogout}
                title="Keluar / Ganti Akun (akun tetap tersimpan)"
                aria-label="Keluar dari sesi"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {tabBar}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-card border shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
            <AppIcon name={activeTab.icon} className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
              {activeTab.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab.description ??
                'Kelola fokus, pembagian tugas, anggaran, dan kebiasaan di tab ini.'}
            </p>
          </div>
        </div>
        <Button
          onClick={onPrimaryAction}
          size="sm"
          className="h-9 px-3.5 rounded-lg shadow-xs w-full justify-center sm:w-auto"
        >
          <Plus className="size-4" /> {primaryActionLabel}
        </Button>
      </div>
    </div>
  );
}

export default memo(DashboardHeader);
