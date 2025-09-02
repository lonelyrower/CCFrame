import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result: any = {
    ok: true,
    services: {
      db: false,
      storage: false,
    },
  }

  // Check database connectivity
  try {
    await db.$queryRaw`SELECT 1`
    result.services.db = true
  } catch (e) {
    result.ok = false
    result.services.db = false
    result.dbError = e instanceof Error ? e.message : String(e)
  }

  // Check storage (non-fatal)
  try {
    const storage = getStorageManager()
    // Generate a short-lived presign for a non-existing object to validate signing works
    await storage.getPresignedDownloadUrl('healthcheck/non-existent')
    result.services.storage = true
  } catch (e) {
    // Storage failure should not block overall health if DB is up, but report it
    result.services.storage = false
    result.storageError = e instanceof Error ? e.message : String(e)
  }

  const status = result.ok ? 200 : 503
  return NextResponse.json(result, { status })
}

