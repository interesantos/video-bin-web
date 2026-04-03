'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  videoTitle: string
  isMockMode: boolean
  isSaving: boolean
  isRendering: boolean
  onSaveTemplate: () => void
  onLoadTemplate: () => void
  onRender: () => void
  onHistory: () => void
}

export function Toolbar({
  videoTitle,
  isMockMode,
  isSaving,
  isRendering,
  onSaveTemplate,
  onLoadTemplate,
  onRender,
  onHistory,
}: ToolbarProps) {
  const router = useRouter()

  return (
    <header className="flex items-center gap-2 px-3 h-14 bg-surface border-b border-border flex-shrink-0">
      {/* Back */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-surface-overlay transition-colors flex-shrink-0"
        aria-label="Back to dashboard"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Title */}
      <p className="flex-1 text-sm font-medium text-foreground truncate min-w-0">
        {videoTitle}
        {isMockMode && (
          <span className="ml-2 text-xs font-normal text-foreground/40">(mock mode)</span>
        )}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onHistory}
          className={cn(
            'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
            'bg-surface-overlay hover:bg-border text-foreground/70 hover:text-foreground'
          )}
        >
          History
        </button>

        <button
          onClick={onLoadTemplate}
          className={cn(
            'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
            'bg-surface-overlay hover:bg-border text-foreground/70 hover:text-foreground'
          )}
        >
          Templates
        </button>

        <button
          onClick={onSaveTemplate}
          disabled={isSaving || isMockMode}
          className={cn(
            'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
            'bg-surface-overlay hover:bg-border text-foreground/70 hover:text-foreground',
            (isSaving || isMockMode) && 'opacity-40 cursor-not-allowed'
          )}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>

        <button
          onClick={onRender}
          disabled={isRendering || isMockMode}
          className={cn(
            'h-8 px-4 rounded-lg text-xs font-medium transition-colors',
            'bg-brand-600 hover:bg-brand-700 text-white',
            (isRendering || isMockMode) && 'opacity-40 cursor-not-allowed'
          )}
        >
          {isRendering ? 'Rendering…' : 'Render'}
        </button>
      </div>
    </header>
  )
}
