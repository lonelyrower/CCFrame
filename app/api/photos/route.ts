import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100)

  const where: any = {
    status: 'COMPLETED',
  }

  if (session?.user?.id) {
    where.userId = session.user.id
  } else {
    where.visibility = 'PUBLIC'
  }

  const photos = await db.photo.findMany({
    where,
    include: {
      variants: true,
      tags: { include: { tag: true } },
      album: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ photos })
}

