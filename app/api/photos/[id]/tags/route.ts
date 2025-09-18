import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const attachSchema = z.object({ tagId: z.string().cuid().optional(), name: z.string().min(1).max(50).optional() }).refine(d => d.tagId || d.name, { message: 'tagId or name required' })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = attachSchema.parse(body)

    const photo = await db.photo.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

    let tagId = data.tagId
    if (!tagId && data.name) {
      const existing = await db.tag.findUnique({ where: { name: data.name } })
      if (existing) tagId = existing.id
      else {
        const created = await db.tag.create({ data: { name: data.name } })
        tagId = created.id
      }
    }

    await db.photoTag.upsert({
      where: { photoId_tagId: { photoId: photo.id, tagId: tagId! } },
      create: { photoId: photo.id, tagId: tagId! },
      update: {}
    })

    const tag = await db.tag.findUnique({ where: { id: tagId! } })
    return NextResponse.json({ tag })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input', issues: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to attach tag' }, { status: 500 })
  }
}
