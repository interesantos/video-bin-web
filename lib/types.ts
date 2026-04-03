export type VideoStatus = 'new' | 'rendering' | 'ready' | 'error'
export type RenderStatus = 'queued' | 'rendering' | 'done' | 'failed'

export interface DirectusFile {
  id: string
  filename_download: string
  filesize: number
  type: string
  uploaded_on: string
  width?: number
  height?: number
  duration?: number
}

export interface Video {
  id: string
  title: string
  status: VideoStatus
  duration?: number
  raw_file?: string
  edited_file?: string
  template_id?: string
  render_id?: string
  error_message?: string
  created_at: string
  updated_at: string
  // Shotstack ingest
  ingest_id?: string
  proxy_url?: string
  // Populated from Directus joins
  raw_file_url?: string
  edited_file_url?: string
  thumbnail_url?: string
  filesize?: number
}

export interface Template {
  id: string
  name: string
  description?: string
  thumbnail?: string
  thumbnail_url?: string
  shotstack_json: EditJSON
  is_favorite: boolean
  use_count: number
  created_at: string
  updated_at: string
}

export interface RenderJob {
  id: string
  video_id: string
  shotstack_render_id?: string
  status: RenderStatus
  progress: number
  error_message?: string
  render_time?: number
  output_url?: string
  created_at: string
  completed_at?: string
}

export interface StorageQuota {
  totalGB: number
  usedGB: number
  availableGB: number
  videoCount: number
  percentUsed: number
}

// Shotstack Edit JSON — minimal shape; SDK provides full types
export interface EditJSON {
  timeline: {
    tracks: Track[]
    background?: string
    soundtrack?: Soundtrack
  }
  output: {
    format: string
    resolution?: string
    size?: { width: number; height: number }
    fps?: number
  }
  [key: string]: unknown
}

export interface Track {
  clips: Clip[]
  [key: string]: unknown
}

export interface Clip {
  asset: VideoAsset | ImageAsset | TitleAsset | AudioAsset
  start: number
  length: number | 'auto'
  transition?: { in?: string; out?: string }
  effect?: string
  filter?: string
  opacity?: number
  [key: string]: unknown
}

export interface VideoAsset {
  type: 'video'
  src: string
  trim?: number
  volume?: number
  [key: string]: unknown
}

export interface ImageAsset {
  type: 'image'
  src: string
  [key: string]: unknown
}

export interface TitleAsset {
  type: 'title'
  text: string
  style?: string
  color?: string
  size?: string
  [key: string]: unknown
}

export interface AudioAsset {
  type: 'audio'
  src: string
  trim?: number
  volume?: number
  [key: string]: unknown
}

export interface Soundtrack {
  src: string
  effect?: string
  volume?: number
}

// API request/response shapes
export interface CreateVideoRequest {
  title: string
  duration?: number
}

export interface UpdateVideoRequest {
  title?: string
  status?: VideoStatus
  template_id?: string
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  shotstack_json: EditJSON
  is_favorite?: boolean
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  shotstack_json?: EditJSON
  is_favorite?: boolean
}

export interface RenderRequest {
  videoId: string
  templateId: string
}

export interface WebhookPayload {
  renderId: string
  status: RenderStatus
  progress?: number
  outputUrl?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface ApiError {
  error: string
  details?: string
}
