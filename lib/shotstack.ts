import { SHOTSTACK_API_KEY, SHOTSTACK_ENV, SHOTSTACK_API_URL } from './constants'
import type { EditJSON } from './types'

// ── Helpers ─────────────────────────────────────────────────────────────────

function editUrl(path: string) {
  return `${SHOTSTACK_API_URL}/edit/${SHOTSTACK_ENV}${path}`
}

function serveUrl(path: string) {
  return `${SHOTSTACK_API_URL}/serve/${SHOTSTACK_ENV}${path}`
}

function ingestUrl(path: string) {
  return `${SHOTSTACK_API_URL}/ingest/${SHOTSTACK_ENV}${path}`
}

const headers: HeadersInit = {
  'x-api-key': SHOTSTACK_API_KEY,
  'Content-Type': 'application/json',
}

async function shotFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Shotstack API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── Edit API ────────────────────────────────────────────────────────────────

export interface ShotstackRenderResponse {
  success: boolean
  message: string
  response: {
    id: string
    message: string
  }
}

export interface ShotstackRenderStatus {
  success: boolean
  message: string
  response: {
    id: string
    owner: string
    status: 'queued' | 'fetching' | 'rendering' | 'saving' | 'done' | 'failed'
    url?: string
    error?: string
    created: string
    updated: string
  }
}

export async function submitRender(
  editJson: EditJSON,
  callbackUrl?: string
): Promise<ShotstackRenderResponse> {
  const body: Record<string, unknown> = { ...editJson }
  if (callbackUrl) body.callback = callbackUrl

  return shotFetch<ShotstackRenderResponse>(editUrl('/render'), {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getRenderStatus(renderId: string): Promise<ShotstackRenderStatus> {
  return shotFetch<ShotstackRenderStatus>(editUrl(`/render/${renderId}`))
}

/**
 * Submit a lightweight render to extract a single frame as a JPG thumbnail.
 * Uses the Edit API since the Ingest API only supports video renditions.
 */
export async function submitThumbnailRender(
  videoUrl: string
): Promise<ShotstackRenderResponse> {
  return shotFetch<ShotstackRenderResponse>(editUrl('/render'), {
    method: 'POST',
    body: JSON.stringify({
      timeline: {
        tracks: [{
          clips: [{
            asset: { type: 'video', src: videoUrl, trim: 1 },
            start: 0,
            length: 1,
          }],
        }],
      },
      output: {
        format: 'jpg',
        size: { width: 360, height: 640 },
      },
    }),
  })
}

// ── Serve API ───────────────────────────────────────────────────────────────

export interface ShotstackAsset {
  type: string
  attributes: {
    id: string
    owner: string
    region: string
    renderId: string
    filename: string
    url: string
    status: string
    created: string
    updated: string
  }
}

export interface ShotstackAssetsResponse {
  data: ShotstackAsset[]
}

export async function getAssets(renderId: string): Promise<ShotstackAssetsResponse> {
  return shotFetch<ShotstackAssetsResponse>(serveUrl(`/assets/render/${renderId}`))
}

export async function deleteServeAsset(assetId: string): Promise<void> {
  await fetch(serveUrl(`/assets/${assetId}`), {
    method: 'DELETE',
    headers,
  })
}

// ── Ingest API ──────────────────────────────────────────────────────────────

export interface ShotstackSourceAttributes {
  id: string
  owner: string
  input: string
  status: 'queued' | 'importing' | 'ready' | 'failed'
  source: string
  outputs?: {
    renditions?: Array<{
      id: string
      status: string
      url?: string
      width?: number
      height?: number
      duration?: number
      fps?: number
    }>
  }
  created: string
  updated: string
}

export interface ShotstackSourceResponse {
  data: {
    type: string
    id: string
    attributes: ShotstackSourceAttributes
  }
}

/**
 * Ingest a video from a URL and request an H.264 proxy rendition.
 */
export async function ingestSource(url: string): Promise<ShotstackSourceResponse> {
  return shotFetch<ShotstackSourceResponse>(ingestUrl('/sources'), {
    method: 'POST',
    body: JSON.stringify({
      url,
      outputs: {
        renditions: [
          {
            format: 'mp4',
            resolution: 'preview',
            fit: 'contain',
            filename: 'proxy',
          },
        ],
      },
    }),
  })
}

export async function getSource(id: string): Promise<ShotstackSourceResponse> {
  return shotFetch<ShotstackSourceResponse>(ingestUrl(`/sources/${id}`))
}

export async function deleteSource(id: string): Promise<void> {
  await fetch(ingestUrl(`/sources/${id}`), {
    method: 'DELETE',
    headers,
  })
}

// ── Direct Upload ──────────────────────────────────────────────────────────

export interface ShotstackUploadResponse {
  data: {
    type: string
    id: string
    attributes: {
      id: string
      url: string  // signed S3 PUT URL
      expires: string
    }
  }
}

/**
 * Request a signed upload URL from Shotstack. The client PUTs the file
 * directly to this URL. Requests an H.264 proxy rendition automatically.
 */
export async function createUpload(): Promise<ShotstackUploadResponse> {
  return shotFetch<ShotstackUploadResponse>(ingestUrl('/upload'), {
    method: 'POST',
    body: JSON.stringify({
      outputs: {
        renditions: [
          {
            format: 'mp4',
            resolution: 'preview',
            fit: 'contain',
            filename: 'proxy',
          },
        ],
      },
    }),
  })
}

// ── Status mapping ──────────────────────────────────────────────────────────

/** Map Shotstack render statuses to our internal RenderStatus */
export function mapRenderStatus(
  shotstackStatus: ShotstackRenderStatus['response']['status']
): 'queued' | 'rendering' | 'done' | 'failed' {
  switch (shotstackStatus) {
    case 'queued':
    case 'fetching':
      return 'queued'
    case 'rendering':
    case 'saving':
      return 'rendering'
    case 'done':
      return 'done'
    case 'failed':
      return 'failed'
  }
}
