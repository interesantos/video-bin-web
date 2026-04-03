import { type NextRequest } from 'next/server'
import { createVideo, updateVideo } from '@/lib/directus'
import { createUpload, getSource, ingestSource, submitThumbnailRender, getRenderStatus } from '@/lib/shotstack'
import { MAX_UPLOAD_SIZE_BYTES } from '@/lib/constants'

/**
 * POST /api/upload/direct
 *
 * Single-request upload for iPhone Shortcuts and simple HTTP clients.
 *
 * Accepts two formats:
 *   1. multipart/form-data with field "file" (+ optional "title")
 *   2. Raw binary body (any content-type with video data)
 */
export async function POST(request: NextRequest) {
  let fileBuffer: ArrayBuffer
  let fileName = 'Untitled'
  let fileType = 'video/mp4'
  let fileSize = 0
  let title = ''

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    // ── Form upload ──────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return Response.json({ error: 'Invalid form data' }, { status: 400 })
    }

    let file: File | null = null
    for (const [, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        file = value
        break
      }
    }
    if (!file) {
      return Response.json({ error: 'Missing file in form data' }, { status: 422 })
    }

    fileBuffer = await file.arrayBuffer()
    fileName = file.name || 'Untitled'
    fileType = file.type || 'video/mp4'
    fileSize = file.size
    title = (formData.get('title') as string) || (formData.get('name') as string) || ''
  } else {
    // ── Raw binary body (Shortcuts "File" mode) ──────────────
    const body = await request.arrayBuffer()
    if (!body || body.byteLength === 0) {
      return Response.json({ error: 'Empty request body' }, { status: 422 })
    }

    fileBuffer = body
    fileSize = body.byteLength
    fileType = contentType || 'video/mp4'
    // Try to get title from query param or header
    title = request.nextUrl.searchParams.get('title') ?? ''
    fileName = request.nextUrl.searchParams.get('filename') ?? 'iPhone Video'
  }

  if (!title) {
    title = fileName.replace(/\.[^.]+$/, '') || 'Untitled'
  }

  if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
    return Response.json(
      { error: `File too large. Maximum size is ${MAX_UPLOAD_SIZE_BYTES / (1024 ** 3)} GB` },
      { status: 413 }
    )
  }

  // 1. Get signed upload URL from Shotstack
  const upload = await createUpload()
  const uploadUrl = upload.data.attributes.url
  const ingestId = upload.data.id

  // 2. PUT the file to Shotstack S3
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': fileType,
      'x-amz-acl': 'public-read',
    },
    body: fileBuffer,
  })

  if (!putRes.ok) {
    return Response.json({ error: 'Failed to upload to storage' }, { status: 502 })
  }

  // 3. Poll Shotstack for the source URL + thumbnail (retry up to ~20s)
  let sourceUrl: string | undefined
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

  // 4. Create Directus video record
  const video = await createVideo({ title, filesize: fileSize })

  const updates: Record<string, string> = {}
  if (sourceUrl) updates.source_url = sourceUrl
  updates.ingest_id = ingestId
  await updateVideo(video.id, updates as Parameters<typeof updateVideo>[1])

  // 5. Re-ingest for H.264 proxy (background)
  if (sourceUrl) {
    ingestSource(sourceUrl)
      .then(async (result) => {
        try {
          await updateVideo(video.id, { ingest_id: result.data.id } as Parameters<typeof updateVideo>[1])
        } catch { /* non-blocking */ }
      })
      .catch((err) => console.error('Proxy ingest failed:', err))

    // 6. Generate thumbnail via Edit API (background)
    submitThumbnailRender(sourceUrl)
      .then(async (renderRes) => {
        const renderId = renderRes.response.id
        // Poll for completion (up to ~30s)
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 2000))
          try {
            const status = await getRenderStatus(renderId)
            if (status.response.status === 'done' && status.response.url) {
              await updateVideo(video.id, { thumbnail_url: status.response.url } as Parameters<typeof updateVideo>[1])
              return
            }
            if (status.response.status === 'failed') return
          } catch { /* retry */ }
        }
      })
      .catch((err) => console.error('Thumbnail render failed:', err))
  }

  return Response.json({ id: video.id, title: video.title, status: video.status }, { status: 201 })
}
