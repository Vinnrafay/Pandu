import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function Row({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="p-3.5 rounded-lg border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="size-6 rounded-md shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen bg-background p-6 lg:p-8"
      aria-busy="true"
      aria-label="Memuat dashboard"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <Skeleton className="h-9 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            {[0, 1].map((c) => (
              <Card key={c}>
                <CardHeader data-border className="pb-4">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Row lines={c === 0 ? 3 : 2} />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-5 space-y-6">
            {[0, 1].map((c) => (
              <Card key={c}>
                <CardHeader data-border className="pb-4">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Row lines={2} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
