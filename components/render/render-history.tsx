'use client'

import { useState, useEffect, useCallback } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { RenderStatusBadge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import type { RenderJob } from '@/lib/types'

interface RenderHistoryProps {
  isOpen: boolean
  onClose: () => void
  /** Filter renders to a specific video */
  videoId?: string
}

export function RenderHistory({ isOpen, onClose, videoId }: RenderHistoryProps) {
  const [renders, setRenders] = useState<RenderJob[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      // We poll the renders by fetching the video and checking its render_id,
      // plus any other renders in the mock store. For now, fetch the video's
      // current render job if videoId is provided.
      if (!videoId) {
        setRenders([])
        return
      }
      const res = await fetch(`/api/videos/${videoId}`)
      if (!res.ok) return
      const video = await res.json() as { render_id?: string }
      if (!video.render_id) {
        setRenders([])
        return
      }
      const rRes = await fetch(`/api/renders/${video.render_id}`)
      if (!rRes.ok) return
      const render: RenderJob = await rRes.json()
      setRenders([render])
    } finally {
      setIsLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    if (isOpen) void load()
  }, [isOpen, load])

  // Auto-refresh every 5s while sheet is open and any render is active
  useEffect(() => {
    if (!isOpen) return
    const hasActive = renders.some((r) => r.status === 'queued' || r.status === 'rendering')
    if (!hasActive) return
    const interval = setInterval(() => void load(), 5_000)
    return () => clearInterval(interval)
  }, [isOpen, renders, load])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Render History">
      {isLoading && renders.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-overlay animate-skeleton" />
          ))}
        </div>
      ) : renders.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-foreground/50">No renders yet.</p>
          <p className="text-xs text-foreground/30 mt-1">Click Render in the toolbar to start one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {renders.map((render) => (
            <div
              key={render.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border"
            >
              {/* Progress ring / status icon */}
              <div className="relative w-10 h-10 flex-shrink-0">
                {(render.status === 'queued' || render.status === 'rendering') ? (
                  <>
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                        className="text-surface-overlay" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                        className="text-brand-500" strokeWidth="3"
                        strokeDasharray={`${(render.progress / 100) * 94.25} 94.25`}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-foreground/60">
                      {render.progress}%
                    </span>
                  </>
                ) : render.status === 'done' ? (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <RenderStatusBadge status={render.status} />
                  {render.render_time && (
                    <span className="text-xs text-foreground/40">
                      {(render.render_time / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {formatRelativeTime(render.created_at)}
                  {render.completed_at && ` · finished ${formatRelativeTime(render.completed_at)}`}
                </p>
                {render.error_message && (
                  <p className="text-xs text-red-500 truncate mt-0.5">{render.error_message}</p>
                )}
              </div>

              {/* Download link */}
              {render.status === 'done' && render.output_url && (
                <a
                  href={render.output_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 h-8 px-3 rounded-lg bg-brand-50 text-brand-600 text-xs font-medium flex items-center hover:bg-brand-100 transition-colors"
                >
                  Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}
