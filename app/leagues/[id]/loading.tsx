import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Loading UI pour les pages de ligue
 * Utilisé avec Suspense pour un loading progressif
 */
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 bg-slate-700 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-8 bg-slate-700 rounded w-1/3" />
            <div className="h-4 bg-slate-800 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-slate-700 rounded" />
          <div className="w-32 h-10 bg-slate-700 rounded" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-10 bg-slate-700 rounded w-32" />
          <div className="h-10 bg-slate-800 rounded w-24" />
          <div className="h-10 bg-slate-800 rounded w-28" />
        </div>

        {/* Content Skeleton */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="h-6 bg-slate-700 rounded w-1/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-slate-900/50 rounded"
              >
                <div className="w-8 h-8 bg-slate-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-800 rounded w-1/4" />
                </div>
                <div className="h-6 bg-slate-700 rounded w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
