import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  aggregate,
} from '@directus/sdk'
import { DIRECTUS_URL, DIRECTUS_TOKEN, PUBLIC_DIRECTUS_URL } from './constants'
import type { Video, Template, RenderJob, StorageQuota, VideoStatus, RenderStatus } from './types'

// ── Directus schema ─────────────────────────────────────────────────────────

interface DirectusSchema {
  video_bin_videos: DirectusVideo[]
  video_bin_templates: DirectusTemplate[]
  video_bin_render_jobs: DirectusRenderJob[]
}

interface DirectusVideo {
  id: string
  title: string
  status: VideoStatus
  duration: number | null
  filesize: number | null
  raw_file: string | null
  edited_file: string | null
  template_id: string | null
  render_id: string | null
  error_message: string | null
  source_url: string | null
  ingest_id: string | null
  proxy_url: string | null
  thumbnail_url: string | null
  date_created: string
  date_updated: string
}

interface DirectusTemplate {
  id: string
  name: string
  description: string | null
  shotstack_json: Record<string, unknown>
  is_favorite: boolean
  use_count: number
  date_created: string
  date_updated: string
}

interface DirectusRenderJob {
  id: string
  video_id: string
  status: RenderStatus
  progress: number
  output_url: string | null
  error_message: string | null
  render_time: number | null
  completed_at: string | null
  date_created: string
}

// ── Client ──────────────────────────────────────────────────────────────────

const client = createDirectus<DirectusSchema>(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest())

// ── Mappers ─────────────────────────────────────────────────────────────────

function toVideo(d: DirectusVideo): Video {
  return {
    id: d.id,
    title: d.title,
    status: d.status,
    duration: d.duration ?? undefined,
    raw_file: d.raw_file ?? undefined,
    edited_file: d.edited_file ?? undefined,
    template_id: d.template_id ?? undefined,
    render_id: d.render_id ?? undefined,
    error_message: d.error_message ?? undefined,
    ingest_id: d.ingest_id ?? undefined,
    proxy_url: d.proxy_url ?? undefined,
    thumbnail_url: d.thumbnail_url ?? undefined,
    filesize: d.filesize ?? undefined,
    // Prefer source_url (Shotstack CDN), fall back to Directus file
    raw_file_url: d.source_url
      ?? (d.raw_file ? `${PUBLIC_DIRECTUS_URL}/assets/${d.raw_file}` : undefined),
    edited_file_url: d.edited_file
      ? `${PUBLIC_DIRECTUS_URL}/assets/${d.edited_file}`
      : undefined,
    created_at: d.date_created,
    updated_at: d.date_updated,
  }
}

function toTemplate(d: DirectusTemplate): Template {
  return {
    id: d.id,
    name: d.name,
    description: d.description ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shotstack_json: d.shotstack_json as any,
    is_favorite: d.is_favorite,
    use_count: d.use_count,
    created_at: d.date_created,
    updated_at: d.date_updated,
  }
}

function toRenderJob(d: DirectusRenderJob): RenderJob {
  return {
    id: d.id,
    video_id: d.video_id,
    status: d.status,
    progress: d.progress,
    error_message: d.error_message ?? undefined,
    render_time: d.render_time ?? undefined,
    output_url: d.output_url ?? undefined,
    created_at: d.date_created,
    completed_at: d.completed_at ?? undefined,
  }
}

// ── Video CRUD ──────────────────────────────────────────────────────────────

export async function getVideos(opts: {
  limit?: number
  offset?: number
  sort?: string
}) {
  const { limit = 20, offset = 0, sort = '-date_created' } = opts

  // Map frontend sort fields to Directus fields
  const sortField = sort
    .replace('created_at', 'date_created')
    .replace('updated_at', 'date_updated')

  const items = await client.request(
    readItems('video_bin_videos', {
      limit,
      offset,
      sort: [sortField] as never,
    })
  )

  const countResult = await client.request(
    aggregate('video_bin_videos', { aggregate: { count: '*' } })
  )
  const total = Number(countResult[0]?.count ?? items.length)

  return {
    data: items.map(toVideo),
    total,
    limit,
    offset,
  }
}

export async function getVideo(id: string): Promise<Video | undefined> {
  try {
    const item = await client.request(readItem('video_bin_videos', id))
    return toVideo(item)
  } catch {
    return undefined
  }
}

export async function createVideo(data: {
  title: string
  duration?: number
  filesize?: number
  filename?: string
}): Promise<Video> {
  const item = await client.request(
    createItem('video_bin_videos', {
      title: data.title,
      status: 'new',
      duration: data.duration ?? null,
      filesize: data.filesize ?? null,
      raw_file: null,
      edited_file: null,
      template_id: null,
      render_id: null,
      error_message: null,
    })
  )
  return toVideo(item)
}

export async function updateVideo(
  id: string,
  data: Partial<Pick<Video, 'title' | 'status' | 'template_id' | 'render_id' | 'error_message' | 'edited_file' | 'raw_file' | 'ingest_id' | 'proxy_url' | 'thumbnail_url' | 'duration'> & { source_url: string }>
): Promise<Video | undefined> {
  try {
    const item = await client.request(
      updateItem('video_bin_videos', id, data as Partial<DirectusVideo>)
    )
    return toVideo(item)
  } catch {
    return undefined
  }
}

export async function deleteVideo(id: string): Promise<boolean> {
  try {
    await client.request(deleteItem('video_bin_videos', id))
    return true
  } catch {
    return false
  }
}

// ── Template CRUD ───────────────────────────────────────────────────────────

export async function getTemplates(opts: {
  limit?: number
  offset?: number
  is_favorite?: boolean
}) {
  const { limit = 20, offset = 0, is_favorite } = opts

  const filter: Record<string, unknown> = {}
  if (is_favorite !== undefined) {
    filter.is_favorite = { _eq: is_favorite }
  }

  const items = await client.request(
    readItems('video_bin_templates', {
      limit,
      offset,
      sort: ['-is_favorite', '-date_created'] as never,
      ...(Object.keys(filter).length ? { filter } : {}),
    })
  )

  const countResult = await client.request(
    aggregate('video_bin_templates', {
      aggregate: { count: '*' },
      ...(Object.keys(filter).length ? { query: { filter } } : {}),
    })
  )
  const total = Number(countResult[0]?.count ?? items.length)

  return {
    data: items.map(toTemplate),
    total,
    limit,
    offset,
  }
}

export async function getTemplate(id: string): Promise<Template | undefined> {
  try {
    const item = await client.request(readItem('video_bin_templates', id))
    return toTemplate(item)
  } catch {
    return undefined
  }
}

export async function createTemplate(data: {
  name: string
  description?: string
  shotstack_json: Template['shotstack_json']
  is_favorite?: boolean
}): Promise<Template> {
  const item = await client.request(
    createItem('video_bin_templates', {
      name: data.name,
      description: data.description ?? null,
      shotstack_json: data.shotstack_json as Record<string, unknown>,
      is_favorite: data.is_favorite ?? false,
      use_count: 0,
    })
  )
  return toTemplate(item)
}

export async function updateTemplate(
  id: string,
  data: Partial<Pick<Template, 'name' | 'description' | 'shotstack_json' | 'is_favorite'>>
): Promise<Template | undefined> {
  try {
    const update: Partial<DirectusTemplate> = {}
    if (data.name !== undefined) update.name = data.name
    if (data.description !== undefined) update.description = data.description
    if (data.shotstack_json !== undefined) update.shotstack_json = data.shotstack_json as Record<string, unknown>
    if (data.is_favorite !== undefined) update.is_favorite = data.is_favorite

    const item = await client.request(updateItem('video_bin_templates', id, update))
    return toTemplate(item)
  } catch {
    return undefined
  }
}

export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    await client.request(deleteItem('video_bin_templates', id))
    return true
  } catch {
    return false
  }
}

// ── Render jobs ─────────────────────────────────────────────────────────────

export async function getRender(id: string): Promise<RenderJob | undefined> {
  try {
    const item = await client.request(readItem('video_bin_render_jobs', id))
    return toRenderJob(item)
  } catch {
    return undefined
  }
}

export async function getRendersForVideo(videoId: string): Promise<RenderJob[]> {
  const items = await client.request(
    readItems('video_bin_render_jobs', {
      filter: { video_id: { _eq: videoId } },
      sort: ['-date_created'] as never,
    })
  )
  return items.map(toRenderJob)
}

export async function createRenderJob(data: {
  video_id: string
  shotstack_render_id?: string
}): Promise<RenderJob> {
  const item = await client.request(
    createItem('video_bin_render_jobs', {
      video_id: data.video_id,
      status: 'queued',
      progress: 0,
      output_url: null,
      error_message: null,
      render_time: null,
      completed_at: null,
    })
  )
  return toRenderJob(item)
}

export async function updateRenderJob(
  id: string,
  data: Partial<Pick<RenderJob, 'status' | 'progress' | 'output_url' | 'error_message' | 'render_time' | 'completed_at'>>
): Promise<RenderJob | undefined> {
  try {
    const item = await client.request(
      updateItem('video_bin_render_jobs', id, data as Partial<DirectusRenderJob>)
    )
    return toRenderJob(item)
  } catch {
    return undefined
  }
}



// ── Storage ─────────────────────────────────────────────────────────────────

export async function getStorageUsage(totalGB: number): Promise<StorageQuota> {
  const items = await client.request(
    readItems('video_bin_videos', {
      fields: ['filesize'],
      limit: -1,
    })
  )

  const usedBytes = items.reduce((sum, v) => sum + (v.filesize ?? 0), 0)
  const usedGB = usedBytes / 1024 ** 3
  const videoCount = items.length

  return {
    totalGB,
    usedGB: Math.round(usedGB * 100) / 100,
    availableGB: Math.round((totalGB - usedGB) * 100) / 100,
    videoCount,
    percentUsed: Math.round((usedGB / totalGB) * 10000) / 100,
  }
}

export async function cleanupOldVideos(keepCount: number): Promise<{ deleted: number; remaining: number }> {
  const items = await client.request(
    readItems('video_bin_videos', {
      fields: ['id'],
      sort: ['date_created'] as never,
      limit: -1,
    })
  )

  const toDelete = items.slice(0, Math.max(0, items.length - keepCount))
  let deleted = 0
  for (const item of toDelete) {
    if (await deleteVideo(item.id)) deleted++
  }

  return { deleted, remaining: items.length - deleted }
}
