'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { RenderState } from '@/hooks/useRender'

interface RenderDialogProps {
  state: RenderState
  progress: number
  error: string | null
  outputUrl: string | null
  onClose: () => void
}

const STATE_LABELS: Record<RenderState, string> = {
  idle: '',
  submitting: 'Submitting…',
  queued: 'Queued — waiting for renderer',
  rendering: 'Rendering…',
  done: 'Done!',
  failed: 'Render failed',
}

export function RenderDialog({ state, progress, error, outputUrl, onClose }: RenderDialogProps) {
  const isOpen = state !== 'idle'
  const isDone = state === 'done'
  const isFailed = state === 'failed'
  const isActive = !isDone && !isFailed

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isActive) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, isActive, onClose])

  if (!isOpen) return null

  // Visual progress: during submitting/queued show indeterminate pulse
  const showIndeterminate = state === 'submitting' || state === 'queued'
  const displayProgress = showIndeterminate ? 0 : progress

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={!isActive ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm bg-surface rounded-2xl shadow-xl p-6 flex flex-col gap-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-foreground">
              {isDone ? 'Render complete' : isFailed ? 'Render failed' : 'Rendering video'}
            </p>
            <p className="text-sm text-foreground/50 mt-0.5">{STATE_LABELS[state]}</p>
          </div>

          {/* Status icon */}
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            isDone ? 'bg-green-100' : isFailed ? 'bg-red-100' : 'bg-brand-50'
          )}>
            {isDone ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isFailed ? (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-foreground/40">
            <span>{showIndeterminate ? 'Waiting…' : `${displayProgress}%`}</span>
            {!showIndeterminate && !isDone && !isFailed && (
              <span className="tabular-nums">{displayProgress}/100</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-surface-overlay overflow-hidden">
            {showIndeterminate ? (
              <div className="h-full w-1/3 rounded-full bg-brand-500 animate-[skeleton-pulse_1s_ease-in-out_infinite]" />
            ) : (
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isDone ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-brand-500'
                )}
                style={{ width: `${isDone ? 100 : displayProgress}%` }}
              />
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isDone && outputUrl && (
            <a
              href={outputUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 rounded-xl bg-brand-600 text-white text-sm font-medium flex items-center justify-center hover:bg-brand-700 transition-colors"
            >
              Download
            </a>
          )}
          <button
            onClick={onClose}
            disabled={isActive}
            className={cn(
              'flex-1 h-10 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-surface-overlay text-foreground/30 cursor-not-allowed'
                : 'bg-surface-overlay hover:bg-border text-foreground'
            )}
          >
            {isActive ? 'Please wait…' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
