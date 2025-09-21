import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { PHOTO_STATUS } from '@/lib/constants'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { checkDuplicatePhoto } from '@/lib/photo-dedupe'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { uploadEventCounter } from '@/lib/prometheus'
import { withCSRFProtection } from '@/lib/csrf'
import { z } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const uploadRequestSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  albumId: z.string().optional(),
  contentHash: z.string().length(64).optional(), // hex sha256
})

export const POST = withCSRFProtection(async function POST(request: NextRequest) {
  let rateHeaders: Record<string, string> | null = null
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      uploadEventCounter.inc({ type: 'presign', result: 'unauthorized' })
      logger.warn({ event: 'upload_presign_unauthorized' }, 'Upload presign blocked: unauthorized')
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const rate = await rateLimit(userId, 'upload:presign', 30, 60)
    rateHeaders = rateLimitHeaders(rate)
    if (!rate.allowed) {
      uploadEventCounter.inc({ type: 'presign', result: 'rate_limited' })
      logger.warn({ userId, event: 'upload_presign_rate_limited' }, 'Upload presign rate limit exceeded')
      const response = NextResponse.json({ error: '上传频率限制，请稍后再试' }, { status: 429 })
      for (const [key, value] of Object.entries(rateHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const body = await request.json()
    const { filename, contentType, size, albumId, contentHash } = uploadRequestSchema.parse(body)

    if (!contentType.startsWith('image/')) {
      uploadEventCounter.inc({ type: 'presign', result: 'validation_error' })
      logger.warn({ userId, contentType, event: 'upload_presign_validation' }, 'Upload presign rejected due to invalid content type')
      const response = NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
      if (rateHeaders) {
        for (const [key, value] of Object.entries(rateHeaders)) {
          response.headers.set(key, value)
        }
      }
      return response
    }

    if (albumId) {
      const album = await db.album.findFirst({
        where: { id: albumId, userId }
      })
      if (!album) {
        uploadEventCounter.inc({ type: 'presign', result: 'validation_error' })
        logger.warn({ userId, albumId, event: 'upload_presign_album_missing' }, 'Upload presign rejected: album not found')
        const response = NextResponse.json({ error: '相册不存在' }, { status: 404 })
        if (rateHeaders) {
          for (const [key, value] of Object.entries(rateHeaders)) {
            response.headers.set(key, value)
          }
        }
        return response
      }
    }

    if (contentHash) {
      const dupCheck = await checkDuplicatePhoto(userId, contentHash)
      if (dupCheck.duplicate && dupCheck.existingPhotoId) {
        uploadEventCounter.inc({ type: 'presign', result: 'duplicate' })
        logger.info({ userId, photoId: dupCheck.existingPhotoId, event: 'upload_presign_duplicate' }, 'Upload presign deduplicated by content hash')
        const response = NextResponse.json({ photoId: dupCheck.existingPhotoId, completed: true, duplicate: true })
        if (rateHeaders) {
          for (const [key, value] of Object.entries(rateHeaders)) {
            response.headers.set(key, value)
          }
        }
        return response
      }
    }

    const fileKey = StorageManager.generateKey('originals', filename)

    const photo = await db.photo.create({
      data: {
        fileKey,
        hash: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        width: 0,
        height: 0,
        userId,
        albumId,
        status: PHOTO_STATUS.UPLOADING,
        ...(contentHash ? { contentHash } : {})
      }
    })

    const storage = getStorageManager()
    const uploadUrl = await storage.getPresignedUploadUrl(fileKey, contentType)

    uploadEventCounter.inc({ type: 'presign', result: 'success' })
    logger.info({ userId, photoId: photo.id, size, event: 'upload_presign_success' }, 'Upload presign issued successfully')

    const response = NextResponse.json({ photoId: photo.id, uploadUrl, fileKey })
    if (rateHeaders) {
      for (const [key, value] of Object.entries(rateHeaders)) {
        response.headers.set(key, value)
      }
    }
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    uploadEventCounter.inc({ type: 'presign', result: 'error' })
    logger.error({ error: message, stack: error instanceof Error ? error.stack : undefined, event: 'upload_presign_error' }, 'Upload presign error')
    const response = NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
    if (rateHeaders) {
      for (const [key, value] of Object.entries(rateHeaders)) {
        response.headers.set(key, value)
      }
    }
    return response
  }
})
