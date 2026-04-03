import Link from 'next/link'
import { StorageIndicator } from './storage-indicator'

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground shrink-0">
          Video Bin
        </Link>

        <div className="flex items-center gap-3">
          <StorageIndicator />
          <Link
            href="/studio"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Studio
          </Link>
        </div>
      </div>
    </header>
  )
}
