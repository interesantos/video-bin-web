import { type NextRequest } from 'next/server'
import { createVideo, updateVideo } from '@/lib/directus'
import { createUpload, getSource, ingestSource } from '@/lib/shotstack'
import { MAX_UPLOAD_SIZE_BYTES } from '@/lib/constants'

/**
 * POST /api/upload
 *
 * Two modes:
 *
 * 1. action=sign — returns a signed Shotstack S3 URL + source ID.
 *    Client PUTs the file directly to Shotstack (no server relay).
 *    Body: { action: "sign", filename: string, filesize: number }
 *
 * 2. action=confirm — creates the Directus video record
 *    after client finishes uploading to Shotstack.
 *    Polls for source URL, then re-ingests via URL to create H.264 proxy.
 *    Body: { action: "confirm", title: string, filesize: number, ingestId: string }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = body.action as string

  // ── Step 1: Get signed upload URL ──────────────────────────────────────
  if (action === 'sign') {
    const filesize = body.filesize as number | undefined
    if (filesize && filesize > MAX_UPLOAD_SIZE_BYTES) {
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_UPLOAD_SIZE_BYTES / (1024 ** 3)} GB` },
        { status: 413 }
      )
    }

    const upload = await createUpload()

    return Response.json({
      uploadUrl: upload.data.attributes.url,
      ingestId: upload.data.id,
      expires: upload.data.attributes.expires,
    })
  }

  // ── Step 2: Confirm upload & create Directus record ────────────────────
  const title = body.title as string
  const filesize = body.filesize as number | undefined
  const ingestId = body.ingestId as string | undefined

  if (!title) {
    return Response.json({ error: 'Missing title' }, { status: 422 })
  }

  // Poll Shotstack for the source URL (retry up to ~20s)
  let sourceUrl: string | undefined
  if (ingestId) {
    for (let i = 0; i < 10; i++) {
      try {
        const source = await getSource(ingestId)
        const attrs = source.data.attributes
        if (attrs.status === 'ready' && attrs.source) {
          sourceUrl = attrs.source
          break
        }
        if (attrs.status === 'failed') break
      } catch { /* retry */ }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  const video = await createVideo({
    title,
    filesize: filesize ?? 0,
  })

  // Save source URL and ingest ID
  const updates: Record<string, string> = {}
  if (sourceUrl) updates.source_url = sourceUrl
  if (ingestId) updates.ingest_id = ingestId
  if (Object.keys(updates).length) {
    await updateVideo(video.id, updates as Parameters<typeof updateVideo>[1])
  }

  // Re-ingest via URL to create H.264 proxy (direct upload doesn't generate renditions).
  // This runs in the background — proxy_url will be set when polled later.
  if (sourceUrl) {
    ingestSource(sourceUrl)
      .then(async (result) => {
        const proxyIngestId = result.data.id
        try {
          await updateVideo(video.id, { ingest_id: proxyIngestId } as Parameters<typeof updateVideo>[1])
        } catch { /* non-blocking */ }
      })
      .catch((err) => console.error('Proxy ingest failed (non-blocking):', err))
  }

  return Response.json(video, { status: 201 })
}
