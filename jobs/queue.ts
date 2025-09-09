// Lazy-init queues to avoid Redis DNS during build
import type { Queue, Worker, Job } from 'bullmq'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { ImageProcessor } from '@/lib/image-processing'
import { ExifProcessor } from '@/lib/exif'
import { JobType } from '@/types'
import { getAutoTagConfig } from '@/lib/settings'
import { autoTagPhoto } from '@/lib/auto-tag'
import { AIImageProcessor } from '@/lib/ai-providers'

// Queue for processing uploaded images
let _imageQueue: Queue | null = null
async function getImageQueue(): Promise<Queue> {
  if (_imageQueue) return _imageQueue
  const { Queue } = await import('bullmq')
  const { redis } = await import('@/lib/redis')
  _imageQueue = new Queue('image-processing', {
    connection: redis,
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
let _aiQueue: Queue | null = null
async function getAIQueue(): Promise<Queue> {
  if (_aiQueue) return _aiQueue
  const { Queue } = await import('bullmq')
  const { redis } = await import('@/lib/redis')
  _aiQueue = new Queue('ai-processing', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    },
  })
  return _aiQueue
}

export const aiProcessingQueue = {
  add: async (...args: Parameters<Queue['add']>) => {
    const q = await getAIQueue()
    // @ts-ignore
    return q.add(...args)
  },
}

interface ImageProcessingJobData {
  photoId: string
  fileKey: string
  userId: string
}

interface AIProcessingJobData {
  jobId: string
  photoId: string
  taskType: JobType
  params: Record<string, any>
}

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
      const downloadUrl = await storage.getPresignedDownloadUrl(fileKey)
      const response = await fetch(downloadUrl)
      const buffer = Buffer.from(await response.arrayBuffer())

      await job.updateProgress(30)

      // Before heavy processing, compute content hash and check exact duplicates for this user
      const contentHash = await ImageProcessor.calculateContentHash(buffer)

      const duplicate = await db.photo.findFirst({
        where: { userId, contentHash, status: 'COMPLETED' },
        include: { variants: true }
      })

      if (duplicate) {
        // Remove redundant uploaded original
        try { await storage.deleteObject(fileKey) } catch {}

        // Clone variant records referencing existing files
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
            status: 'COMPLETED',
            variants: { createMany: { data: variantRecordsDup } },
          }
        })

        await job.updateProgress(100)
        return { success: true, variants: variantRecordsDup.length, deduplicatedFrom: duplicate.id }
      }

      // Extract EXIF data
      const exifData = await ExifProcessor.extractExif(buffer)

      await job.updateProgress(50)

      // Process image variants
      const { variants, blurhash, metadata } = await ImageProcessor.processImage(buffer)

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
      const contentHash = await ImageProcessor.calculateContentHash(buffer)

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
          status: 'COMPLETED',
          variants: {
            createMany: {
              data: variantRecords
            }
          }
        }
      })

      await job.updateProgress(100)

      // Schedule auto-tagging if enabled
      try {
        const conf = await getAutoTagConfig()
        if (conf.enabled) {
          // Create a job record for tracking
          const tagJob = await db.job.create({
            data: {
              type: 'AI_AUTO_TAG' as any,
              payloadJson: { photoId, includeColors: conf.includeColors, includeContent: conf.includeContent } as any,
              userId,
              status: 'PENDING',
              progress: 0,
            },
          })
          const q = await getAIQueue()
          await q.add('ai-process', { jobId: tagJob.id, photoId, taskType: 'AI_AUTO_TAG' as any, params: { includeColors: conf.includeColors, includeContent: conf.includeContent } })
        }
      } catch (e) {
        console.warn('Auto-tag schedule failed:', e)
      }

      return { success: true, variants: variantRecords.length }
    } catch (error) {
      // Mark photo as failed
      await db.photo.update({
        where: { id: photoId },
        data: { status: 'FAILED' }
      })

      throw error
    }
    },
    {
      connection: redis,
      concurrency: 3,
    }
  )
}

// AI processing worker
const startAIWorker = async () => {
  const { Worker } = await import('bullmq')
  const { redis } = await import('@/lib/redis')
      return new Worker(
    'ai-processing',
  async (job: Job<AIProcessingJobData>) => {
    const { jobId, photoId, taskType, params } = job.data

    try {
      // Update database job status
      await db.job.update({
        where: { id: jobId },
        data: { 
          status: 'RUNNING',
          progress: 0
        }
      })

      await job.updateProgress(10)

      // Get photo details
      const photo = await db.photo.findUnique({
        where: { id: photoId },
        include: { variants: true }
      })

      if (!photo) {
        throw new Error('Photo not found')
      }

      await job.updateProgress(30)

      // Process based on task type
      let result: any = {}
      switch (taskType) {
        case 'AI_ENHANCEMENT':
          result = await processAIEnhancement(photo, params)
          break
        case 'AI_UPSCALE':
          result = await processAIUpscale(photo, params)
          break
        case 'AI_REMOVE_BACKGROUND':
          result = await processBackgroundRemoval(photo, params)
          break
        case 'AI_AUTO_TAG':
          result = await processAutoTagging(photo, params)
          break
        default:
          throw new Error(`Unsupported task type: ${taskType}`)
      }

      await job.updateProgress(90)

      // Update database job with result
      await db.job.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          resultJson: result
        }
      })

      await job.updateProgress(100)

      return result
    } catch (error) {
      // Mark job as failed
      await db.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMsg: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
    }
    },
    {
      connection: redis,
      concurrency: Math.max(1, parseInt(process.env.AI_WORKER_CONCURRENCY || '1', 10)),
    }
  )
}

// AI processing functions (placeholder implementations)
async function processAIEnhancement(photo: any, params: any) {
  const storage = getStorageManager()
  // Download original
  const originalUrl = await storage.getPresignedDownloadUrl(photo.fileKey)
  const res = await fetch(originalUrl)
  const buf = Buffer.from(await res.arrayBuffer())

  // Real enhancement via provider (auto selects based on env), fallback to local
  const provider = typeof params?.provider === 'string' ? params.provider : 'auto'
  const out = await AIImageProcessor.processImage(buf, 'enhance', params || {}, provider as any)

  const key = `enhanced/${photo.id}/${Date.now()}.jpg`
  await storage.uploadBuffer(key, out, 'image/jpeg')

  const edit = await db.editVersion.create({
    data: {
      photoId: photo.id,
      name: 'AI增强',
      fileKey: key,
      params: JSON.stringify({ type: 'AI_ENHANCEMENT', params }),
    },
  })

  return { status: 'completed', editVersionId: edit.id, enhancedImageKey: key }
}

async function processAIUpscale(photo: any, params: any) {
  const storage = getStorageManager()
  const originalUrl = await storage.getPresignedDownloadUrl(photo.fileKey)
  const res = await fetch(originalUrl)
  const buf = Buffer.from(await res.arrayBuffer())
  const scale = Math.max(2, Math.min(4, Number(params?.scaleFactor) || Number(params?.scale) || 2))
  const provider = typeof params?.provider === 'string' ? params.provider : 'auto'
  const out = await AIImageProcessor.processImage(buf, 'upscale', { scale }, provider as any)

  const key = `upscaled/${photo.id}/${Date.now()}_${scale}x.jpg`
  await storage.uploadBuffer(key, out, 'image/jpeg')

  const edit = await db.editVersion.create({
    data: {
      photoId: photo.id,
      name: `AI放大 ${scale}x`,
      fileKey: key,
      params: JSON.stringify({ type: 'AI_UPSCALE', scaleFactor: scale }),
    },
  })

  return { status: 'completed', editVersionId: edit.id, upscaledImageKey: key, scaleFactor: scale }
}

async function processBackgroundRemoval(photo: any, params: any) {
  const storage = getStorageManager()
  const originalUrl = await storage.getPresignedDownloadUrl(photo.fileKey)
  const res = await fetch(originalUrl)
  const buf = Buffer.from(await res.arrayBuffer())
  const provider = typeof params?.provider === 'string' ? params.provider : 'auto'
  const out = await AIImageProcessor.processImage(buf, 'remove-background', params || {}, provider as any)
  const key = `no-bg/${photo.id}/${Date.now()}.png`
  await storage.uploadBuffer(key, out, 'image/png')

  const edit = await db.editVersion.create({
    data: {
      photoId: photo.id,
      name: 'AI去背景',
      fileKey: key,
      params: JSON.stringify({ type: 'AI_REMOVE_BACKGROUND' }),
    },
  })

  return { status: 'completed', editVersionId: edit.id, processedImageKey: key }
}

async function processAutoTagging(photo: any, params: any) {
  // Params include includeColors/includeContent; provider/limit handled inside auto-tag module via settings
  try {
    await autoTagPhoto(photo.id, { includeColors: params?.includeColors !== false, includeContent: params?.includeContent !== false })
    return { status: 'completed' }
  } catch (e) {
    throw e
  }
}

// 启动 Worker 仅在明确标志下进行，避免构建期连接 Redis
let workersStarted = false
export async function ensureWorkers() {
  if (workersStarted) return
  if (process.env.START_WORKERS === 'true') {
    await startImageWorker()
    await startAIWorker()
    workersStarted = true
  }
}

export type { Queue }
