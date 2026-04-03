'use client'

import { useCallback, useRef } from 'react'
import { VideoCard } from './video-card'
import { EmptyState } from './empty-state'
import { UploadButton } from './upload-button'
import { useVideos } from '@/hooks/useVideos'

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
