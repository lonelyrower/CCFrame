import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getLibrarySummary } from '@/lib/admin/library-service'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const summary = await getLibrarySummary(guard.adminUserId)
  return NextResponse.json(summary)
}
