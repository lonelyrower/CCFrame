import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// List and create tags
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 1000)

    const where: any = {
      photos: { some: { photo: { userId: session.user.id } } },
    }
    if (q) where.name = { contains: q }

    const tags = await db.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { photos: true } },
      },
      take: limit,
    })
    return NextResponse.json({ tags })
  } catch (e) {
    console.error('Tags list error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const name = (body.name || '').trim()
    const color = (body.color || '#6b7280').trim()
    if (!name) return NextResponse.json({ error: '标签名必填' }, { status: 400 })
    const exists = await db.tag.findUnique({ where: { name } })
    if (exists) return NextResponse.json({ error: '已存在同名标签' }, { status: 409 })
    const tag = await db.tag.create({ data: { name, color } })
    return NextResponse.json({ tag }, { status: 201 })
  } catch (e) {
    console.error('Tag create error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

