import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { imageProcessingQueue } from '@/jobs/queue'
import { PHOTO_STATUS } from '@/lib/constants'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { uploadEventCounter } from '@/lib/prometheus'
import { z } from 'zod'

const commitRequestSchema = z.object({
  photoId: z.string(),
  fileKey: z.string(),
})

export async function POST(request: NextRequest) {
  let rateHeaders: Record<string, string> | null = null
  let sessionUserId: string | undefined

  const attachHeaders = (response: NextResponse) => {
    if (rateHeaders) {
      for (const [key, value] of Object.entries(rateHeaders)) {
        response.headers.set(key, value)
      }
    }
    return response
  }

  try {
    const session = await getServerSession(authOptions)
    sessionUserId = session?.user?.id ?? undefined
    if (!sessionUserId) {
      uploadEventCounter.inc({ type: 'commit', result: 'unauthorized' })
      logger.warn({ event: 'upload_commit_unauthorized' }, 'Upload commit blocked: unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rate = await rateLimit(sessionUserId, 'upload:commit', 40, 60)
    rateHeaders = rateLimitHeaders(rate)
    if (!rate.allowed) {
      uploadEventCounter.inc({ type: 'commit', result: 'rate_limited' })
      logger.warn({ userId: sessionUserId, event: 'upload_commit_rate_limited' }, 'Upload commit rate limit exceeded')
      return attachHeaders(NextResponse.json({ error: 'Upload rate limit exceeded' }, { status: 429 }))
    }

    const body = await request.json()
    const { photoId, fileKey } = commitRequestSchema.parse(body)

    const photo = await db.photo.findFirst({
      where: { id: photoId, userId: sessionUserId }
    })

    if (!photo) {
      uploadEventCounter.inc({ type: 'commit', result: 'validation_error' })
      logger.warn({ userId: sessionUserId, photoId, event: 'upload_commit_photo_missing' }, 'Upload commit rejected: photo not found')
      return attachHeaders(NextResponse.json({ error: 'Photo not found' }, { status: 404 }))
    }

    if (photo.status !== PHOTO_STATUS.UPLOADING) {
      uploadEventCounter.inc({ type: 'commit', result: 'validation_error' })
      logger.warn({ userId: sessionUserId, photoId, status: photo.status, event: 'upload_commit_invalid_state' }, 'Upload commit rejected due to invalid state')
      return attachHeaders(NextResponse.json({ error: 'Photo is not in uploading state' }, { status: 400 }))
    }

    await db.photo.update({
      where: { id: photoId },
      data: { status: PHOTO_STATUS.PROCESSING }
    })

    await imageProcessingQueue.add('process-image', {
      photoId,
      fileKey,
      userId: sessionUserId
    })

    await db.audit.create({
      data: {
        userId: sessionUserId,
        action: 'UPLOAD',
        targetType: 'photo',
        targetId: photoId,
        meta: { fileKey } as any
      }
    })

    uploadEventCounter.inc({ type: 'commit', result: 'success' })
    logger.info({ userId: sessionUserId, photoId, event: 'upload_commit_success' }, 'Upload commit succeeded')
    return attachHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    uploadEventCounter.inc({ type: 'commit', result: 'error' })
    logger.error({ userId: sessionUserId, error: message, stack: error instanceof Error ? error.stack : undefined, event: 'upload_commit_error' }, 'Upload commit error')
    return attachHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}
