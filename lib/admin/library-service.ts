import { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import type {
  LibraryOverviewDto,
  LibraryTableItem,
  LibraryTableQuery,
  LibraryTableResult,
  LibraryWorkflowColumn,
  LibraryWorkflowItem,
  LibraryWorkflowStage,
  LibrarySummary,
  LibraryBatchActionResult,
} from '@/types/library'
import { recordAdminOperation } from '@/lib/observability/metrics'

const DEFAULT_PAGE_SIZE = 60

export async function getLibraryOverview(userId: string, query: LibraryTableQuery = {}): Promise<LibraryOverviewDto> {
  const [summary, table, workflow] = await Promise.all([
    getLibrarySummary(userId),
    getLibraryTable(userId, query),
    getLibraryWorkflow(userId),
  ])

  return {
    summary,
    table,
    workflow,
  }
}

export async function getLibrarySummary(userId: string): Promise<LibrarySummary> {
  const [total, published, privateCount, processing, failed] = await Promise.all([
    db.photo.count({ where: { userId } }),
    db.photo.count({ where: { userId, status: 'COMPLETED', visibility: 'PUBLIC' } }),
    db.photo.count({ where: { userId, status: 'COMPLETED', visibility: 'PRIVATE' } }),
    db.photo.count({ where: { userId, status: { in: ['UPLOADING', 'PROCESSING'] } } }),
    db.photo.count({ where: { userId, status: 'FAILED' } }),
  ])

  return {
    total,
    public: published,
    private: privateCount,
    processing,
    failed,
  }
}

export async function getLibraryTable(userId: string, query: LibraryTableQuery = {}): Promise<LibraryTableResult> {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.max(10, Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, 200))

  const where = buildPhotoWhere(userId, query)

  const [rows, total] = await Promise.all([
    db.photo.findMany({
      where,
      include: {
        album: { select: { title: true } },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        variants: {
          select: {
            variant: true,
            sizeBytes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.photo.count({ where }),
  ])

  const items: LibraryTableItem[] = rows.map((photo) => {
    const original = photo.variants.find((variant) => variant.variant === 'original')
    const sizeBytes = original?.sizeBytes ?? photo.variants.reduce((acc, variant) => Math.max(acc, variant.sizeBytes), 0)

    return {
      id: photo.id,
      title: photo.fileKey ?? null,
      fileName: photo.fileKey ?? 'unknown',
      albumTitle: photo.album?.title ?? null,
      visibility: photo.visibility as 'PUBLIC' | 'PRIVATE',
      status: photo.status,
      tags: photo.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, color: tag.color })),
      width: photo.width ?? 0,
      height: photo.height ?? 0,
      sizeBytes: sizeBytes || null,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    }
  })

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  }
}

export async function getLibraryWorkflow(userId: string): Promise<LibraryWorkflowColumn[]> {
  const photos = await db.photo.findMany({
    where: { userId },
    include: {
      album: { select: { title: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 120,
  })

  const buckets: Record<LibraryWorkflowStage, LibraryWorkflowItem[]> = {
    processing: [],
    review: [],
    published: [],
    failed: [],
  }

  for (const photo of photos) {
    const stage = resolveWorkflowStage(photo.status, photo.visibility)
    buckets[stage].push({
      id: photo.id,
      title: photo.fileKey ?? null,
      visibility: photo.visibility as 'PUBLIC' | 'PRIVATE',
      status: photo.status,
      albumTitle: photo.album?.title ?? null,
      createdAt: photo.updatedAt.toISOString(),
      thumbUrl: `/api/image/${photo.id}/thumb?format=webp`,
    })
  }

  return [
    {
      id: 'processing',
      title: '处理中',
      description: '仍在上传或后台优化的素材。',
      items: buckets.processing,
    },
    {
      id: 'review',
      title: '待审核',
      description: '等待人工确认或调色的作品。',
      items: buckets.review,
    },
    {
      id: 'published',
      title: '已发布',
      description: '已经上线并对外可见的作品。',
      items: buckets.published,
    },
    {
      id: 'failed',
      title: '异常',
      description: '上传或处理失败的素材，需要复核。',
      items: buckets.failed,
    },
  ]
}

export async function updateWorkflowStage(userId: string, photoId: string, stage: LibraryWorkflowStage) {
  const start = Date.now()
  const data: Prisma.PhotoUpdateInput = {}

  switch (stage) {
    case 'processing':
      data.status = 'PROCESSING'
      break
    case 'review':
      data.status = 'COMPLETED'
      data.visibility = 'PRIVATE'
      break
    case 'published':
      data.status = 'COMPLETED'
      data.visibility = 'PUBLIC'
      break
    case 'failed':
      data.status = 'FAILED'
      break
    default:
      break
  }

  await db.photo.updateMany({
    where: { id: photoId, userId },
    data,
  })
  recordAdminOperation('library.workflow.update', Date.now() - start, 'success', {
    photoId,
    stage,
  })
}

export async function applyLibraryBatchAction(
  userId: string,
  payload:
    | { action: 'visibility'; ids: string[]; visibility: 'PUBLIC' | 'PRIVATE' }
    | { action: 'album'; ids: string[]; albumId: string | null }
    | { action: 'delete'; ids: string[] },
): Promise<LibraryBatchActionResult> {
  const start = Date.now()
  let result: { count: number }

  if (payload.action === 'visibility') {
    result = await db.photo.updateMany({
      where: { userId, id: { in: payload.ids } },
      data: {
        visibility: payload.visibility,
        status: payload.visibility === 'PUBLIC' ? 'COMPLETED' : undefined,
      },
    })
    recordAdminOperation('library.batch.visibility', Date.now() - start, 'success', {
      ids: payload.ids.length,
      visibility: payload.visibility,
    })
    return { updated: result.count }
  }

  if (payload.action === 'album') {
    result = await db.photo.updateMany({
      where: { userId, id: { in: payload.ids } },
      data: {
        albumId: payload.albumId ?? null,
      },
    })
    recordAdminOperation('library.batch.album', Date.now() - start, 'success', {
      ids: payload.ids.length,
      albumId: payload.albumId ?? null,
    })
    return { updated: result.count }
  }

  if (payload.action === 'delete') {
    result = await db.photo.deleteMany({
      where: { userId, id: { in: payload.ids } },
    })
    recordAdminOperation('library.batch.delete', Date.now() - start, 'success', {
      ids: payload.ids.length,
    })
    return { updated: result.count }
  }

  recordAdminOperation('library.batch.unknown', Date.now() - start, 'error', {
    action: (payload as any).action,
  })
  return { updated: 0 }
}

function buildPhotoWhere(userId: string, query: LibraryTableQuery): Prisma.PhotoWhereInput {
  const filters: Prisma.PhotoWhereInput[] = [{ userId }]

  if (query.search) {
    const search = query.search.trim()
    if (search) {
      filters.push({
        OR: [
          { fileKey: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { album: { is: { title: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
          { tags: { some: { tag: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } } },
        ],
      })
    }
  }

  if (query.tags && query.tags.length > 0) {
    filters.push({
      tags: {
        some: {
          tagId: { in: query.tags },
        },
      },
    })
  }

  if (query.visibility && query.visibility !== 'all') {
    filters.push({ visibility: query.visibility })
  }

  if (query.status && query.status !== 'all') {
    switch (query.status) {
      case 'processing':
        filters.push({ status: { in: ['UPLOADING', 'PROCESSING'] } })
        break
      case 'review':
        filters.push({ status: 'COMPLETED', visibility: 'PRIVATE' })
        break
      case 'published':
        filters.push({ status: 'COMPLETED', visibility: 'PUBLIC' })
        break
      case 'failed':
        filters.push({ status: 'FAILED' })
        break
      default:
        break
    }
  }

  return filters.length > 1 ? { AND: filters } : filters[0]
}

function resolveWorkflowStage(status: string, visibility: string): LibraryWorkflowStage {
  if (status === 'FAILED') return 'failed'
  if (status === 'UPLOADING' || status === 'PROCESSING') return 'processing'
  if (status === 'COMPLETED' && visibility === 'PUBLIC') return 'published'
  return 'review'
}


