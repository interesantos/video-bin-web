export default function StudioLoading() {
  return (
    <div className="flex flex-col h-dvh bg-zinc-900">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3 px-3 h-14 border-b border-white/10 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/10 animate-skeleton flex-shrink-0" />
        <div className="flex-1 h-4 rounded bg-white/10 animate-skeleton max-w-xs" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-20 rounded-lg bg-white/10 animate-skeleton" />
          <div className="h-8 w-16 rounded-lg bg-white/10 animate-skeleton" />
          <div className="h-8 w-16 rounded-lg bg-white/10 animate-skeleton" />
        </div>
      </div>

      {/* Canvas skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-xs aspect-[9/16] bg-white/5 rounded-xl animate-skeleton" />
      </div>

      {/* Timeline skeleton */}
      <div className="h-24 border-t border-white/10 px-4 flex flex-col justify-center gap-2">
        <div className="h-2 w-16 rounded bg-white/10 animate-skeleton" />
        <div className="h-10 rounded-lg bg-white/10 animate-skeleton" />
      </div>
    </div>
  )
}
