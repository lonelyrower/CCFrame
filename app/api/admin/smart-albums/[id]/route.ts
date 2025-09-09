import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    const album = await db.smartAlbum.findFirst({ where: { id, userId: session.user.id } })
    if (!album) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ album })
  } catch (e) {
    console.error('Smart album get error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.title === 'string') data.title = body.title.trim()
    if (typeof body.description === 'string') data.description = body.description.trim()
    if (body.rule) data.ruleJson = body.rule
    if (typeof body.visibility === 'string') data.visibility = body.visibility
    if (typeof body.coverPhotoId === 'string') data.coverPhotoId = body.coverPhotoId
    const album = await db.smartAlbum.update({ where: { id }, data })
    return NextResponse.json({ album })
  } catch (e) {
    console.error('Smart album update error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    await db.smartAlbum.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Smart album delete error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
