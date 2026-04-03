'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VideoStatusBadge } from '@/components/ui/badge'
import { useSwipe } from '@/hooks/useSwipe'
import { formatDuration, formatRelativeTime, idToGradient, cn } from '@/lib/utils'
import type { Video } from '@/lib/types'

interface VideoCardProps {
  video: Video
  onDelete: (id: string) => void
}

export function VideoCard({ video, onDelete }: VideoCardProps) {
  const router = useRouter()
  const [swiped, setSwiped] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => setSwiped(true),
    onSwipeRight: () => setSwiped(false),
  })

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      setDeleting(true)
      try {
        await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })
        onDelete(video.id)
      } finally {
        setDeleting(false)
      }
    },
    [video.id, onDelete]
  )

  const handleTap = useCallback(() => {
    if (swiped) {
      setSwiped(false)
      return
    }
    router.push(`/studio?videoId=${video.id}`)
  }, [swiped, router, video.id])

  const { from: gradientFrom, to: gradientTo } = idToGradient(video.id)

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-surface shadow-sm border border-border">
      {/* Delete button — visible on hover (desktop) */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
        aria-label="Delete video"
      >
        {deleting ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>

      {/* Delete action revealed on swipe-left */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-10">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            'h-10 px-4 rounded-xl bg-red-500 text-white text-sm font-medium',
            'transition-all duration-200',
            swiped ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          )}
        >
          {deleting ? '…' : 'Delete'}
        </button>
      </div>

      {/* Card content — slides left on swipe */}
      <div
        className={cn('swipe-card', swiped && '-translate-x-20')}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={handleTap}
      >
        {/* Thumbnail */}
        <div
          className="aspect-[9/16] w-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          }}
        >
          {video.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover scale-[1.20]"
            />
          )}
          {/* Rendering overlay */}
          {video.status === 'rendering' && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
              {video.title}
            </p>
            <VideoStatusBadge status={video.status} />
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/40">
            {video.duration != null && <span>{formatDuration(video.duration)}</span>}
            {video.duration != null && <span>·</span>}
            <span>{formatRelativeTime(video.created_at)}</span>
          </div>
          {video.error_message && (
            <p className="text-xs text-red-500 truncate">{video.error_message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
