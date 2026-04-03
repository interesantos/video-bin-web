import { type NextRequest } from 'next/server'
import { getTemplate, updateTemplate, deleteTemplate } from '@/lib/directus'
import { UpdateTemplateSchema } from '@/lib/schemas'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const template = await getTemplate(id)
  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 })
  }
  return Response.json(template)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const template = await getTemplate(id)
  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = UpdateTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const updated = await updateTemplate(id, parsed.data as Parameters<typeof updateTemplate>[1])
  return Response.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const deleted = await deleteTemplate(id)
  if (!deleted) {
    return Response.json({ error: 'Template not found' }, { status: 404 })
  }
  return new Response(null, { status: 204 })
}
