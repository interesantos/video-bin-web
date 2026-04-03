interface EmptyStateProps {
  onUploadClick: () => void
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-brand-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
          />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">No videos yet</p>
        <p className="text-sm text-foreground/50 mt-1">Upload your first video to get started</p>
      </div>
      <button
        onClick={onUploadClick}
        className="mt-2 h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-medium
                   hover:bg-brand-700 transition-colors focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        Upload Video
      </button>
    </div>
  )
}
