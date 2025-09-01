import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { imageProcessingQueue } from '@/jobs/queue'
import { z } from 'zod'

const commitRequestSchema = z.object({
  photoId: z.string(),
  fileKey: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photoId, fileKey } = commitRequestSchema.parse(body)

    // Verify photo ownership
    const photo = await db.photo.findFirst({
      where: { id: photoId, userId: session.user.id }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (photo.status !== 'UPLOADING') {
      return NextResponse.json({ error: 'Photo is not in uploading state' }, { status: 400 })
    }

    // Update photo status
    await db.photo.update({
      where: { id: photoId },
      data: { status: 'PROCESSING' }
    })

    // Queue for processing
    await imageProcessingQueue.add('process-image', {
      photoId,
      fileKey,
      userId: session.user.id
    })

    // Log audit
    await db.audit.create({
      data: {
        userId: session.user.id,
        action: 'UPLOAD',
        targetType: 'photo',
        targetId: photoId,
        meta: { fileKey }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload commit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}