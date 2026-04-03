'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Toolbar } from './toolbar'
import { TemplatePicker } from './template-picker'
import { AssetBrowser } from './asset-browser'
import { RenderDialog } from '@/components/render/render-dialog'
import { RenderHistory } from '@/components/render/render-history'
import { useStudio } from '@/hooks/useStudio'
import { useTemplates } from '@/hooks/useTemplates'
import { useRender } from '@/hooks/useRender'
import type { Video, Template, Clip } from '@/lib/types'

interface StudioContainerProps {
  video: Video | null
  initialTemplate: Template | null
}

export function StudioContainer({ video, initialTemplate }: StudioContainerProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Track mount state to avoid hydration mismatch — server and client
  // both render the "loading" state, then client diverges after mount
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => setHasMounted(true), [])

  // Build initial timeline: use template JSON if available, otherwise
  // create a timeline with the video's source file as a clip.
  // Prefer proxy_url (H.264 transcoded) over raw_file_url (may be HEVC)
  const videoSrc = video?.proxy_url ?? video?.raw_file_url
  const initialTimeline = initialTemplate?.shotstack_json ?? (videoSrc ? {
    timeline: {
      tracks: [
        {
          clips: [
            {
              asset: {
                type: 'video' as const,
                src: videoSrc,
              },
              start: 0,
              length: 'auto' as const,
            },
          ],
        },
      ],
      background: '#000000',
    },
    output: {
      format: 'mp4',
      size: { width: 1080, height: 1920 },
    },
  } : undefined)

  // SDK hook — passes the canvas + timeline div refs
  const { isReady, isMockMode, loadTimeline, getTimeline, addClip, play, pause } = useStudio(
    canvasRef,
    timelineRef,
    initialTimeline
  )

  // Poll for H.264 proxy — swap video source once ready for smoother playback
  useEffect(() => {
    if (!video?.id || video.proxy_url || !isReady || isMockMode) return

    let cancelled = false
    const poll = async () => {
      for (let i = 0; i < 30; i++) {
        if (cancelled) return
        try {
          const res = await fetch('/api/videos/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: video.id }),
          })
          const data = await res.json()
          if (data.status === 'ready' && data.proxy_url) {
            // Reload timeline with proxy URL for smooth playback
            loadTimeline({
              timeline: {
                tracks: [{
                  clips: [{
                    asset: { type: 'video' as const, src: data.proxy_url },
                    start: 0,
                    length: 'auto' as const,
                  }],
                }],
                background: '#000000',
              },
              output: { format: 'mp4', size: { width: 1080, height: 1920 } },
            })
            return
          }
          if (data.status === 'failed' || data.status === 'none') return
        } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 5000))
      }
    }
    poll()
    return () => { cancelled = true }
  }, [video?.id, video?.proxy_url, isReady, isMockMode, loadTimeline])

  // Template state
  const { templates, isLoading: templatesLoading, create: createTemplate } = useTemplates()

  // Render state
  const render = useRender()

  // UI panels
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)
  const [isAssetBrowserOpen, setIsAssetBrowserOpen] = useState(false)
  const [isRenderHistoryOpen, setIsRenderHistoryOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ── Save as template ──────────────────────────────────────────────────────
  const handleSaveTemplate = useCallback(async () => {
    const json = getTimeline()
    if (!json) return
    setIsSaving(true)
    try {
      const name = video?.title
        ? `${video.title} — ${new Date().toLocaleDateString()}`
        : `Template ${new Date().toLocaleDateString()}`
      await createTemplate({ name, shotstack_json: json })
    } finally {
      setIsSaving(false)
    }
  }, [getTimeline, createTemplate, video?.title])

  // ── Load a template ───────────────────────────────────────────────────────
  const handleSelectTemplate = useCallback(
    (template: Template) => {
      loadTimeline(template.shotstack_json)
    },
    [loadTimeline]
  )

  // ── Render ────────────────────────────────────────────────────────────────
  const handleRender = useCallback(async () => {
    if (!video) {
      console.error('Render failed: no video loaded')
      return
    }

    let templateId: string
    if (isMockMode) {
      templateId = initialTemplate?.id ?? 'mock-template'
    } else {
      const json = getTimeline()
      if (!json) {
        console.error('Render failed: getTimeline() returned null')
        return
      }
      const saved = await createTemplate({
        name: `Render — ${video.title} — ${new Date().toISOString()}`,
        shotstack_json: json,
      })
      templateId = saved.id
    }

    await render.submit(video.id, templateId)
  }, [video, isMockMode, initialTemplate?.id, getTimeline, createTemplate, render])

  // ── Add clip from asset browser ───────────────────────────────────────────
  const handleAddClip = useCallback(
    (clip: Clip) => {
      addClip(clip)
    },
    [addClip]
  )

  const isRendering = render.state !== 'idle'

  return (
    <div className="flex flex-col h-dvh bg-surface">
      {/* Toolbar */}
      <Toolbar
        videoTitle={video?.title ?? 'Untitled'}
        isMockMode={isMockMode}
        isSaving={isSaving}
        isRendering={isRendering}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={() => setIsTemplatePickerOpen(true)}
        onRender={handleRender}
        onHistory={() => setIsRenderHistoryOpen(true)}
      />

      {/* Main editor area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Canvas — SDK auto-finds this via [data-shotstack-studio] querySelector */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={canvasRef} data-shotstack-studio className="absolute inset-0" />

          {/* Mock overlay — shown on top of canvas div when SDK unavailable */}
          {hasMounted && isMockMode && isReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 gap-4">
              <div className="text-center">
                <p className="text-white/60 text-sm font-medium">Shotstack Studio</p>
                <p className="text-white/30 text-xs mt-1">SDK not loaded — mock mode</p>
              </div>

              {/* Fake canvas preview */}
              <div className="w-full max-w-xs aspect-[9/16] bg-zinc-800 rounded-xl flex items-center justify-center border border-white/10">
                {video?.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                )}
              </div>

              {/* Add clip button */}
              <button
                onClick={() => setIsAssetBrowserOpen(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-600 text-white text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Clip
              </button>
            </div>
          )}

          {/* Loading state before SDK initialises */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900"
            style={{ display: hasMounted && isReady ? 'none' : undefined }}
            suppressHydrationWarning
          >
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        </div>

        {/* Timeline — SDK mounts here; always rendered so ref is stable.
            Needs explicit height + overflow:hidden per SDK docs. */}
        <div
          ref={timelineRef}
          data-shotstack-timeline
          className="border-t border-white/10 overflow-hidden"
          style={{ height: 200 }}
          suppressHydrationWarning
        >
          {/* Mock timeline content when SDK unavailable */}
          {hasMounted && isMockMode && isReady && (
            <div className="h-full bg-zinc-800 flex flex-col justify-center px-4">
              <p className="text-xs text-white/30 mb-2">Timeline</p>
              <div className="h-10 bg-zinc-700 rounded-lg flex items-center px-3 gap-2">
                <div className="h-6 w-24 rounded bg-brand-600/70 flex-shrink-0" />
                <div className="h-6 flex-1 rounded bg-zinc-600/50" />
              </div>
            </div>
          )}
        </div>

        {/* Asset browser FAB — only in real SDK mode (mock shows inline button) */}
        {hasMounted && !isMockMode && isReady && (
          <button
            onClick={() => setIsAssetBrowserOpen(true)}
            className="absolute bottom-28 right-4 w-12 h-12 rounded-full bg-brand-600 shadow-lg flex items-center justify-center"
            aria-label="Add clip"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Render progress dialog */}
      <RenderDialog
        state={render.state}
        progress={render.progress}
        error={render.error}
        outputUrl={render.outputUrl}
        onClose={render.reset}
      />

      {/* Template picker bottom sheet */}
      <TemplatePicker
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        templates={templates}
        isLoading={templatesLoading}
        onSelect={handleSelectTemplate}
      />

      {/* Asset browser bottom sheet */}
      <AssetBrowser
        isOpen={isAssetBrowserOpen}
        onClose={() => setIsAssetBrowserOpen(false)}
        onAddClip={handleAddClip}
      />

      {/* Render history bottom sheet */}
      <RenderHistory
        isOpen={isRenderHistoryOpen}
        onClose={() => setIsRenderHistoryOpen(false)}
        videoId={video?.id}
      />
    </div>
  )
}
