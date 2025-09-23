import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getTaskGroups } from './task-center'
import type { AdminActivityItem, AdminDashboardMetrics, AdminDashboardSnapshot, AdminRecentUploadItem } from '@/types/admin'


export async function getDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const [metrics, taskCenter, activity, recentUploads] = await Promise.all([
    loadMetrics(),
    getTaskGroups(),
    loadActivityFeed(),
    loadRecentUploads(),
  ])

  return {
    metrics,
    taskCenter,
    activity,
    recentUploads,
  }
}

async function loadMetrics(): Promise<AdminDashboardMetrics> {
  const [photoStats, albumTotal, publicPhotos, privatePhotos, processing, failed, recent7d, variantSum] = await Promise.all([
    db.photo.count({ where: { status: 'COMPLETED' } }),
    db.album.count(),
    db.photo.count({ where: { status: 'COMPLETED', visibility: 'PUBLIC' } }),
    db.photo.count({ where: { status: 'COMPLETED', visibility: 'PRIVATE' } }),
    db.photo.count({ where: { status: { in: ['UPLOADING', 'PROCESSING'] } } }),
    db.photo.count({ where: { status: 'FAILED' } }),
    db.photo.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    db.photoVariant.aggregate({
      _sum: { sizeBytes: true },
    }),
  ])

  return {
    totalPhotos: photoStats,
    totalAlbums: albumTotal,
    publicPhotos,
    privatePhotos,
    processing,
    failedUploads: failed,
    recentUploads: recent7d,
    storageUsedBytes: variantSum._sum.sizeBytes ?? 0,
  }
}

async function loadActivityFeed(): Promise<AdminActivityItem[]> {
  const audits = await db.audit.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      meta: true,
    },
  })

  return audits.map((audit) => ({
    id: audit.id,
    title: actionLabel(audit.action),
    description: buildAuditDescription(audit.targetType, audit.targetId, audit.meta),
    timestamp: audit.createdAt,
    href: audit.targetType === 'photo' ? `/admin/library?focus=${audit.targetId}` : undefined,
    icon: auditIcon(audit.action, audit.targetType),
  }))
}

async function loadRecentUploads(): Promise<AdminRecentUploadItem[]> {
  const photos = await db.photo.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    take: 9,
    select: {
      id: true,
      fileKey: true,
      visibility: true,
      createdAt: true,
      album: { select: { title: true } },
    },
  })

  return photos.map((photo) => ({
    id: photo.id,
    title: photo.fileKey,
    visibility: photo.visibility as 'PUBLIC' | 'PRIVATE',
    createdAt: photo.createdAt,
    albumTitle: photo.album?.title ?? null,
    thumbUrl: `/api/image/${photo.id}/thumb?format=webp`,
  }))
}

function actionLabel(action: string): string {
  switch (action) {
    case 'UPLOAD':
      return '上传完成'
    case 'DELETE':
      return '内容已删除'
    case 'EXPORT':
      return '导出任务'
    case 'LOGIN':
      return '管理员登录'
    case 'ERROR':
      return '系统错误'
    case 'WARNING':
      return '系统警告'
    case 'ALERT':
      return '告警触发'
    default:
      return action.toLowerCase()
  }
}

function buildAuditDescription(targetType?: string | null, targetId?: string | null, meta?: Prisma.JsonValue | null): string | undefined {
  const parts: string[] = []
  if (targetType) {
    parts.push(targetType)
  }
  if (targetId) {
    parts.push(`#${targetId}`)
  }
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const metaSummary = Object.entries(meta as Record<string, unknown>)
      .filter(([, value]) => value !== null && value !== undefined)
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(' · ')
    if (metaSummary) {
      parts.push(metaSummary)
    }
  }
  return parts.length > 0 ? parts.join(' · ') : undefined
}

function auditIcon(action: string, targetType?: string | null): string | undefined {
  if (action === 'UPLOAD') return 'upload'
  if (action === 'DELETE') return 'trash'
  if (action === 'ERROR' || action === 'WARNING' || action === 'ALERT') return 'alert'
  if (targetType === 'photo') return 'photo'
  if (targetType === 'album') return 'album'
  return undefined
}






