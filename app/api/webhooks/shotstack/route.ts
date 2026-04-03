import { type NextRequest } from 'next/server'
import { getRender, updateRenderJob, updateVideo } from '@/lib/directus'
import { mapRenderStatus } from '@/lib/shotstack'
import { WebhookPayloadSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const parsed = WebhookPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return new Response('Invalid webhook payload', { status: 400 })
  }

  const { renderId, status, progress, outputUrl, error } = parsed.data
  const mappedStatus = mapRenderStatus(status as Parameters<typeof mapRenderStatus>[0])

  // Find the local render job by Shotstack render ID
  const render = await getRender(renderId)
  if (!render) {
    // Accept anyway — render may have been cleaned up
    return new Response('OK', { status: 200 })
  }

  // Update render job record
  await updateRenderJob(render.id, {
    status: mappedStatus,
    progress: progress ?? (mappedStatus === 'done' ? 100 : undefined),
    output_url: outputUrl,
    error_message: error,
    completed_at: mappedStatus === 'done' || mappedStatus === 'failed'
      ? new Date().toISOString()
      : undefined,
  })

  // Update video status
  if (render.video_id) {
    if (mappedStatus === 'done') {
      await updateVideo(render.video_id, { status: 'ready' })
    } else if (mappedStatus === 'failed') {
      await updateVideo(render.video_id, {
        status: 'error',
        error_message: error ?? 'Render failed',
      })
    }
  }

  return new Response('OK', { status: 200 })
}
