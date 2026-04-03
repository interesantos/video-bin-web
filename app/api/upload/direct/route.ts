import { type NextRequest } from 'next/server'
import { createVideo, updateVideo } from '@/lib/directus'
import { createUpload, getSource, ingestSource } from '@/lib/shotstack'
import { MAX_UPLOAD_SIZE_BYTES } from '@/lib/constants'

/**
 * POST /api/upload/direct
 *
 * Single-request upload via multipart/form-data.
 * Designed for iPhone Shortcuts and simple HTTP clients.
 *
 * Form fields:
 *   - file: video file (required)
 *   - title: string (optional, defaults to filename)
 */
export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return Response.json({ error: 'Missing file' }, { status: 422 })
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return Response.json(
      { error: `File too large. Maximum size is ${MAX_UPLOAD_SIZE_BYTES / (1024 ** 3)} GB` },
      { status: 413 }
    )
  }

  const title = (formData.get('title') as string) || file.name.replace(/\.[^.]+$/, '') || 'Untitled'

  // 1. Get signed upload URL from Shotstack
  const upload = await createUpload()
  const uploadUrl = upload.data.attributes.url
  const ingestId = upload.data.id

  // 2. PUT the file to Shotstack S3
  const buffer = await file.arrayBuffer()
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'video/mp4',
      'x-amz-acl': 'public-read',
    },
    body: buffer,
  })

  if (!putRes.ok) {
    return Response.json({ error: 'Failed to upload to storage' }, { status: 502 })
  }

  // 3. Poll Shotstack for the source URL (retry up to ~20s)
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
  const video = await createVideo({ title, filesize: file.size })

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
  }

  return Response.json({ id: video.id, title: video.title, status: video.status }, { status: 201 })
}
