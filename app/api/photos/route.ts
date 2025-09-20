import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 100

type SortKey = 'newest' | 'oldest' | 'name'

function resolveOrderBy(sort: SortKey) {
  switch (sort) {
    case 'oldest':
      return { createdAt: 'asc' } as const
    case 'name':
      return { album: { title: 'asc' } } as const
    case 'newest':
    default:
      return { createdAt: 'desc' } as const
  }
}

function buildWhere(session: any, params: URLSearchParams) {
  const where: any = { status: 'COMPLETED' }
  if (session?.user?.id) {
    where.userId = session.user.id
  } else {
    where.visibility = 'PUBLIC'
  }

  const album = params.get('album') || undefined
  const tag = params.get('tag') || undefined
  const search = params.get('search') || undefined

  if (album) where.albumId = album

  if (tag) {
    where.tags = {
      some: {
        tag: {
          name: {
            contains: tag
            
          },
        },
      },
    }
  }

  if (search) {
    where.OR = [
      {
        album: {
          title: {
            contains: search
            
          },
        },
      },
      {
        tags: {
          some: {
            tag: {
              name: {
                contains: search
                
              },
            },
          },
        },
      },
    ]
  }

  return where
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const url = new URL(request.url)
  const params = url.searchParams

  const limitParam = Number(params.get('limit'))
  const take = Math.min(
    Math.max(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  )
  const cursor = params.get('cursor') || undefined
  const includeVariants = params.get('variants') === 'true'
  const sortRaw = params.get('sort') || 'newest'
  const sort = (['newest', 'oldest', 'name'] as const).includes(sortRaw as any) ? (sortRaw as SortKey) : 'newest'

  const where = buildWhere(session, params)
  const orderBy = resolveOrderBy(sort)

  const select: any = {
    id: true,
    fileKey: true,
    hash: true,
    width: true,
    height: true,
    blurhash: true,
    createdAt: true,
    updatedAt: true,
    takenAt: true,
    albumId: true,
    visibility: true,
    status: true,
    userId: true,
    exifJson: true,
    location: true,
    album: {
      select: {
        id: true,
        title: true,
        description: true,
      },
    },
    tags: {
      include: { tag: true },
    },
  }

  if (includeVariants) {
    select.variants = {
      select: {
        id: true,
        variant: true,
        format: true,
        width: true,
        height: true,
        fileKey: true,
        sizeBytes: true,
      },
    }
  }

  const query: any = {
    where,
    orderBy,
    take: take + 1,
    select,
  }

  if (cursor) {
    query.cursor = { id: cursor }
    query.skip = 1
  }

  const rows = await db.photo.findMany(query)

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next ? next.id : null
  }

  return NextResponse.json({
    photos: rows,
    nextCursor,
  })
}
