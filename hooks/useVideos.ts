'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Video, PaginatedResponse } from '@/lib/types'

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/videos?limit=100&sort=-created_at')
      if (!res.ok) throw new Error(`Failed to fetch videos (${res.status})`)
      const data: PaginatedResponse<Video> = await res.json()
      setVideos(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto-poll every 10s while any video is rendering
  useEffect(() => {
    const hasRendering = videos.some((v) => v.status === 'rendering')
    if (hasRendering) {
      pollRef.current = setInterval(refresh, 10_000)
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [videos, refresh])

  return { videos, isLoading, error, refresh }
}
