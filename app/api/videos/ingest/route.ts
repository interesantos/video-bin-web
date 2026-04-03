import { type NextRequest } from 'next/server'
import { getVideo, updateVideo } from '@/lib/directus'
import { getSource } from '@/lib/shotstack'

/**
 * POST /api/videos/ingest — poll Shotstack ingest status for a video
 * and update source_url/proxy_url when ready.
 *
 * Body: { videoId: string }
 */
export async function POST(request: NextRequest) {
  let body: { videoId?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { videoId } = body
  if (!videoId) {
    return Response.json({ error: 'Missing videoId' }, { status: 422 })
  }

  const video = await getVideo(videoId)
  if (!video) {
    return Response.json({ error: 'Video not found' }, { status: 404 })
  }

  // Already has proxy URL
  if (video.proxy_url) {
    return Response.json({
      status: 'ready',
      source_url: video.raw_file_url,
      proxy_url: video.proxy_url,
    })
  }

  // No ingest ID — nothing to poll
  if (!video.ingest_id) {
    return Response.json({ status: 'none' })
  }

  try {
    const source = await getSource(video.ingest_id)
    const attrs = source.data.attributes

    if (attrs.status === 'ready') {
      const updates: Record<string, string> = {}

      if (attrs.source) {
        updates.source_url = attrs.source
      }

      // Find the ready proxy rendition
      const renditions = attrs.outputs?.renditions ?? []
      const readyProxy = renditions.find((r) => r.status === 'ready' && r.url)
      if (readyProxy?.url) {
        updates.proxy_url = readyProxy.url
      }

      if (Object.keys(updates).length) {
        await updateVideo(video.id, updates as Parameters<typeof updateVideo>[1])
      }

      return Response.json({
        status: 'ready',
        source_url: attrs.source,
        proxy_url: readyProxy?.url,
      })
    }

    if (attrs.status === 'failed') {
      return Response.json({ status: 'failed' })
    }

    // Still processing
    return Response.json({ status: attrs.status })
  } catch (err) {
    console.error('Ingest poll failed:', err)
    return Response.json({ status: 'error' }, { status: 500 })
  }
}
