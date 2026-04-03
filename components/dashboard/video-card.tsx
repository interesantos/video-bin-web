'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VideoStatusBadge } from '@/components/ui/badge'
import { formatDuration, formatRelativeTime, idToGradient } from '@/lib/utils'
import type { Video } from '@/lib/types'

interface VideoCardProps {
  video: Video
  onDelete: (id: string) => void
}

export function VideoCard({ video, onDelete }: VideoCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = useCallback(
    async () => {
      setDeleting(true)
      try {
        await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })
        onDelete(video.id)
      } finally {
        setDeleting(false)
        setShowConfirm(false)
      }
    },
    [video.id, onDelete]
  )

  const { from: gradientFrom, to: gradientTo } = idToGradient(video.id)

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-2xl bg-surface shadow-sm border border-border cursor-pointer"
        onClick={() => router.push(`/studio?videoId=${video.id}`)}
      >
        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
          disabled={deleting}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/50 text-white flex items-center justify-center z-20"
          aria-label="Delete video"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

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

      {/* Confirm delete popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-surface rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col gap-4 animate-fade-in">
            <p className="text-base font-semibold text-foreground">Delete video?</p>
            <p className="text-sm text-foreground/50">
              &quot;{video.title}&quot; will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-surface-overlay text-foreground text-sm font-medium hover:bg-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
