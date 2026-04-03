'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EditJSON, Clip } from '@/lib/types'

// SDK types — imported dynamically at runtime to avoid SSR issues
type ShotstackEdit = InstanceType<typeof import('@shotstack/shotstack-studio').Edit>
type ShotstackCanvas = InstanceType<typeof import('@shotstack/shotstack-studio').Canvas>
type ShotstackTimeline = InstanceType<typeof import('@shotstack/shotstack-studio').Timeline>
type ShotstackControls = InstanceType<typeof import('@shotstack/shotstack-studio').Controls>
type ShotstackUIController = ReturnType<typeof import('@shotstack/shotstack-studio').UIController.create>

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseStudioReturn {
  /** True once the SDK has initialised inside the container refs */
  isReady: boolean
  /** True when running without the real SDK (import failed) */
  isMockMode: boolean
  loadTimeline: (json: EditJSON) => void
  getTimeline: () => EditJSON | null
  addClip: (clip: Clip) => void
  play: () => void
  pause: () => void
}

export function useStudio(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  timelineRef: React.RefObject<HTMLDivElement | null>,
  initialTimeline?: EditJSON
): UseStudioReturn {
  const [isReady, setIsReady] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)

  const editRef = useRef<ShotstackEdit | null>(null)
  const canvasInstanceRef = useRef<ShotstackCanvas | null>(null)
  const timelineInstanceRef = useRef<ShotstackTimeline | null>(null)
  const controlsRef = useRef<ShotstackControls | null>(null)
  const uiRef = useRef<ShotstackUIController | null>(null)

  useEffect(() => {
    let disposed = false

    async function init() {
      // Wait for next frame so the DOM is fully painted and queryable
      await new Promise((r) => requestAnimationFrame(r))

      if (disposed) return

      const canvasEl = canvasRef.current
      const timelineEl = timelineRef.current

      if (!canvasEl || !timelineEl) {
        setIsMockMode(true)
        setIsReady(true)
        return
      }

      // Verify the data attribute is on the element and it has dimensions
      if (!document.querySelector('[data-shotstack-studio]')) {
        setIsMockMode(true)
        setIsReady(true)
        return
      }

      try {
        const { Edit, Canvas, Timeline, Controls, UIController } = await import(
          '@shotstack/shotstack-studio'
        )

        if (disposed) return

        // Build a default template when none is provided
        const template = initialTimeline ?? {
          timeline: {
            tracks: [
              {
                clips: [
                  {
                    asset: {
                      type: 'text',
                      text: 'Your video',
                      font: { color: '#ffffff', family: 'Arial', size: 32 },
                    },
                    start: 0,
                    length: 5,
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
        }

        // 1. Create Edit
        const edit = new Edit(template as Parameters<typeof Edit['prototype']['loadEdit']>[0])

        // 2. Create Canvas (auto-finds [data-shotstack-studio] via querySelector)
        const canvas = new Canvas(edit)
        await canvas.load()

        if (disposed) { canvas.dispose(); return }

        // 3. Load edit
        await edit.load()

        // 4. Timeline (takes the container element directly)
        const timeline = new Timeline(edit, timelineEl, { resizable: true })
        await timeline.load()

        // 5. Controls (keyboard shortcuts)
        const controls = new Controls(edit)
        await controls.load()

        // 6. UIController (auto-mounts into [data-shotstack-studio])
        const ui = UIController.create(edit, canvas)

        if (disposed) {
          ui.dispose()
          timeline.dispose()
          canvas.dispose()
          return
        }

        editRef.current = edit
        canvasInstanceRef.current = canvas
        timelineInstanceRef.current = timeline
        controlsRef.current = controls
        uiRef.current = ui

        setIsReady(true)
      } catch (err) {
        console.warn('Shotstack Studio SDK failed to load, entering mock mode:', err)
        if (!disposed) {
          setIsMockMode(true)
          setIsReady(true)
        }
      }
    }

    init()

    return () => {
      disposed = true
      uiRef.current?.dispose()
      timelineInstanceRef.current?.dispose()
      canvasInstanceRef.current?.dispose()
      uiRef.current = null
      timelineInstanceRef.current = null
      canvasInstanceRef.current = null
      controlsRef.current = null
      editRef.current = null
      setIsReady(false)
      setIsMockMode(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTimeline = useCallback(
    (json: EditJSON) => {
      if (isMockMode || !editRef.current) return
      editRef.current.loadEdit(json as Parameters<ShotstackEdit['loadEdit']>[0])
    },
    [isMockMode]
  )

  const getTimeline = useCallback((): EditJSON | null => {
    if (isMockMode || !editRef.current) return null
    return editRef.current.getEdit() as unknown as EditJSON
  }, [isMockMode])

  const addClip = useCallback(
    (clip: Clip) => {
      if (isMockMode || !editRef.current) return
      editRef.current.addClip(0, clip as Parameters<ShotstackEdit['addClip']>[1])
    },
    [isMockMode]
  )

  const play = useCallback(() => {
    if (isMockMode) return
    editRef.current?.play()
  }, [isMockMode])

  const pause = useCallback(() => {
    if (isMockMode) return
    editRef.current?.pause()
  }, [isMockMode])

  return { isReady, isMockMode, loadTimeline, getTimeline, addClip, play, pause }
}
