// Service URLs — server-side only (no NEXT_PUBLIC_)
export const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055'
export const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN ?? ''
export const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY ?? ''
export const SHOTSTACK_ENV = process.env.SHOTSTACK_ENV ?? 'stage'
export const SHOTSTACK_API_URL = `https://api.shotstack.io`

// Client-side Directus URL for asset URLs in the browser
export const PUBLIC_DIRECTUS_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'

// Storage management
export const STORAGE_TOTAL_GB = 10
export const STORAGE_CLEANUP_THRESHOLD = 0.8 // trigger cleanup at 80%
export const STORAGE_MAX_PROJECTS = 10

// Render polling
export const POLL_INITIAL_INTERVAL_MS = 3_000
export const POLL_MAX_INTERVAL_MS = 15_000
export const POLL_BACKOFF_MULTIPLIER = 1.5

// Mock render simulation
export const MOCK_RENDER_DURATION_MS = 10_000
export const MOCK_RENDER_TICK_MS = 500

// Upload limits
export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024 * 1024 // 2GB

// Video statuses (used for badge coloring and filtering)
export const VIDEO_STATUS_LABELS = {
  new: 'New',
  rendering: 'Rendering',
  ready: 'Ready',
  error: 'Error',
} as const
