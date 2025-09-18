// Lazy-init queues to avoid Redis DNS during build
import type { Queue, Worker, Job } from 'bullmq'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { ImageProcessor } from '@/lib/image-processing'
import { PHOTO_STATUS } from '@/lib/constants'
import { ExifProcessor } from '@/lib/exif'
import { logger } from '@/lib/logger'
import { recordImageProcess } from '@/lib/metrics'

async function reuseDuplicatePhoto(params: { userId: string; contentHash: string; photoId: string; fileKey: string; storage: any }) {
  const { userId, contentHash, photoId, fileKey, storage } = params
  const duplicate = await db.photo.findFirst({
    where: { userId, contentHash, status: PHOTO_STATUS.COMPLETED },
    include: { variants: true }
  })
  if (!duplicate) return null
  try { await storage.deleteObject(fileKey) } catch {}
  const variantRecordsDup = duplicate.variants.map((v: any) => ({
    variant: v.variant,
    format: v.format,
    width: v.width,
    height: v.height,
    fileKey: v.fileKey,
    sizeBytes: v.sizeBytes,
  }))
  await db.photo.update({
    where: { id: photoId },
    data: {
      fileKey: duplicate.fileKey,
      hash: duplicate.hash,
      contentHash: duplicate.contentHash,
      width: duplicate.width,
      height: duplicate.height,
      blurhash: duplicate.blurhash || null,
      exifJson: duplicate.exifJson as any,
      takenAt: duplicate.takenAt,
      location: duplicate.location as any,
      status: PHOTO_STATUS.COMPLETED,
      variants: { createMany: { data: variantRecordsDup } },
    }
  })
  logger.info({ photoId, duplicateFrom: duplicate.id, variants: variantRecordsDup.length }, 'duplicate photo reused variants')
  return duplicate
}

// Queue for processing uploaded images
let _imageQueue: Queue | null = null
async function getImageQueue(): Promise<Queue> {
  if (_imageQueue) return _imageQueue
  const { Queue } = await import('bullmq')
  const { redis } = await import('@/lib/redis')
  _imageQueue = new Queue('image-processing', {
    connection: redis ?? undefined,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  })
  return _imageQueue
}


export const imageProcessingQueue = {
  add: async (...args: Parameters<Queue['add']>) => {
    const q = await getImageQueue()
    // @ts-ignore - align to Queue.add signature
    return q.add(...args)
  },
}


// Queue for AI tasks
// AI 相关功能与队列已移除，专注于上传与展示

interface ImageProcessingJobData {
  photoId: string
  fileKey: string
  userId: string
}

// AIProcessingJobData removed (AI features disabled)

// Image processing worker
const startImageWorker = async () => {
  const { Worker } = await import('bullmq')
  const { redis } = await import('@/lib/redis')
  const concurrency = Math.max(1, parseInt(process.env.IMG_WORKER_CONCURRENCY || '3', 10))
  return new Worker(
    'image-processing',
  async (job: Job<ImageProcessingJobData>) => {
    const { photoId, fileKey, userId } = job.data

    try {
      // Update job progress
      await job.updateProgress(10)

      // Download original image from S3
      const storage = getStorageManager()
      let buffer: Buffer
      try {
        buffer = await storage.downloadBuffer(fileKey)
      } catch (err) {
        const downloadUrl = await storage.getPresignedDownloadUrl(fileKey)
        const response = await fetch(downloadUrl)
        buffer = Buffer.from(await response.arrayBuffer())
      }

      await job.updateProgress(30)

      // Before heavy processing, compute content hash and check exact duplicates for this user
      const contentHash = await ImageProcessor.calculateContentHash(buffer)

      const reused = await reuseDuplicatePhoto({ userId, contentHash, photoId, fileKey, storage })
      if (reused) {
        await job.updateProgress(100)
        return { success: true, variants: reused.variants.length, deduplicatedFrom: reused.id }
      }

      // Extract EXIF data
      const exifData = await ExifProcessor.extractExif(buffer)

      await job.updateProgress(50)

      // Process image variants
  const { variants, blurhash, metadata, timings } = await ImageProcessor.processImage(buffer)
  recordImageProcess(timings)

      await job.updateProgress(70)

      // Upload variants to S3 with limited concurrency
      const variantRecords: any[] = []
      const uploadConcurrency = Math.max(1, parseInt(process.env.UPLOAD_CONCURRENCY || '4', 10))
      const tasks = variants.map((variant) => async () => {
        const variantKey = `variants/${photoId}/${variant.variant}.${variant.format}`
        await storage.uploadBuffer(variantKey, variant.buffer, `image/${variant.format}`)
        variantRecords.push({
          variant: variant.variant,
          format: variant.format,
          width: variant.width,
          height: variant.height,
          fileKey: variantKey,
          sizeBytes: variant.size,
        })
      })
      for (let i = 0; i < tasks.length; i += uploadConcurrency) {
        await Promise.all(tasks.slice(i, i + uploadConcurrency).map(fn => fn()))
      }

      await job.updateProgress(90)

      // Calculate hashes for similarity (pHash) and exact binary equality (sha256)
      const hash = await ImageProcessor.calculateHash(buffer)

      // Update photo record in database
      await db.photo.update({
        where: { id: photoId },
        data: {
          hash,
          contentHash,
          width: metadata.width!,
          height: metadata.height!,
          blurhash,
          exifJson: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
          takenAt: exifData?.takenAt,
          location: exifData?.location ? JSON.parse(JSON.stringify(exifData.location)) : undefined,
          status: PHOTO_STATUS.COMPLETED,
          variants: {
            createMany: {
              data: variantRecords
            }
          }
        }
      })

      await job.updateProgress(100)

      return { success: true, variants: variantRecords.length }
    } catch (error) {
      // Mark photo as failed
      await db.photo.update({
        where: { id: photoId },
        data: { status: PHOTO_STATUS.FAILED }
      })

      throw error
    }
    },
    {
      connection: redis ?? undefined,
      concurrency,
    }
  )
}


// AI worker removed

// AI processing functions removed

// 启动 Worker 仅在明确标志下进行，避免构建期连接 Redis
let workersStarted = false
export async function ensureWorkers() {
  if (workersStarted) return
  if (process.env.START_WORKERS === 'true') {
    await startImageWorker()
    workersStarted = true
  }
}

export type { Queue }


