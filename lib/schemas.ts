import { z } from 'zod'

export const CreateVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  duration: z.number().int().positive().optional(),
})

export const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['new', 'rendering', 'ready', 'error']).optional(),
  template_id: z.string().min(1).optional(),
})

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  shotstack_json: z.record(z.string(), z.unknown()),
  is_favorite: z.boolean().optional().default(false),
})

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  shotstack_json: z.record(z.string(), z.unknown()).optional(),
  is_favorite: z.boolean().optional(),
})

export const RenderRequestSchema = z.object({
  videoId: z.string().min(1, 'videoId is required'),
  templateId: z.string().min(1, 'templateId is required'),
})

export const WebhookPayloadSchema = z.object({
  renderId: z.string(),
  status: z.enum(['queued', 'rendering', 'done', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  outputUrl: z.string().url().optional(),
  error: z.string().optional(),
})

export const VideoListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort: z.enum(['created_at', '-created_at', 'title', '-title']).optional().default('-created_at'),
})

export const TemplateListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  is_favorite: z.enum(['true', 'false']).optional(),
})

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>
export type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>
export type RenderRequestInput = z.infer<typeof RenderRequestSchema>
export type WebhookPayloadInput = z.infer<typeof WebhookPayloadSchema>
export type VideoListQuery = z.infer<typeof VideoListQuerySchema>
export type TemplateListQuery = z.infer<typeof TemplateListQuerySchema>
