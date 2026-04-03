'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { idToGradient, formatRelativeTime } from '@/lib/utils'
import type { Template } from '@/lib/types'

interface TemplatePickerProps {
  isOpen: boolean
  onClose: () => void
  templates: Template[]
  isLoading: boolean
  onSelect: (template: Template) => void
}

export function TemplatePicker({
  isOpen,
  onClose,
  templates,
  isLoading,
  onSelect,
}: TemplatePickerProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Load Template">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-overlay animate-skeleton">
              <div className="w-12 h-12 rounded-lg bg-border flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-border rounded w-3/4" />
                <div className="h-3 bg-border rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-foreground/50">No templates saved yet.</p>
          <p className="text-xs text-foreground/30 mt-1">Edit a video and save it as a template.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const { from, to } = idToGradient(t.id)
            return (
              <button
                key={t.id}
                onClick={() => { onSelect(t); onClose() }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-overlay transition-colors text-left"
              >
                {/* Thumbnail / gradient swatch */}
                <div
                  className="w-12 h-12 rounded-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  {t.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.thumbnail_url}
                      alt={t.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    {t.is_favorite && (
                      <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-foreground/50 truncate mt-0.5">{t.description}</p>
                  )}
                  <p className="text-xs text-foreground/30 mt-0.5">
                    Used {t.use_count}× · {formatRelativeTime(t.updated_at)}
                  </p>
                </div>

                {/* Arrow */}
                <svg className="w-4 h-4 text-foreground/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </BottomSheet>
  )
}
