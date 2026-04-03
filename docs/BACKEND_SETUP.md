# Backend Setup Checklist

Run these commands on the VPS in order. Each section is a dependency of the next.

---


## 6. Directus Collections (manual via Admin UI) [DONE]

Open http://localhost:8055/admin → Settings → Data Model.
Create two collections:

### `video_bin_videos`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | primary key (auto) |
| `title` | string | required |
| `status` | string | default `new` |
| `duration` | integer | nullable |
| `filesize` | integer | nullable |
| `raw_file` | m2o → directus_files | nullable |
| `edited_file` | m2o → directus_files | nullable |
| `template_id` | string | nullable |
| `render_id` | string | nullable |
| `error_message` | text | nullable |
| `date_created` | timestamp | auto |
| `date_updated` | timestamp | auto |

### `video_bin_templates`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | primary key (auto) |
| `name` | string | required |
| `description` | text | nullable |
| `shotstack_json` | json | required |
| `is_favorite` | boolean | default false |
| `use_count` | integer | default 0 |
| `date_created` | timestamp | auto |
| `date_updated` | timestamp | auto |

### `video_bin_render_jobs`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | primary key (auto) |
| `video_id` | m2o → videos | required |
| `status` | string | default `queued` |
| `progress` | integer | default 0 |
| `output_url` | string | nullable |
| `error_message` | text | nullable |
| `render_time` | integer | nullable (ms) |
| `completed_at` | timestamp | nullable |
| `date_created` | timestamp | auto |

After creating collections, set permissions: Settings → Roles → Public → grant Read/Write on all three collections (or create a dedicated API role).

Create a static token: Settings → Users → Admin User → Token → generate and copy.

---

## 7. Shotstack API (cloud — no self-hosting)

Shotstack is a cloud-based video rendering API. No binary to install or self-host.

### Get API keys

1. Sign up at https://dashboard.shotstack.io/
2. Copy your API keys from the dashboard:
   - **Stage key** — sandbox environment (watermarked output, free)
   - **Production key** — `v1` environment (no watermark, paid)

### API structure

Shotstack exposes three services, all authenticated via `x-api-key` header:

| Service | Base URL | Purpose |
|---------|----------|---------|
| **Edit API** | `https://api.shotstack.io/edit/{env}` | Render videos from JSON timelines |
| **Serve API** | `https://api.shotstack.io/serve/{env}` | Host and manage rendered assets |
| **Ingest API** | `https://api.shotstack.io/ingest/{env}` | Ingest source files from URLs |

`{env}` is `stage` (sandbox) or `v1` (production).

### Verify API access

```bash
# Test with your stage key
curl -s -H "x-api-key: YOUR_STAGE_KEY" \
  https://api.shotstack.io/edit/stage/templates | head -c 200
```

A successful response returns `{"success":true, ...}`.

### Render workflow

```
POST /edit/{env}/render     → Submit timeline JSON, get render ID
GET  /edit/{env}/render/{id} → Poll status: queued → rendering → done/failed
GET  /serve/{env}/assets/render/{id} → Get output URL once done
```

Alternatively, pass a `callback` URL in the render request to receive a webhook when rendering completes.

### Ingest workflow (optional — for source file pre-processing)

```
POST /ingest/{env}/sources  → Submit source URL for transcoding/transcription
GET  /ingest/{env}/sources/{id} → Poll status: queued → ingesting → ready/failed
```

---

## 8. Caddy (reverse proxy)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

`/etc/caddy/Caddyfile`:
```caddy
yourdomain.com {
    # Next.js app
    reverse_proxy localhost:3000

    # Directus on /cms subpath (optional) or separate subdomain
}

directus.yourdomain.com {
    reverse_proxy localhost:8055
}
```

```bash
sudo systemctl enable caddy
sudo systemctl restart caddy
```

---

## 9. Next.js app (production)

```bash
cd ~/video-bin
npm ci
npm run build

# Copy standalone output
cp -r .next/standalone ./deploy
cp -r .next/static ./deploy/.next/static
cp -r public ./deploy/public
```

`.env.local` (fill in real values):
```env
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=<token-from-step-6>
SHOTSTACK_API_KEY=<your-shotstack-api-key>
SHOTSTACK_ENV=stage
NEXT_PUBLIC_DIRECTUS_URL=https://directus.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

> Set `SHOTSTACK_ENV=stage` for development (free, watermarked) or `SHOTSTACK_ENV=v1` for production.

Start via PM2:
```bash
pm2 start deploy/server.js --name video-bin -- --port 3000
pm2 save
```

---

## 10. Verify end-to-end

```bash
# Services running
pm2 list

# Directus API
curl http://localhost:8055/server/info

# Shotstack API (cloud — use your key)
curl -s -H "x-api-key: $SHOTSTACK_API_KEY" \
  https://api.shotstack.io/edit/stage/templates

# Next.js
curl http://localhost:3000

# Caddy
curl https://yourdomain.com
```

---

## Quick reference — PM2 commands

```bash
pm2 list                  # show all processes
pm2 logs video-bin        # tail Next.js logs
pm2 logs directus         # tail Directus logs
pm2 restart video-bin     # restart after deploy
pm2 monit                 # live CPU/mem dashboard
```
