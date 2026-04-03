@AGENTS.md

# Git

- **Repo**: `interesantos/video-bin-web` on GitHub.
- **Pushing**: Use `git push` via Bash.

# Project Stack

- **CMS/Backend**: Directus at `data.samui-bikes.com` — always use `@directus/sdk` via `lib/directus.ts`. Never use raw fetch against Directus.
- **Video Rendering**: Shotstack cloud API — always use `lib/shotstack.ts`. Never use ShotTower.
- **Studio Editor**: `@shotstack/shotstack-studio` npm package — imported dynamically in `hooks/useStudio.ts`. Never load via CDN script.
- **Directus Collections**: `video_bin_videos`, `video_bin_templates`, `video_bin_render_jobs` (underscores, not hyphens).
- **Auth**: Directus uses static token via `DIRECTUS_TOKEN` env var. Shotstack uses `x-api-key` via `SHOTSTACK_API_KEY` env var.
