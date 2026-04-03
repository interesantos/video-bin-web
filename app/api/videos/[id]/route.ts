import { type NextRequest } from 'next/server'
import { getVideo, updateVideo, deleteVideo } from '@/lib/directus'
import { deleteSource } from '@/lib/shotstack'
import { UpdateVideoSchema } from '@/lib/schemas'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const video = await getVideo(id)
  if (!video) {
    return Response.json({ error: 'Video not found' }, { status: 404 })
  }
  return Response.json(video)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const video = await getVideo(id)
  if (!video) {
    return Response.json({ error: 'Video not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = UpdateVideoSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const updated = await updateVideo(id, parsed.data)
  return Response.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const video = await getVideo(id)
  if (!video) {
    return Response.json({ error: 'Video not found' }, { status: 404 })
  }

  // Delete Directus record first
  const deleted = await deleteVideo(id)
  if (!deleted) {
    return Response.json({ error: 'Failed to delete video' }, { status: 500 })
  }

  // Clean up Shotstack source files (background, non-blocking)
  if (video.ingest_id) {
    deleteSource(video.ingest_id).catch((err) =>
      console.error('Failed to delete Shotstack source:', err)
    )
  }

  return new Response(null, { status: 204 })
}
