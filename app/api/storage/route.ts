import { getStorageUsage } from '@/lib/storage'

export async function GET() {
  const usage = await getStorageUsage()
  return Response.json(usage)
}
