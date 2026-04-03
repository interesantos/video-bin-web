import { getStorageUsage, cleanupOldProjects } from '@/lib/storage'
import { STORAGE_MAX_PROJECTS } from '@/lib/constants'

export async function POST() {
  const before = await getStorageUsage()
  const result = await cleanupOldProjects(STORAGE_MAX_PROJECTS)
  const after = await getStorageUsage()

  return Response.json({
    deleted: result.deleted,
    remaining: result.remaining,
    before,
    after,
  })
}
