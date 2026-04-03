import type { Video, Template, RenderJob, StorageQuota } from './types'
import { MOCK_RENDER_DURATION_MS, MOCK_RENDER_TICK_MS, STORAGE_TOTAL_GB } from './constants'

// ── Seed helpers ─────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString()
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function makeEditJSON() {
  return {
    timeline: {
      tracks: [
        {
          clips: [
            {
              asset: { type: 'video' as const, src: 'mock://placeholder.mp4' },
              start: 0,
              length: 10,
            },
          ],
        },
      ],
    },
    output: {
      format: 'mp4',
      resolution: 'hd',
      size: { width: 1080, height: 1920 },
      fps: 30,
    },
  }
}

// ── In-memory store ───────────────────────────────────────────────────────────

const videos: Video[] = [
  {
    id: 'v-001',
    title: 'Summer Vacation Highlights',
    status: 'ready',
    duration: 180,
    raw_file: 'file-001',
    edited_file: 'file-001-edited',
    filesize: 250 * 1024 * 1024,
    thumbnail_url: undefined,
    created_at: daysAgo(7),
    updated_at: daysAgo(5),
  },
  {
    id: 'v-002',
    title: 'Birthday Party 2024',
    status: 'ready',
    duration: 120,
    raw_file: 'file-002',
    edited_file: 'file-002-edited',
    filesize: 180 * 1024 * 1024,
    thumbnail_url: undefined,
    created_at: daysAgo(14),
    updated_at: daysAgo(13),
  },
  {
    id: 'v-003',
    title: 'Beach Walk Vlog',
    status: 'rendering',
    duration: 60,
    raw_file: 'file-003',
    filesize: 85 * 1024 * 1024,
    thumbnail_url: undefined,
    created_at: daysAgo(1),
    updated_at: daysAgo(0),
  },
  {
    id: 'v-004',
    title: 'Morning Run',
    status: 'new',
    raw_file: 'file-004',
    filesize: 120 * 1024 * 1024,
    thumbnail_url: undefined,
    created_at: daysAgo(0),
    updated_at: daysAgo(0),
  },
  {
    id: 'v-005',
    title: 'Family Christmas',
    status: 'error',
    duration: 240,
    raw_file: 'file-005',
    filesize: 320 * 1024 * 1024,
    error_message: 'Render failed: codec error',
    thumbnail_url: undefined,
    created_at: daysAgo(30),
    updated_at: daysAgo(29),
  },
]

const templates: Template[] = [
  {
    id: 't-001',
    name: 'Vertical Story',
    description: 'Full-screen vertical format for social stories',
    shotstack_json: makeEditJSON(),
    is_favorite: true,
    use_count: 12,
    created_at: daysAgo(20),
    updated_at: daysAgo(10),
  },
  {
    id: 't-002',
    name: 'Quick Cut',
    description: 'Fast-paced montage with beat-synced cuts',
    shotstack_json: makeEditJSON(),
    is_favorite: false,
    use_count: 5,
    created_at: daysAgo(15),
    updated_at: daysAgo(15),
  },
  {
    id: 't-003',
    name: 'Slideshow',
    description: 'Clean photo/video slideshow with fade transitions',
    shotstack_json: makeEditJSON(),
    is_favorite: true,
    use_count: 8,
    created_at: daysAgo(10),
    updated_at: daysAgo(3),
  },
]

const renders: RenderJob[] = []

// ── ID generation ─────────────────────────────────────────────────────────────

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

// ── Video CRUD ────────────────────────────────────────────────────────────────

export function mockGetVideos(opts: {
  limit?: number
  offset?: number
  sort?: string
}) {
  const { limit = 20, offset = 0, sort = '-created_at' } = opts

  const sorted = [...videos].sort((a, b) => {
    switch (sort) {
      case 'title':
        return a.title.localeCompare(b.title)
      case '-title':
        return b.title.localeCompare(a.title)
      case 'created_at':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case '-created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return {
    data: sorted.slice(offset, offset + limit),
    total: videos.length,
    limit,
    offset,
  }
}

export function mockGetVideo(id: string): Video | undefined {
  return videos.find((v) => v.id === id)
}

export function mockCreateVideo(data: {
  title: string
  duration?: number
  filesize?: number
  filename?: string
}): Video {
  const video: Video = {
    id: newId('v'),
    title: data.title,
    status: 'new',
    duration: data.duration,
    filesize: data.filesize,
    raw_file: data.filename ? `file-${newId('f')}` : undefined,
    created_at: now(),
    updated_at: now(),
  }
  videos.unshift(video)
  return video
}

export function mockUpdateVideo(
  id: string,
  data: Partial<Pick<Video, 'title' | 'status' | 'template_id' | 'render_id' | 'error_message' | 'edited_file'>>
): Video | undefined {
  const idx = videos.findIndex((v) => v.id === id)
  if (idx === -1) return undefined
  videos[idx] = { ...videos[idx], ...data, updated_at: now() }
  return videos[idx]
}

export function mockDeleteVideo(id: string): boolean {
  const idx = videos.findIndex((v) => v.id === id)
  if (idx === -1) return false
  videos.splice(idx, 1)
  return true
}

// ── Template CRUD ─────────────────────────────────────────────────────────────

export function mockGetTemplates(opts: {
  limit?: number
  offset?: number
  is_favorite?: boolean
}) {
  const { limit = 20, offset = 0, is_favorite } = opts

  let filtered = [...templates]
  if (is_favorite !== undefined) {
    filtered = filtered.filter((t) => t.is_favorite === is_favorite)
  }
  // Favorites first, then by created_at desc
  filtered.sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  }
}

export function mockGetTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id)
}

export function mockCreateTemplate(data: {
  name: string
  description?: string
  shotstack_json: Template['shotstack_json']
  is_favorite?: boolean
}): Template {
  const template: Template = {
    id: newId('t'),
    name: data.name,
    description: data.description,
    shotstack_json: data.shotstack_json,
    is_favorite: data.is_favorite ?? false,
    use_count: 0,
    created_at: now(),
    updated_at: now(),
  }
  templates.unshift(template)
  return template
}

export function mockUpdateTemplate(
  id: string,
  data: Partial<Pick<Template, 'name' | 'description' | 'shotstack_json' | 'is_favorite'>>
): Template | undefined {
  const idx = templates.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  templates[idx] = { ...templates[idx], ...data, updated_at: now() }
  return templates[idx]
}

export function mockDeleteTemplate(id: string): boolean {
  const idx = templates.findIndex((t) => t.id === id)
  if (idx === -1) return false
  templates.splice(idx, 1)
  return true
}

// ── Render jobs ───────────────────────────────────────────────────────────────

export function mockGetRender(id: string): RenderJob | undefined {
  return renders.find((r) => r.id === id)
}

export function mockGetRendersForVideo(videoId: string): RenderJob[] {
  return renders
    .filter((r) => r.video_id === videoId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function mockSubmitRender(videoId: string, templateId: string): RenderJob {
  const video = mockGetVideo(videoId)

  const job: RenderJob = {
    id: newId('r'),
    video_id: videoId,
    status: 'queued',
    progress: 0,
    created_at: now(),
  }
  renders.unshift(job)

  // Update video status — set render_id immediately so RenderHistory can track in-progress renders
  mockUpdateVideo(videoId, { status: 'rendering', template_id: templateId, render_id: job.id })

  // Increment use_count on template
  const tidx = templates.findIndex((t) => t.id === templateId)
  if (tidx !== -1) templates[tidx].use_count++

  // Simulate progress over MOCK_RENDER_DURATION_MS
  const tickCount = MOCK_RENDER_DURATION_MS / MOCK_RENDER_TICK_MS
  const progressPerTick = 100 / tickCount
  let ticks = 0

  const interval = setInterval(() => {
    const ridx = renders.findIndex((r) => r.id === job.id)
    if (ridx === -1) {
      clearInterval(interval)
      return
    }

    ticks++
    const progress = Math.min(Math.round(ticks * progressPerTick), 99)

    if (ticks >= tickCount) {
      clearInterval(interval)
      const completedAt = now()
      renders[ridx] = {
        ...renders[ridx],
        status: 'done',
        progress: 100,
        output_url: `mock://renders/${job.id}/output.mp4`,
        render_time: MOCK_RENDER_DURATION_MS,
        completed_at: completedAt,
      }
      mockUpdateVideo(videoId, {
        status: 'ready',
        render_id: job.id,
        edited_file: `edited-${job.id}`,
      })
    } else {
      renders[ridx] = { ...renders[ridx], status: 'rendering', progress }
    }
  }, MOCK_RENDER_TICK_MS)

  // Suppress unhandled-promise lint; interval is fire-and-forget
  void (video?.id)

  return job
}

// ── Storage ───────────────────────────────────────────────────────────────────

export function mockGetStorageUsage(): StorageQuota {
  const usedBytes = videos.reduce((sum, v) => sum + (v.filesize ?? 0), 0)
  const usedGB = usedBytes / (1024 ** 3)
  const totalGB = STORAGE_TOTAL_GB
  return {
    totalGB,
    usedGB: Math.round(usedGB * 100) / 100,
    availableGB: Math.round((totalGB - usedGB) * 100) / 100,
    videoCount: videos.length,
    percentUsed: Math.round((usedGB / totalGB) * 10000) / 100,
  }
}

export function mockCleanupOldVideos(keepCount: number): { deleted: number; remaining: number } {
  const sorted = [...videos].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const toDelete = sorted.slice(0, Math.max(0, videos.length - keepCount))
  let deleted = 0
  for (const v of toDelete) {
    if (mockDeleteVideo(v.id)) deleted++
  }
  return { deleted, remaining: videos.length }
}
