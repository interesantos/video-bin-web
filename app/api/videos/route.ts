import { type NextRequest } from 'next/server'
import { getVideos, createVideo } from '@/lib/directus'
import { CreateVideoSchema, VideoListQuerySchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = VideoListQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
  }
  const { limit, offset, sort } = parsed.data
  const result = await getVideos({ limit, offset, sort })
  return Response.json(result)
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateVideoSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const video = await createVideo(parsed.data)
  return Response.json(video, { status: 201 })
}
