import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const name = (body.name || '').trim()
    const color = (body.color || '#6b7280').trim()
    if (!name) return NextResponse.json({ error: '标签名必填' }, { status: 400 })
    const photo = await db.photo.findFirst({ where: { id, userId: session.user.id } })
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const tag = await db.tag.upsert({ where: { name }, update: {}, create: { name, color } })
    await db.photoTag.upsert({ where: { photoId_tagId: { photoId: id, tagId: tag.id } }, update: {}, create: { photoId: id, tagId: tag.id } })
    return NextResponse.json({ tag })
  } catch (e) {
    console.error('Add tag error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    const url = new URL(req.url)
    const tagId = url.searchParams.get('tagId') || ''
    if (!tagId) return NextResponse.json({ error: 'tagId必填' }, { status: 400 })
    const photo = await db.photo.findFirst({ where: { id, userId: session.user.id } })
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.photoTag.deleteMany({ where: { photoId: id, tagId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Remove tag error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

