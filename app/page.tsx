import { Header } from '@/components/dashboard/header'
import { VideoGrid } from '@/components/dashboard/video-grid'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        <VideoGrid />
      </main>
    </div>
  )
}
