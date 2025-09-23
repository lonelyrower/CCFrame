import type { Job, Queue } from 'bullmq'

import { db } from '@/lib/db'
import { getRedis } from '@/lib/redis'
import { formatBytes } from '@/lib/utils'
import type {
  UploadQueueGroupDto,
  UploadQueueItemDto,
  UploadQueueSnapshotDto,
  UploadGuardInfoDto,
  UploadTimelineEntryDto,
} from '@/types/upload'

const IMAGE_QUEUE_NAME = 'image-processing'
const STORAGE_LIMIT_ENV_KEYS = ['UPLOAD_STORAGE_LIMIT_BYTES', 'NEXT_PUBLIC_UPLOAD_STORAGE_LIMIT_BYTES'] as const
const STORAGE_WARN_THRESHOLD = 0.8

let queueInstance: Queue | null = null
let queueConnection: any = null

async function getImageProcessingQueue(): Promise<Queue | null> {
  if (queueInstance) {
    return queueInstance
  }

  const redis = await getRedis()
  if (!redis) {
    return null
  }

  try {
    const { Queue } = await import('bullmq')
    queueConnection = redis.duplicate()
    if (queueConnection.status === 'wait' || queueConnection.status === 'end') {
      await queueConnection.connect()
    }
    queueInstance = new Queue(IMAGE_QUEUE_NAME, {
      connection: queueConnection,
    })
    return queueInstance
  } catch (error) {
    return null
  }
}

export async function getUploadQueueSnapshot(): Promise<UploadQueueSnapshotDto> {
  const queue = await getImageProcessingQueue()

  const [queueGroups, counts] = queue
    ? await fetchQueueGroups(queue)
    : await fetchQueueFallback()

  const completedGroup = await buildCompletedGroup()
  const failedGroup = await buildFailedGroup()

  const groups: UploadQueueGroupDto[] = [queueGroups.queued, queueGroups.processing, completedGroup, failedGroup]

  const guard = await getUploadGuardInfo()

  return {
    counts: {
      queued: counts.queued,
      processing: counts.processing,
      failed: counts.failed,
      completed24h: counts.completed24h,
    },
    groups,
    guard,
    generatedAt: new Date().toISOString(),
  }
}

export async function getUploadActivityTimeline(limit = 25): Promise<UploadTimelineEntryDto[]> {
  const actions = ['UPLOAD', 'UPLOAD_PROCESSED', 'UPLOAD_FAILED', 'UPLOAD_DEDUPED', 'UPLOAD_EMBEDDED', 'UPLOAD_EMBED_FAILED']

  const entries = await db.audit.findMany({
    where: { action: { in: actions } },
    include: {
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return entries.map((entry) => {
    const severity = mapAuditSeverity(entry.action)
    return {
      id: entry.id,
      type: entry.action,
      title: mapAuditTitle(entry.action),
      description: buildAuditDescription(entry.action, entry.meta),
      timestamp: entry.createdAt.toISOString(),
      severity,
      photoId: entry.targetId ?? undefined,
      userId: entry.userId ?? undefined,
      meta: entry.meta as Record<string, unknown> | undefined,
    }
  })
}

export async function getUploadGuardInfo(): Promise<UploadGuardInfoDto> {
  const variantSum = await db.photoVariant.aggregate({ _sum: { sizeBytes: true } })
  const storageUsedBytes = variantSum._sum.sizeBytes ?? 0
  const storageLimitBytes = readStorageLimit()

  const percentUsed = storageLimitBytes ? Math.min(100, (storageUsedBytes / storageLimitBytes) * 100) : 0
  const approachingLimit = Boolean(storageLimitBytes && percentUsed >= STORAGE_WARN_THRESHOLD * 100)

  const message = storageLimitBytes
    ? `已使用 ${formatBytes(storageUsedBytes)} / ${formatBytes(storageLimitBytes)}`
    : `当前已使用 ${formatBytes(storageUsedBytes)}`

  return {
    storageUsedBytes,
    storageLimitBytes,
    percentUsed,
    approachingLimit,
    message,
  }
}

async function fetchQueueGroups(queue: Queue) {
  const [waitingJobs, activeJobs, counts, completed24h] = await Promise.all([
    queue.getJobs(['waiting', 'delayed', 'paused'], 0, 19, false),
    queue.getJobs(['active'], 0, 19, false),
    queue.getJobCounts('waiting', 'delayed', 'paused', 'active', 'failed'),
    countCompletedLast24h(),
  ])

  const queuedItems = await buildQueueItems(waitingJobs, 'queued')
  const processingItems = await buildQueueItems(activeJobs, 'processing')

  const queuedGroup: UploadQueueGroupDto = {
    id: 'queued',
    title: '排队中',
    description: '等待处理或预占资源的上传任务。',
    total: (counts.waiting ?? 0) + (counts.delayed ?? 0) + (counts.paused ?? 0),
    items: queuedItems,
  }

  const processingGroup: UploadQueueGroupDto = {
    id: 'processing',
    title: '处理中',
    description: '正在进行优化、生成变体或计算嵌入的任务。',
    total: counts.active ?? 0,
    items: processingItems,
  }

  return [
    { queued: queuedGroup, processing: processingGroup },
    {
      queued: queuedGroup.total,
      processing: processingGroup.total,
      failed: counts.failed ?? 0,
      completed24h,
    },
  ] as const
}

async function fetchQueueFallback() {
  const [processingPhotos, failedCount, completed24h] = await Promise.all([
    db.photo.findMany({
      where: { status: { in: ['UPLOADING', 'PROCESSING'] } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        
        fileKey: true,
        visibility: true,
        updatedAt: true,
        createdAt: true,
        status: true,
      },
    }),
    db.photo.count({ where: { status: 'FAILED' } }),
    countCompletedLast24h(),
  ])

  const items: UploadQueueItemDto[] = processingPhotos.map((photo) => ({
    id: `fallback-${photo.id}`,
    jobId: null,
    photoId: photo.id,
    fileName: photo.fileKey,
    status: 'processing',
    progress: 50,
    visibility: photo.visibility as 'PUBLIC' | 'PRIVATE',
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
  }))

  const queuedGroup: UploadQueueGroupDto = {
    id: 'queued',
    title: '排队中',
    description: 'Redis 未连接，基于数据库提供近似数据。',
    total: Math.max(0, items.length - 5),
    items: items.slice(5),
  }

  const processingGroup: UploadQueueGroupDto = {
    id: 'processing',
    title: '处理中',
    description: 'Redis 未连接，展示最近的处理记录。',
    total: items.length,
    items,
  }

  return [
    { queued: queuedGroup, processing: processingGroup },
    {
      queued: queuedGroup.total,
      processing: processingGroup.total,
      failed: failedCount,
      completed24h,
    },
  ] as const
}

async function buildQueueItems(jobs: Job[], status: UploadQueueItemDto['status']): Promise<UploadQueueItemDto[]> {
  if (jobs.length === 0) return []

  const photoIds = jobs
    .map((job) => job.data?.photoId as string | undefined)
    .filter((value): value is string => Boolean(value))

  const photos = await db.photo.findMany({
    where: { id: { in: photoIds } },
    select: {
      id: true,
      
      fileKey: true,
      visibility: true,
      status: true,
      updatedAt: true,
      createdAt: true,
    },
  })
  const photoMap = new Map(photos.map((photo) => [photo.id, photo]))

  return jobs.map((job) => {
    const photo = job.data?.photoId ? photoMap.get(job.data.photoId) : undefined
    const fileName = photo?.fileKey ?? job.data?.fileKey ?? `任务 ${job.id}`
    const createdAt = job.timestamp ? new Date(job.timestamp).toISOString() : new Date().toISOString()
    const updatedAt = job.processedOn ? new Date(job.processedOn).toISOString() : createdAt

    return {
      id: `queue-${job.id}`,
      jobId: job.id ?? null,
      photoId: job.data?.photoId ?? null,
      fileName,
      status,
      progress: typeof job.progress === 'number' ? job.progress : 0,
      attempts: job.attemptsMade ?? 0,
      visibility: (photo?.visibility as 'PUBLIC' | 'PRIVATE') ?? undefined,
      userId: job.data?.userId ?? null,
      createdAt,
      updatedAt,
      thumbUrl: photo && photo.status === 'COMPLETED' ? `/api/image/${photo.id}/thumb?format=webp` : null,
      error: job.failedReason ?? undefined,
      deduplicatedFrom: job.returnvalue?.deduplicatedFrom ?? undefined,
      meta: job.data,
    }
  })
}

async function buildCompletedGroup(): Promise<UploadQueueGroupDto> {
  const photos = await db.photo.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 12,
    select: {
      id: true,
      
      fileKey: true,
      visibility: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  const items: UploadQueueItemDto[] = photos.map((photo) => ({
    id: `completed-${photo.id}`,
    jobId: null,
    photoId: photo.id,
    fileName: photo.fileKey,
    status: 'completed',
    progress: 100,
    visibility: photo.visibility as 'PUBLIC' | 'PRIVATE',
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
    thumbUrl: `/api/image/${photo.id}/thumb?format=webp`,
  }))

  return {
    id: 'completed',
    title: '已完成',
    description: '最近完成的上传与处理任务。',
    total: items.length,
    items,
  }
}

async function buildFailedGroup(): Promise<UploadQueueGroupDto> {
  const photos = await db.photo.findMany({
    where: { status: 'FAILED' },
    orderBy: { updatedAt: 'desc' },
    take: 12,
    select: {
      id: true,
      
      fileKey: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  const items: UploadQueueItemDto[] = photos.map((photo) => ({
    id: `failed-${photo.id}`,
    jobId: null,
    photoId: photo.id,
    fileName: photo.fileKey,
    status: 'failed',
    progress: 0,
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
    thumbUrl: null,
  }))

  return {
    id: 'failed',
    title: '异常任务',
    description: '最近失败的处理任务，建议复查日志并重试。',
    total: items.length,
    items,
  }
}

async function countCompletedLast24h(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return db.photo.count({ where: { status: 'COMPLETED', updatedAt: { gte: since } } })
}

function readStorageLimit(): number | null {
  for (const key of STORAGE_LIMIT_ENV_KEYS) {
    const raw = process.env[key]
    if (!raw) continue
    const value = Number(raw)
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return null
}

function mapAuditSeverity(action: string): UploadTimelineEntryDto['severity'] {
  switch (action) {
    case 'UPLOAD_FAILED':
    case 'UPLOAD_EMBED_FAILED':
      return 'error'
    case 'UPLOAD_PROCESSED':
    case 'UPLOAD_DEDUPED':
    case 'UPLOAD_EMBEDDED':
      return 'success'
    default:
      return 'info'
  }
}

function mapAuditTitle(action: string): string {
  switch (action) {
    case 'UPLOAD':
      return '上传已提交'
    case 'UPLOAD_PROCESSED':
      return '图像处理完成'
    case 'UPLOAD_DEDUPED':
      return '复用历史处理结果'
    case 'UPLOAD_FAILED':
      return '上传处理失败'
    case 'UPLOAD_EMBEDDED':
      return '嵌入生成完成'
    case 'UPLOAD_EMBED_FAILED':
      return '嵌入生成失败'
    default:
      return action
  }
}

function buildAuditDescription(action: string, meta: unknown): string | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  const record = meta as Record<string, unknown>
  if (action === 'UPLOAD' && typeof record.fileKey === 'string') {
    return record.fileKey
  }
  if (action === 'UPLOAD_FAILED' && typeof record.error === 'string') {
    return record.error
  }
  if (action === 'UPLOAD_DEDUPED' && typeof record.deduplicatedFrom === 'string') {
    return `复用 ${record.deduplicatedFrom}`
  }
  return undefined
}




