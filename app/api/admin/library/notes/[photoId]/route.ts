import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getPhotoNote, updatePhotoNote } from '@/lib/admin/notes-service'

interface RouteContext {
  params: {
    photoId: string
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const record = await getPhotoNote(guard.adminUserId, context.params.photoId)
  if (!record) {
    return NextResponse.json({ error: '未找到照片' }, { status: 404 })
  }

  return NextResponse.json({
    photoId: record.photoId,
    note: record.note,
    updatedAt: record.updatedAt.toISOString(),
  })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await request.json().catch(() => null)
  const note = typeof body?.note === 'string' ? body.note : ''

  try {
    const record = await updatePhotoNote(guard.adminUserId, context.params.photoId, note)
    return NextResponse.json({
      photoId: record.photoId,
      note: record.note,
      updatedAt: record.updatedAt.toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 400 })
  }
}
