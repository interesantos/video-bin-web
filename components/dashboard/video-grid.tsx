'use client'

import { useCallback, useRef } from 'react'
import { VideoCard } from './video-card'
import { EmptyState } from './empty-state'
import { UploadButton } from './upload-button'
import { useVideos } from '@/hooks/useVideos'
import type { Video } from '@/lib/types'

/**
 * Extract date from video title (e.g. "3 Apr 2026 at 14:03" → "3 Apr")
 * Falls back to created_at date if title doesn't contain a recognizable date.
 */
function getDayLabel(video: Video): string {
  // Match patterns like "3 Apr 2026" or "3 Apr"
  const match = video.title.match(/(\d{1,2}\s+\w{3})/)
  if (match) return match[1]
  // Fallback: use created_at
  const d = new Date(video.created_at)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function groupByDay(videos: Video[]): { label: string; videos: Video[] }[] {
  const groups: { label: string; videos: Video[] }[] = []
  let currentLabel = ''
  for (const video of videos) {
    const label = getDayLabel(video)
    if (label !== currentLabel) {
      groups.push({ label, videos: [video] })
      currentLabel = label
    } else {
      groups[groups.length - 1].videos.push(video)
    }
  }
  return groups
}

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

interface VideoGridProps {
  onDataChange?: () => void
}

export function VideoGrid({ onDataChange }: VideoGridProps) {
  const { videos, isLoading, error, refresh } = useVideos()
  const uploadRef = useRef<HTMLDivElement>(null)

  const handleRefresh = useCallback(() => {
    refresh()
    onDataChange?.()
  }, [refresh, onDataChange])

  const handleDelete = useCallback(
    (id: string) => {
      handleRefresh()
      void id
    },
    [handleRefresh]
  )

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' })
    uploadRef.current?.querySelector('div')?.click()
  }, [])

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-500 mb-3">{error}</p>
        <button
          onClick={refresh}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div ref={uploadRef}>
        <UploadButton onSuccess={handleRefresh} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState onUploadClick={scrollToUpload} />
      ) : (
        <div className="space-y-6">
          {groupByDay(videos).map(({ label, videos: dayVideos }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-foreground/60">{label}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {dayVideos.map((video) => (
                  <VideoCard key={video.id} video={video} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
