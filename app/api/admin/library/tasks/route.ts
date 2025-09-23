import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import {
  applyLibraryBatchAction,
  getLibraryOverview,
} from '@/lib/admin/library-service'
import type { LibraryTableQuery } from '@/types/library'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const searchParams = request.nextUrl.searchParams
  const query: LibraryTableQuery = {
    search: searchParams.get('search') ?? undefined,
    status: (searchParams.get('status') ?? undefined) as LibraryTableQuery['status'],
    visibility: (searchParams.get('visibility') ?? undefined) as LibraryTableQuery['visibility'],
    tags: searchParams.getAll('tag'),
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
  }

  const overview = await getLibraryOverview(guard.adminUserId, query)

  return NextResponse.json(overview)
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await request.json()
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: '缺少操作目标' }, { status: 400 })
  }

  if (body.action === 'visibility') {
    const visibility = body.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE'
    const result = await applyLibraryBatchAction(guard.adminUserId, {
      action: 'visibility',
      ids: body.ids,
      visibility,
    })
    return NextResponse.json(result)
  }

  if (body.action === 'album') {
    const albumId = typeof body.albumId === 'string' && body.albumId.length > 0 ? body.albumId : null
    const result = await applyLibraryBatchAction(guard.adminUserId, {
      action: 'album',
      ids: body.ids,
      albumId,
    })
    return NextResponse.json(result)
  }

  if (body.action === 'delete') {
    const result = await applyLibraryBatchAction(guard.adminUserId, {
      action: 'delete',
      ids: body.ids,
    })
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: '不支持的批量操作' }, { status: 400 })
}
