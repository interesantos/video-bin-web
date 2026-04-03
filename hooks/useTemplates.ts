'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Template, CreateTemplateRequest, UpdateTemplateRequest, PaginatedResponse } from '@/lib/types'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/templates?limit=50')
      if (!res.ok) throw new Error('Failed to load templates')
      const data: PaginatedResponse<Template> = await res.json()
      setTemplates(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (req: CreateTemplateRequest): Promise<Template> => {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) throw new Error('Failed to create template')
      const created: Template = await res.json()
      await refresh()
      return created
    },
    [refresh]
  )

  const update = useCallback(
    async (id: string, req: UpdateTemplateRequest): Promise<Template> => {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) throw new Error('Failed to update template')
      const updated: Template = await res.json()
      await refresh()
      return updated
    },
    [refresh]
  )

  return { templates, isLoading, error, refresh, create, update }
}
