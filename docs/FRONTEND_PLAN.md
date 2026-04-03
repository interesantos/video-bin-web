# Video Editing Platform — Frontend Architecture

## Context

Self-hosted video editing platform built on Next.js 16.2.0. Creators upload iPhone videos to Directus, edit with the embedded Shotstack Studio SDK timeline editor, and render via the Shotstack cloud API.

**All API routes use real backends** — Directus (`@directus/sdk`) for data/files and Shotstack API for rendering. No mock data layer.

### Stack

- **CMS/Backend**: Directus at `data.samui-bikes.com` via `@directus/sdk` (`lib/directus.ts`)
- **Video Rendering**: Shotstack cloud API via `lib/shotstack.ts`
- **Studio Editor**: `@shotstack/shotstack-studio` npm package, dynamically imported in `hooks/useStudio.ts`
- **Directus Collections**: `video_bin_videos`, `video_bin_templates`, `video_bin_render_jobs`
- **Auth**: Directus static token (`DIRECTUS_TOKEN`), Shotstack API key (`SHOTSTACK_API_KEY`)

### Next.js 16 Patterns

- **Async params**: `params` and `searchParams` are Promises — must `await` them in pages, layouts, and route handlers
- **`proxy.ts`** replaces `middleware.ts` — named export `proxy`, runs on Node.js runtime
- **Tailwind v4** — uses `@import "tailwindcss"` + `@theme inline {}` in globals.css, no separate config file
- **Turbopack** is default — no flags needed for `next dev` or `next build`
- **React 19.2** — View Transitions, `useEffectEvent`, Activity components available

---

## Data Layer

### `lib/directus.ts` — Directus SDK Client

Server-side only. Uses `@directus/sdk` with `createDirectus()`, `rest()`, `staticToken()`.

**Video CRUD**: `getVideos(opts)`, `getVideo(id)`, `createVideo(data)`, `updateVideo(id, data)`, `deleteVideo(id)`
**Template CRUD**: `getTemplates(opts)`, `getTemplate(id)`, `createTemplate(data)`, `updateTemplate(id, data)`, `deleteTemplate(id)`
**Render Jobs**: `getRender(id)`, `getRendersForVideo(videoId)`, `createRenderJob(data)`, `updateRenderJob(id, data)`
**Files**: `uploadFile(file)` — uploads to Directus files API, returns file ID
**Storage**: `getStorageUsage(totalGB)`, `cleanupOldVideos(keepCount)`

### `lib/shotstack.ts` — Shotstack API Client

Server-side only. Auth via `x-api-key` header against `https://api.shotstack.io`.

**Edit API**: `submitRender(editJson, callbackUrl?)` → `POST /edit/{env}/render`, `getRenderStatus(renderId)` → `GET /edit/{env}/render/{id}`
**Serve API**: `getAssets(renderId)` → `GET /serve/{env}/assets/render/{id}`
**Ingest API**: `ingestSource(url)`, `getSource(id)`
**Helpers**: `mapRenderStatus(shotstackStatus)` → maps Shotstack statuses to internal `RenderStatus`

### `lib/storage.ts` — Storage Wrapper

Wraps Directus queries: `getStorageUsage()`, `shouldCleanup()`, `cleanupOldProjects()`

---

## API Routes

All routes import from `lib/directus.ts` and `lib/shotstack.ts`.

| Route | Methods | Backend |
|-------|---------|---------|
| `/api/videos` | GET, POST | Directus |
| `/api/videos/[id]` | GET, PATCH, DELETE | Directus |
| `/api/videos/render` | POST | Directus + Shotstack Edit API |
| `/api/videos/cleanup` | POST | Directus |
| `/api/templates` | GET, POST | Directus |
| `/api/templates/[id]` | GET, PATCH, DELETE | Directus |
| `/api/upload` | POST | Directus files API |
| `/api/storage` | GET | Directus |
| `/api/renders/[id]` | GET | Directus + Shotstack status poll |
| `/api/webhooks/shotstack` | POST | Directus (updates render/video records from Shotstack callback) |

### Render flow

```
User clicks "Render" in studio
  → POST /api/videos/render { videoId, templateId }
  → Server fetches template JSON from Directus
  → Submits to Shotstack Edit API (POST /render) with callback URL
  → Creates render job in Directus (video_bin_render_jobs)
  → Frontend polls GET /api/renders/[id]
  → Server polls Shotstack GET /render/{id} for live status
  → On completion: Shotstack calls POST /api/webhooks/shotstack
  → Webhook updates Directus render + video records
  → Frontend shows download link
```

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useVideos` | Fetches `/api/videos`, auto-polls every 10s while any video is rendering |
| `useStorage` | Fetches `/api/storage` for quota display |
| `useSwipe` | Touch gesture detection for swipe-to-delete/edit |
| `useTemplates` | Template CRUD against `/api/templates` |
| `useStudio` | Shotstack Studio SDK lifecycle — dynamically imports `@shotstack/shotstack-studio`, initializes `Edit`, `Canvas`, `Timeline`, `Controls`, `UIController`. Falls back to mock mode if SDK fails |
| `useRender` | Render submission + polling with exponential backoff |

---

## Components

### UI Primitives (`components/ui/`)
`button`, `card`, `bottom-sheet`, `spinner`, `badge`, `toast`

### Dashboard (`components/dashboard/`)
`video-grid`, `video-card`, `empty-state`, `header`, `upload-button`, `storage-indicator`

### Studio (`components/studio/`)
`studio-container` — main editor layout with canvas + timeline refs for SDK
`toolbar` — action bar (back, save, load template, render, history)
`template-picker` — bottom sheet for loading saved templates
`asset-browser` — bottom sheet for adding video clips

### Render (`components/render/`)
`render-dialog` — modal with progress bar, status, download button
`render-history` — bottom sheet listing past renders for a video

---

## File Inventory

```
lib/
  types.ts              # Type definitions
  constants.ts          # Env config, thresholds, polling intervals
  schemas.ts            # Zod validation schemas
  utils.ts              # Formatting helpers
  directus.ts           # @directus/sdk client — all Directus CRUD
  shotstack.ts          # Shotstack API client — render, serve, ingest
  storage.ts            # Storage quota wrapper over Directus
  mock-data.ts          # Legacy mock store (unused — kept for reference)

hooks/
  useVideos.ts          # Video list + auto-poll
  useStorage.ts         # Storage quota
  useSwipe.ts           # Touch gestures
  useTemplates.ts       # Template CRUD
  useStudio.ts          # Shotstack Studio SDK lifecycle
  useRender.ts          # Render submit + poll

components/
  ui/
    button.tsx
    card.tsx
    bottom-sheet.tsx
    spinner.tsx
    badge.tsx
    toast.tsx
  dashboard/
    video-grid.tsx
    video-card.tsx
    empty-state.tsx
    header.tsx
    upload-button.tsx
    storage-indicator.tsx
  studio/
    studio-container.tsx
    toolbar.tsx
    template-picker.tsx
    asset-browser.tsx
  render/
    render-dialog.tsx
    render-history.tsx

app/
  page.tsx              # Dashboard
  layout.tsx            # Root layout + ToastProvider
  globals.css           # Tailwind v4 theme
  loading.tsx           # Skeleton loader
  error.tsx             # Error boundary
  not-found.tsx         # 404 page
  manifest.ts           # PWA manifest
  studio/
    page.tsx            # Studio editor (fetches from Directus)
    loading.tsx         # Studio skeleton
  api/
    videos/
      route.ts          # GET/POST → Directus
      [id]/route.ts     # GET/PATCH/DELETE → Directus
      render/route.ts   # POST → Directus + Shotstack
      cleanup/route.ts  # POST → Directus
    templates/
      route.ts          # GET/POST → Directus
      [id]/route.ts     # GET/PATCH/DELETE → Directus
    webhooks/
      shotstack/route.ts # POST → Shotstack callback handler
    upload/route.ts     # POST → Directus files
    storage/route.ts    # GET → Directus
    renders/
      [id]/route.ts     # GET → Directus + Shotstack poll

proxy.ts                # Security headers, CORS for webhooks
.env.example            # Template env vars
```

---

## Environment Variables

```env
# Server-side
DIRECTUS_URL=https://data.samui-bikes.com
DIRECTUS_TOKEN=<static-token>
SHOTSTACK_API_KEY=<api-key>
SHOTSTACK_ENV=stage              # "stage" or "v1"

# Client-side
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DIRECTUS_URL=https://data.samui-bikes.com
```

---

## Verification Checklist

| Area | Verification |
|------|-------------|
| Build | `npm run build` compiles with zero errors |
| Videos | `GET /api/videos` returns data from Directus. `POST /api/upload` uploads file to Directus |
| Templates | CRUD via `/api/templates` persists to Directus |
| Studio | Shotstack SDK initializes canvas + timeline. Template save/load works |
| Render | Click Render → submits to Shotstack API → polls for progress → shows completion with download URL |
| Webhook | Shotstack callback updates Directus render + video records |
| Storage | `/api/storage` returns real file sizes from Directus |
