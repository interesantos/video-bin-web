import { type NextRequest } from 'next/server'
import { getRender, updateRenderJob } from '@/lib/directus'
import { getRenderStatus, mapRenderStatus } from '@/lib/shotstack'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const render = await getRender(id)
  if (!render) {
    return Response.json({ error: 'Render job not found' }, { status: 404 })
  }

  // If still in progress, poll Shotstack for latest status
  if (render.shotstack_render_id && (render.status === 'queued' || render.status === 'rendering')) {
    try {
      const shotStatus = await getRenderStatus(render.shotstack_render_id)
      const mappedStatus = mapRenderStatus(shotStatus.response.status)
      const progress = mappedStatus === 'done' ? 100 : mappedStatus === 'rendering' ? 50 : 0

      const update: Parameters<typeof updateRenderJob>[1] = {
        status: mappedStatus,
        progress,
      }

      if (mappedStatus === 'done' && shotStatus.response.url) {
        update.output_url = shotStatus.response.url
        update.completed_at = new Date().toISOString()
      }
      if (mappedStatus === 'failed') {
        update.error_message = shotStatus.response.error ?? 'Render failed'
        update.completed_at = new Date().toISOString()
      }

      const updated = await updateRenderJob(id, update)
      if (updated) return Response.json(updated)
    } catch {
      // Shotstack poll failed — return last known state
    }
  }

  return Response.json(render)
}
