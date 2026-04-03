'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StorageQuota } from '@/lib/types'

export function useStorage() {
  const [usage, setUsage] = useState<StorageQuota | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/storage')
      if (!res.ok) return
      const data: StorageQuota = await res.json()
      setUsage(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { usage, isLoading, refresh }
}
