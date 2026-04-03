import { type NextRequest } from 'next/server'
import { getVideo, getTemplate, updateVideo, createRenderJob } from '@/lib/directus'
import { submitRender } from '@/lib/shotstack'
import { RenderRequestSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RenderRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { videoId, templateId } = parsed.data

  const video = await getVideo(videoId)
  if (!video) {
    return Response.json({ error: 'Video not found' }, { status: 404 })
  }

  const template = await getTemplate(templateId)
  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 })
  }

  // Build callback URL for Shotstack to notify us when render completes
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const callbackUrl = `${appUrl}/api/webhooks/shotstack`

  // Submit to Shotstack Edit API
  const shotstackResponse = await submitRender(template.shotstack_json, callbackUrl)
  const shotstackRenderId = shotstackResponse.response.id

  // Create local render job record linked to Shotstack render ID
  const job = await createRenderJob({
    video_id: videoId,
    shotstack_render_id: shotstackRenderId,
  })

  // Update video status
  await updateVideo(videoId, {
    status: 'rendering',
    template_id: templateId,
    render_id: job.id,
  })

  return Response.json({ renderId: job.id, status: job.status }, { status: 202 })
}
