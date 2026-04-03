import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-surface gap-4 px-6 text-center">
      <p className="text-6xl font-bold text-foreground/10">404</p>
      <div>
        <p className="text-base font-semibold text-foreground">Page not found</p>
        <p className="text-sm text-foreground/50 mt-1">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Link
        href="/"
        className="mt-2 h-10 px-6 rounded-xl bg-brand-600 text-white text-sm font-medium flex items-center hover:bg-brand-700 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
