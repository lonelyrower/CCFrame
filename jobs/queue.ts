// Lazy-init queues to avoid Redis DNS during build
import type { Queue, Worker, Job } from 'bullmq'
import { db } from '@/lib/db'
import { StorageService } from '@/lib/storage'
import { ImageProcessor } from '@/lib/image-processing'
import { ExifProcessor } from '@/lib/exif'
import { JobType } from '@/types'

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
  return new Worker(
    'image-processing',
  async (job: Job<ImageProcessingJobData>) => {
    const { photoId, fileKey, userId } = job.data

    try {
      // Update job progress
      await job.updateProgress(10)

      // Download original image from S3
      const downloadUrl = await StorageService.getPresignedDownloadUrl(fileKey)
      const response = await fetch(downloadUrl)
      const buffer = Buffer.from(await response.arrayBuffer())

      await job.updateProgress(30)

      // Extract EXIF data
      const exifData = await ExifProcessor.extractExif(buffer)

      await job.updateProgress(50)

      // Process image variants
      const { variants, blurhash, metadata } = await ImageProcessor.processImage(buffer)

      await job.updateProgress(70)

      // Upload variants to S3
      const variantRecords = []
      for (const variant of variants) {
        const variantKey = `variants/${photoId}/${variant.variant}.${variant.format}`
        await StorageService.uploadBuffer(variantKey, variant.buffer, `image/${variant.format}`)
        
        variantRecords.push({
          variant: variant.variant,
          format: variant.format,
          width: variant.width,
          height: variant.height,
          fileKey: variantKey,
          sizeBytes: variant.size,
        })
      }

      await job.updateProgress(90)

      // Calculate image hash for deduplication
      const hash = await ImageProcessor.calculateHash(buffer)

      // Update photo record in database
      await db.photo.update({
        where: { id: photoId },
        data: {
          hash,
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
      concurrency: 1,
    }
  )
}

// AI processing functions (placeholder implementations)
async function processAIEnhancement(photo: any, params: any) {
  // TODO: Integrate with AI APIs (OpenAI, Claude, etc.)
  // This is a placeholder that would call external AI services
  return {
    status: 'completed',
    enhancedImageKey: `enhanced/${photo.id}/enhanced.jpg`,
    improvements: ['brightness', 'contrast', 'saturation']
  }
}

async function processAIUpscale(photo: any, params: any) {
  // TODO: Integrate with upscaling AI service
  return {
    status: 'completed',
    upscaledImageKey: `upscaled/${photo.id}/upscaled.jpg`,
    scaleFactor: params.scaleFactor || 2
  }
}

async function processBackgroundRemoval(photo: any, params: any) {
  // TODO: Integrate with background removal AI service
  return {
    status: 'completed',
    processedImageKey: `no-bg/${photo.id}/no-background.png`,
    maskKey: `masks/${photo.id}/mask.png`
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
