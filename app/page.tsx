'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/dashboard/header'
import { VideoGrid } from '@/components/dashboard/video-grid'

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const onDataChange = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="flex flex-col min-h-full">
      <Header refreshKey={refreshKey} />
      <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        <VideoGrid onDataChange={onDataChange} />
      </main>
    </div>
  )
}
