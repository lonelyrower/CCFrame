// Lazy-init queues to avoid Redis DNS during build
import type { Queue, Worker, Job } from 'bullmq'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { ImageProcessor } from '@/lib/image-processing'
import { processLookbookExport, markLookbookFailure, markLookbookProcessing, type LookbookExportJobData } from '@/lib/lookbook/exporter'
import { PHOTO_STATUS } from '@/lib/constants'
import { ExifProcessor } from '@/lib/exif'
import { logger } from '@/lib/logger'
import { recordImageProcess } from '@/lib/metrics'

async function reuseDuplicatePhoto(params: { userId: string; contentHash: string; photoId: string; fileKey: string; storage: any }) {
  const { userId, contentHash, photoId, fileKey, storage } = params
  const duplicate = await db.photo.findFirst({
    where: { userId, contentHash, status: PHOTO_STATUS.COMPLETED },
    include: { variants: true },
  })
  if (!duplicate) return null
  try {
    await storage.deleteObject(fileKey)
  } catch {}
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
    },
  })
  logger.info({ photoId, duplicateFrom: duplicate.id, variants: variantRecordsDup.length }, 'duplicate photo reused variants')
  await db.audit.create({
    data: {
      userId,
      action: 'UPLOAD_DEDUPED',
      targetType: 'photo',
      targetId: photoId,
      meta: {
        deduplicatedFrom: duplicate.id,
        variants: variantRecordsDup.length,
      } as any,
    },
  })
  return duplicate
}

let _imageQueue: Queue | null = null
let _embeddingQueue: Queue | null = null
let _lookbookQueue: Queue | null = null

async function getImageQueue(): Promise<Queue> {
  if (_imageQueue) return _imageQueue
  const { Queue } = await import('bullmq')
  const { getRedis } = await import('@/lib/redis')
  const redis = await getRedis()
  if (!redis) {
    throw new Error('Redis connection not configured (set REDIS_URL)')
  }
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

async function getEmbeddingQueue(): Promise<Queue> {
  if (_embeddingQueue) return _embeddingQueue
  const { Queue } = await import('bullmq')
  const { getRedis } = await import('@/lib/redis')
  const redis = await getRedis()
  if (!redis) {
    throw new Error('Redis connection not configured (set REDIS_URL)')
  }
  _embeddingQueue = new Queue('embedding-generation', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
    },
  })
  return _embeddingQueue
}

async function getLookbookQueue(): Promise<Queue> {
  if (_lookbookQueue) return _lookbookQueue
  const { Queue } = await import('bullmq')
  const { getRedis } = await import('@/lib/redis')
  const redis = await getRedis()
  if (!redis) {
    throw new Error('Redis connection not configured (set REDIS_URL)')
  }
  _lookbookQueue = new Queue('lookbook-export', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1500 },
    },
  })
  return _lookbookQueue
}

export const imageProcessingQueue = {
  add: async (...args: Parameters<Queue['add']>) => {
    const q = await getImageQueue()
    // @ts-ignore - align to Queue.add signature
    return q.add(...args)
  },
}

export const embeddingQueue = {
  add: async (...args: Parameters<Queue['add']>) => {
    const q = await getEmbeddingQueue()
    // @ts-ignore
    return q.add(...args)
  },
}

export const lookbookExportQueue = {
  add: async (...args: Parameters<Queue['add']>) => {
    const q = await getLookbookQueue()
    // @ts-ignore
    return q.add(...args)
  },
}

interface ImageProcessingJobData {
  photoId: string
  fileKey: string
  userId: string
}

const startImageWorker = async () => {
  const { Worker } = await import('bullmq')
  const { getRedis } = await import('@/lib/redis')
  const redis = await getRedis()
  if (!redis) {
    throw new Error('Redis connection not configured (set REDIS_URL)')
  }
  const concurrency = Math.max(1, parseInt(process.env.IMG_WORKER_CONCURRENCY || '3', 10))
  return new Worker(
    'image-processing',
    async (job: Job<ImageProcessingJobData>) => {
      const { photoId, fileKey, userId } = job.data

      try {
        await job.updateProgress(10)
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

        const contentHash = await ImageProcessor.calculateContentHash(buffer)
        const reused = await reuseDuplicatePhoto({ userId, contentHash, photoId, fileKey, storage })
        if (reused) {
          await db.audit.create({
            data: {
              userId,
              action: 'UPLOAD_PROCESSED',
              targetType: 'photo',
              targetId: photoId,
              meta: {
                variants: reused.variants.length,
                deduplicatedFrom: reused.id,
              } as any,
            },
          })

          await job.updateProgress(100)
          return { success: true, variants: reused.variants.length, deduplicatedFrom: reused.id }
        }

        const exifData = await ExifProcessor.extractExif(buffer)
        await job.updateProgress(50)

        const { variants, blurhash, metadata, timings } = await ImageProcessor.processImage(buffer)
        recordImageProcess(timings)

        await job.updateProgress(70)

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
          await Promise.all(tasks.slice(i, i + uploadConcurrency).map((fn) => fn()))
        }

        await job.updateProgress(90)

        const hash = await ImageProcessor.calculateHash(buffer)

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
                data: variantRecords,
              },
            },
          },
        })

        await job.updateProgress(100)

        try {
          const eq = await getEmbeddingQueue()
          await eq.add('generate', { photoId, userId }, { delay: 1000 })
        } catch (e) {
          logger.warn({ photoId, err: String(e) }, 'failed to enqueue embedding job')
        }

        await db.audit.create({
          data: {
            userId,
            action: 'UPLOAD_PROCESSED',
            targetType: 'photo',
            targetId: photoId,
            meta: {
              variants: variantRecords.length,
            } as any,
          },
        })

        return { success: true, variants: variantRecords.length, embeddingQueued: true }
      } catch (error) {
        await db.photo.update({
          where: { id: photoId },
          data: { status: PHOTO_STATUS.FAILED },
        })

        await db.audit.create({
          data: {
            userId,
            action: 'UPLOAD_FAILED',
            targetType: 'photo',
            targetId: photoId,
            meta: {
              error: error instanceof Error ? error.message : String(error),
            } as any,
          },
        })

        throw error
      }
    },
    {
      connection: redis,
      concurrency,
    },
  )
}

const startEmbeddingWorker = async () => {
  const { Worker } = await import('bullmq')
  const { getRedis } = await import('@/lib/redis')
  const redis = await getRedis()
  if (!redis) {
    throw new Error('Redis connection not configured (set REDIS_URL)')
  }
  const { savePhotoEmbedding, DEFAULT_EMBEDDING_DIM } = await import('@/lib/embeddings')
  const { generatePhotoEmbedding } = await import('@/lib/embedding-provider')
  const { recordEmbeddingGeneration } = await import('@/lib/metrics')
  const { getSemanticConfig } = await import('@/lib/semantic-config')
  return new Worker(
    'embedding-generation',
    async (job: Job<{ photoId: string; userId: string }>) => {
      const { photoId } = job.data
      const cfg = getSemanticConfig()
      if (!cfg.enabled) {
        return { skipped: true, reason: 'semantic disabled' }
      }
      const photo = await db.photo.findUnique({ where: { id: photoId } })
      if (!photo || photo.status !== PHOTO_STATUS.COMPLETED) {
        return { skipped: true, reason: 'photo not completed' }
      }
      const dim = cfg.dim || DEFAULT_EMBEDDING_DIM
      const t0 = Date.now()
      try {
        const { embedding, model, provider } = await generatePhotoEmbedding(photoId, { dim, model: cfg.model })
        await savePhotoEmbedding(photoId, embedding, { model })
        const ms = Date.now() - t0
        recordEmbeddingGeneration({ ms, ok: true, model })
        logger.info({ photoId, model, dim, provider, ms }, 'embedding generated')
        await db.audit.create({
          data: {
            userId: job.data.userId,
            action: 'UPLOAD_EMBEDDED',
            targetType: 'photo',
            targetId: photoId,
            meta: { model, provider, durationMs: ms } as any,
          },
        })
        return { success: true }
      } catch (e) {
        const ms = Date.now() - t0
        recordEmbeddingGeneration({ ms, ok: false, model: cfg.model })
        logger.warn({ photoId, err: String(e), ms }, 'embedding generation failed')
        await db.audit.create({
          data: {
            userId: job.data.userId,
            action: 'UPLOAD_EMBED_FAILED',
            targetType: 'photo',
            targetId: photoId,
            meta: { error: e instanceof Error ? e.message : String(e), durationMs: ms } as any,
          },
        })
        return { success: false, error: String(e) }
      }
    },
    { connection: redis, concurrency: 2 },
  )
}

const startLookbookWorker = async () => {
  const { Worker } = await import('bullmq')
  const { getRedis } = await import('@/lib/redis')
  const redis = await getRedis()
  if (!redis) {
    throw new Error('Redis connection not configured (set REDIS_URL)')
  }
  return new Worker(
    'lookbook-export',
    async (job: Job<LookbookExportJobData>) => {
      try {
        await markLookbookProcessing(job.data.exportId)
        const result = await processLookbookExport(job.data)
        return { success: true, downloadUrl: result.downloadUrl ?? null }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await markLookbookFailure(job.data.exportId, message)
        throw error
      }
    },
    { connection: redis, concurrency: 1 },
  )
}

let workersStarted = false
export async function ensureWorkers() {
  if (workersStarted) return
  if (process.env.START_WORKERS === 'true') {
    await startImageWorker()
    await startEmbeddingWorker()
    await startLookbookWorker()
    workersStarted = true
  }
}

export type { Queue }
