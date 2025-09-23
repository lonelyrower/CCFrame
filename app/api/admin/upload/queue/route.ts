import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getUploadQueueSnapshot } from '@/lib/admin/upload-service'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const snapshot = await getUploadQueueSnapshot()
  return NextResponse.json(snapshot)
}
