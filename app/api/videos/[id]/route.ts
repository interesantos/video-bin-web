import { type NextRequest } from 'next/server'
import { getVideo, updateVideo, deleteVideo } from '@/lib/directus'
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
  const deleted = await deleteVideo(id)
  if (!deleted) {
    return Response.json({ error: 'Video not found' }, { status: 404 })
  }
  return new Response(null, { status: 204 })
}
