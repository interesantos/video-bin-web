import { STORAGE_CLEANUP_THRESHOLD, STORAGE_MAX_PROJECTS, STORAGE_TOTAL_GB } from './constants'
import { getStorageUsage as directusGetStorageUsage, cleanupOldVideos } from './directus'
import type { StorageQuota } from './types'

export async function getStorageUsage(): Promise<StorageQuota> {
  return directusGetStorageUsage(STORAGE_TOTAL_GB)
}

export async function shouldCleanup(thresholdPercent = STORAGE_CLEANUP_THRESHOLD): Promise<boolean> {
  const usage = await getStorageUsage()
  return usage.percentUsed / 100 >= thresholdPercent
}

export async function cleanupOldProjects(
  keepCount = STORAGE_MAX_PROJECTS
): Promise<{ deleted: number; remaining: number }> {
  return cleanupOldVideos(keepCount)
}
