'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { idToGradient, formatDuration, formatRelativeTime } from '@/lib/utils'
import type { Video, Clip } from '@/lib/types'
import { useVideos } from '@/hooks/useVideos'

interface AssetBrowserProps {
  isOpen: boolean
  onClose: () => void
  onAddClip: (clip: Clip) => void
}

export function AssetBrowser({ isOpen, onClose, onAddClip }: AssetBrowserProps) {
  const { videos, isLoading } = useVideos()

  // Only show videos that have a source file available
  const available = videos.filter((v) => v.status === 'ready' || v.raw_file_url)

  function handleAdd(video: Video) {
    const clip: Clip = {
      asset: {
        type: 'video',
        src: video.edited_file_url ?? video.raw_file_url ?? `mock://videos/${video.id}`,
        ...(video.duration != null ? { trim: 0 } : {}),
      },
      start: 0,
      length: video.duration ?? 10,
    }
    onAddClip(clip)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add Clip">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-overlay animate-skeleton">
              <div className="w-10 h-16 rounded-lg bg-border flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-border rounded w-3/4" />
                <div className="h-3 bg-border rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : available.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-foreground/50">No ready videos found.</p>
          <p className="text-xs text-foreground/30 mt-1">Upload and render a video first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {available.map((video) => {
            const { from, to } = idToGradient(video.id)
            return (
              <button
                key={video.id}
                onClick={() => handleAdd(video)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-overlay transition-colors text-left"
              >
                {/* Thumbnail — portrait aspect */}
                <div
                  className="w-10 h-16 rounded-lg flex-shrink-0 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  {video.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-foreground/40">
                    {video.duration != null && <span>{formatDuration(video.duration)}</span>}
                    {video.duration != null && <span>·</span>}
                    <span>{formatRelativeTime(video.created_at)}</span>
                  </div>
                </div>

                {/* Add icon */}
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </BottomSheet>
  )
}
