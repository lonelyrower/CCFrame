import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getLibraryWorkflow, updateWorkflowStage } from '@/lib/admin/library-service'
import type { LibraryWorkflowStage } from '@/types/library'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const workflow = await getLibraryWorkflow(guard.adminUserId)
  return NextResponse.json(workflow)
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await request.json()
  const photoId: string | undefined = body?.photoId
  const stage: LibraryWorkflowStage | undefined = body?.stage

  if (!photoId || !stage) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 })
  }

  await updateWorkflowStage(guard.adminUserId, photoId, stage)
  return NextResponse.json({ success: true })
}
