import { Queue, Worker, Job } from 'bullmq'
import { redis } from '@/lib/redis'
import { db } from '@/lib/db'
import { StorageService } from '@/lib/storage'
import { ImageProcessor } from '@/lib/image-processing'
import { ExifProcessor } from '@/lib/exif'
import { JobType, JobStatus } from '@/types'

// Queue for processing uploaded images
export const imageProcessingQueue = new Queue('image-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

// Queue for AI tasks
export const aiProcessingQueue = new Queue('ai-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

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
const imageWorker = new Worker(
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

// AI processing worker
const aiWorker = new Worker(
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
    concurrency: 1, // AI tasks are more resource intensive
  }
)

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

export { imageWorker, aiWorker }
