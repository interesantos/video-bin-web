import { StudioContainer } from '@/components/studio/studio-container'
import { getVideo, getTemplate } from '@/lib/directus'

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ videoId?: string; templateId?: string }>
}) {
  const { videoId, templateId } = await searchParams

  const video = videoId ? ((await getVideo(videoId)) ?? null) : null
  const template = templateId ? ((await getTemplate(templateId)) ?? null) : null

  return <StudioContainer video={video} initialTemplate={template} />
}
