function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      <div className="aspect-[9/16] w-full bg-surface-overlay animate-skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-surface-overlay rounded animate-skeleton" />
        <div className="h-3 bg-surface-overlay rounded animate-skeleton w-2/3" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="h-5 w-24 bg-surface-overlay rounded animate-skeleton" />
          <div className="h-1.5 w-16 bg-surface-overlay rounded animate-skeleton" />
        </div>
      </div>

      {/* Grid skeleton */}
      <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        <div className="h-14 rounded-xl bg-surface-overlay animate-skeleton mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
