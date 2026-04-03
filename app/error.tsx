'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">Something went wrong</p>
        <p className="text-sm text-foreground/50 mt-1">
          {process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'}
        </p>
      </div>
      <button
        onClick={unstable_retry}
        className="h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-medium
                   hover:bg-brand-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}
