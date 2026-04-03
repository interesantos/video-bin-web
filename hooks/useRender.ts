'use client'

import { useState, useRef, useCallback } from 'react'
import type { RenderStatus } from '@/lib/types'
import {
  POLL_INITIAL_INTERVAL_MS,
  POLL_MAX_INTERVAL_MS,
  POLL_BACKOFF_MULTIPLIER,
} from '@/lib/constants'

export type RenderState = 'idle' | 'submitting' | RenderStatus

interface UseRenderReturn {
  renderId: string | null
  state: RenderState
  progress: number
  error: string | null
  outputUrl: string | null
  submit: (videoId: string, templateId: string) => Promise<void>
  reset: () => void
}

export function useRender(): UseRenderReturn {
  const [renderId, setRenderId] = useState<string | null>(null)
  const [state, setState] = useState<RenderState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalMsRef = useRef(POLL_INITIAL_INTERVAL_MS)

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const poll = useCallback(
    (id: string) => {
      async function tick() {
        try {
          const res = await fetch(`/api/renders/${id}`)
          if (!res.ok) throw new Error('Failed to fetch render status')

          const job = await res.json() as {
            status: RenderStatus
            progress: number
            output_url?: string
            error_message?: string
          }

          setState(job.status)
          setProgress(job.progress)

          if (job.status === 'done') {
            setOutputUrl(job.output_url ?? null)
            stopPolling()
            return
          }

          if (job.status === 'failed') {
            setError(job.error_message ?? 'Render failed')
            stopPolling()
            return
          }

          // Back off and schedule next poll
          intervalMsRef.current = Math.min(
            intervalMsRef.current * POLL_BACKOFF_MULTIPLIER,
            POLL_MAX_INTERVAL_MS
          )
          timeoutRef.current = setTimeout(tick, intervalMsRef.current)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Polling error')
          stopPolling()
        }
      }

      // Reset backoff before first tick
      intervalMsRef.current = POLL_INITIAL_INTERVAL_MS
      timeoutRef.current = setTimeout(tick, POLL_INITIAL_INTERVAL_MS)
    },
    [stopPolling]
  )

  const submit = useCallback(
    async (videoId: string, templateId: string) => {
      stopPolling()
      setState('submitting')
      setProgress(0)
      setError(null)
      setOutputUrl(null)
      setRenderId(null)

      try {
        const res = await fetch('/api/videos/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, templateId }),
        })

        if (!res.ok) {
          const body = await res.json() as { error?: string }
          throw new Error(body.error ?? 'Failed to submit render')
        }

        const data = await res.json() as { renderId: string; status: RenderStatus }
        setRenderId(data.renderId)
        setState(data.status)
        poll(data.renderId)
      } catch (err) {
        setState('failed')
        setError(err instanceof Error ? err.message : 'Submit failed')
      }
    },
    [poll, stopPolling]
  )

  const reset = useCallback(() => {
    stopPolling()
    setRenderId(null)
    setState('idle')
    setProgress(0)
    setError(null)
    setOutputUrl(null)
  }, [stopPolling])

  return { renderId, state, progress, error, outputUrl, submit, reset }
}
