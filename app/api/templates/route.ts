import { type NextRequest } from 'next/server'
import { getTemplates, createTemplate } from '@/lib/directus'
import { CreateTemplateSchema, TemplateListQuerySchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = TemplateListQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
  }

  const { limit, offset, is_favorite } = parsed.data
  const isFavBool =
    is_favorite === 'true' ? true : is_favorite === 'false' ? false : undefined

  const result = await getTemplates({ limit, offset, is_favorite: isFavBool })
  return Response.json(result)
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const template = await createTemplate(parsed.data as Parameters<typeof createTemplate>[0])
  return Response.json(template, { status: 201 })
}
