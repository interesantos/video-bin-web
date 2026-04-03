'use client'

import { useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { cn } from '@/lib/utils'

interface StorageIndicatorProps {
  refreshKey?: number
}

export function StorageIndicator({ refreshKey }: StorageIndicatorProps) {
  const { usage, isLoading, refresh } = useStorage()

  useEffect(() => {
    if (refreshKey) refresh()
  }, [refreshKey, refresh])

  if (isLoading || !usage) {
    return <div className="h-1.5 w-24 rounded-full bg-surface-overlay animate-skeleton" />
  }

  const pct = Math.min(usage.percentUsed, 100)
  const barColor =
    pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-green-500'
  const textColor =
    pct >= 80 ? 'text-red-600' : pct >= 60 ? 'text-yellow-600' : 'text-green-600'

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="hidden sm:flex flex-col items-end text-xs leading-none">
        <span className={cn('font-medium', textColor)}>
          {usage.usedGB.toFixed(1)} / {usage.totalGB} GB
        </span>
        <span className="text-foreground/40 mt-0.5">{usage.videoCount} videos</span>
      </div>
      <div className="w-16 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
