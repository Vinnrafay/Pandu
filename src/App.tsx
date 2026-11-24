import { lazy, Suspense, type ReactElement } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRouteNavigation } from '@/hooks/useRouteNavigation';
import { useToast } from '@/hooks/useToast';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import DashboardWorkspace from '@/components/dashboard/DashboardWorkspace';
import { Toast } from '@/components/dashboard/modals';

const LandingPage = lazy(() => import('./LandingPage'));
const DownloadPage = lazy(() => import('./DownloadPage'));
const DesktopPrototypePage = lazy(() => import('./DesktopPrototypePage'));

export default function App(): ReactElement {
  const { toast, triggerToast } = useToast();
  const { displayRoute, isTransitioning, navigateTo } = useRouteNavigation();

  const {
    guestUser,
    savedGuests,
    data,
    expenses,
    schedules,
    loading,
    syncError,
    isSyncing,
    clearSyncError,
    retrySync,
    tempBudgetLimit,
    setTempBudgetLimit,
    handleLoginAsGuest,
    handleSelectSavedGuest,
    handleRemoveSavedGuest,
    handleLogout,
    handleTogglePriority,
    handleDeletePriority,
    handleSaveTask,
    handleDeleteWaiting,
    handlePromoteWaiting,
    handleAddExpense,
    handleDeleteExpense,
    handleSaveBudgetLimit,
    handleHabitToggle,
    handleSaveHabit,
    handleDeleteHabit,
    handleSaveSchedule,
    handleDeleteSchedule,
  } = useDashboardData({ triggerToast, navigateTo });

  return (
    <div className="relative min-h-screen bg-background">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      {/* Transisi opacity-only: tanpa scale/translate agar tidak memicu layout thrash */}
      <div
        className={`transition-opacity duration-150 ease-out ${isTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {displayRoute === 'landing' ? (
          <Suspense fallback={<DashboardSkeleton />}>
            <LandingPage
              activeGuest={guestUser}
              savedGuests={savedGuests}
              onEnterApp={handleLoginAsGuest}
              onSelectSavedGuest={handleSelectSavedGuest}
              onRemoveSavedGuest={handleRemoveSavedGuest}
              onResumeDashboard={() => navigateTo('dashboard')}
              onOpenDownload={() => navigateTo('download')}
            />
          </Suspense>
        ) : displayRoute === 'download' ? (
          <Suspense fallback={<DashboardSkeleton />}>
            <DownloadPage
              activeUserName={guestUser?.name ?? null}
              onBackHome={() => navigateTo('landing')}
              onOpenDashboard={() => {
                if (guestUser) {
                  navigateTo('dashboard');
                } else {
                  navigateTo('landing');
                }
              }}
              onOpenDesktopPrototype={() => navigateTo('desktop-prototype')}
              onNotify={triggerToast}
            />
          </Suspense>
        ) : displayRoute === 'desktop-prototype' ? (
          <Suspense fallback={<DashboardSkeleton />}>
            <DesktopPrototypePage
              onBackDownload={() => navigateTo('download')}
              onBackHome={() => navigateTo('landing')}
              onNotify={triggerToast}
            />
          </Suspense>
        ) : loading ? (
          <DashboardSkeleton />
        ) : (
          <DashboardWorkspace
            key={guestUser?.id ?? 'guest'}
            guestId={guestUser?.id ?? null}
            userName={guestUser?.name ?? 'Tamu'}
            data={data}
            expenses={expenses}
            schedules={schedules}
            syncError={syncError}
            isSyncing={isSyncing}
            tempBudgetLimit={tempBudgetLimit}
            onTempBudgetLimit={setTempBudgetLimit}
            onClearSyncError={clearSyncError}
            onRetrySync={retrySync}
            onHome={() => navigateTo('landing')}
            onLogout={handleLogout}
            onToast={triggerToast}
            onTogglePriority={handleTogglePriority}
            onDeletePriority={handleDeletePriority}
            onSaveTask={handleSaveTask}
            onDeleteWaiting={handleDeleteWaiting}
            onPromoteWaiting={handlePromoteWaiting}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onSaveBudgetLimit={handleSaveBudgetLimit}
            onHabitToggle={handleHabitToggle}
            onSaveHabit={handleSaveHabit}
            onDeleteHabit={handleDeleteHabit}
            onSaveSchedule={handleSaveSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}
      </div>
    </div>
  );
}
