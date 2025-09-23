import { Prisma } from '@prisma/client'
import { differenceInMinutes } from 'date-fns'

import { db } from '@/lib/db'
import type { AdminTaskCenter, AdminTaskCenterSummary, AdminTaskGroup, AdminTaskItem } from '@/types/admin'

const STALLED_UPLOAD_THRESHOLD_MINUTES = 30

interface UploadTaskSource {
  id: string
  fileKey: string
  status: string
  createdAt: Date
  updatedAt: Date
  albumTitle: string | null
}

interface PendingReviewSource {
  id: string
  fileKey: string
  createdAt: Date
  albumTitle: string | null
}

interface DraftReviewSource {
  id: string
  fileKey: string
  updatedAt: Date
  albumTitle: string | null
}

interface ConfigSecretSource {
  id: string
  email: string
  createdAt: Date
}

interface ConfigAlertSource {
  id: string
  action: string
  createdAt: Date
  targetType: string | null
  targetId: string | null
  meta: Prisma.JsonValue | null
}

function formatAlbumTitle(albumTitle?: string | null) {
  if (!albumTitle) return '未归档'
  return albumTitle
}

function createUploadGroup(failedUploads: UploadTaskSource[], stalledUploads: UploadTaskSource[]): AdminTaskGroup {
  const failedTasks: AdminTaskItem[] = failedUploads.map((upload) => ({
    id: `upload-failed-${upload.id}`,
    title: '上传失败，等待处理',
    description: upload.fileKey,
    href: `/admin/upload?panel=errors&focus=${upload.id}`,
    actionLabel: '查看详情',
    severity: 'critical',
    createdAt: upload.updatedAt,
    meta: [
      { label: '相册', value: formatAlbumTitle(upload.albumTitle) },
    ],
  }))

  const stalledTasks: AdminTaskItem[] = stalledUploads.map((upload) => ({
    id: `upload-stalled-${upload.id}`,
    title: upload.status === 'UPLOADING' ? '上传卡住，建议重试' : '处理耗时异常',
    description: upload.fileKey,
    href: `/admin/upload?panel=queue&focus=${upload.id}`,
    actionLabel: '打开队列',
    severity: 'warning',
    createdAt: upload.updatedAt,
    meta: [
      { label: '状态', value: upload.status },
      {
        label: '已等待',
        value: `${differenceInMinutes(new Date(), upload.updatedAt)} 分钟`,
      },
    ],
  }))

  const tasks = [...failedTasks, ...stalledTasks].slice(0, 8)

  return {
    id: 'uploads',
    title: '上传任务',
    description: '监控上传与处理流水线的失败与阻塞任务。',
    emptyState: {
      title: '上传队列健康',
      description: '当前没有失败或阻塞的上传任务。',
      actionHref: '/admin/upload',
      actionLabel: '前往上传中心',
    },
    tasks,
    total: failedUploads.length + stalledUploads.length,
  }
}

function createReviewGroup(pendingReview: PendingReviewSource[], privateDrafts: DraftReviewSource[]): AdminTaskGroup {
  const reviewTasks: AdminTaskItem[] = pendingReview.map((photo) => ({
    id: `review-${photo.id}`,
    title: '等待审核',
    description: `${photo.fileKey} 待完成标签或信息确认。`,
    href: `/admin/library?focus=${photo.id}&view=detail`,
    actionLabel: '打开详情',
    severity: 'warning',
    createdAt: photo.createdAt,
    meta: [{ label: '相册', value: formatAlbumTitle(photo.albumTitle) }],
  }))

  const draftTasks: AdminTaskItem[] = privateDrafts.map((photo) => ({
    id: `draft-${photo.id}`,
    title: '私密作品待发布',
    description: `${photo.fileKey} 仍为私密状态。`,
    href: `/admin/library?visibility=PRIVATE&focus=${photo.id}`,
    actionLabel: '调整可见性',
    severity: 'info',
    createdAt: photo.updatedAt,
    meta: [{ label: '相册', value: formatAlbumTitle(photo.albumTitle) }],
  }))

  const tasks = [...reviewTasks, ...draftTasks].slice(0, 8)

  return {
    id: 'review',
    title: '审核与发布',
    description: '跟进等待审核的内容与仍为私密的作品。',
    emptyState: {
      title: '作品均已发布',
      description: '暂无等待审核或待发布的作品。',
      actionHref: '/admin/library',
      actionLabel: '打开作品库',
    },
    tasks,
    total: pendingReview.length + privateDrafts.length,
  }
}

function createConfigGroup(adminsMissingSecrets: ConfigSecretSource[], recentAlerts: ConfigAlertSource[]): AdminTaskGroup {
  const missingSecretTasks: AdminTaskItem[] = adminsMissingSecrets.map((user) => ({
    id: `config-secret-${user.id}`,
    title: '管理员缺少 Pixabay API Key',
    description: user.email,
    href: '/admin/settings/integrations',
    actionLabel: '补充密钥',
    severity: 'warning',
    createdAt: user.createdAt,
  }))

  const alertTasks: AdminTaskItem[] = recentAlerts.map((alert) => ({
    id: `config-alert-${alert.id}`,
    title: '系统告警',
    description: `${alert.action.toLowerCase()} · ${alert.targetType ?? 'system'}`,
    href: '/admin/system-health?view=alerts',
    actionLabel: '查看告警',
    severity: 'critical',
    createdAt: alert.createdAt,
    meta: alert.targetId
      ? [{ label: '目标', value: alert.targetId }]
      : undefined,
  }))

  const tasks = [...alertTasks, ...missingSecretTasks].slice(0, 8)

  return {
    id: 'configuration',
    title: '配置与系统健康',
    description: '追踪外部服务配置与系统告警。',
    emptyState: {
      title: '配置健康',
      description: '所有关键配置均已填写，近期无系统告警。',
      actionHref: '/admin/settings',
      actionLabel: '检查设置',
    },
    tasks,
    total: alertTasks.length + missingSecretTasks.length,
  }
}

export async function getTaskGroups(): Promise<AdminTaskCenter> {
  const [uploadContext, reviewContext, configContext] = await Promise.all([
    loadUploadContext(),
    loadReviewContext(),
    loadConfigContext(),
  ])

  const uploadsGroup = createUploadGroup(uploadContext.failedUploads, uploadContext.stalledUploads)
  const reviewGroup = createReviewGroup(reviewContext.pendingReview, reviewContext.privateDrafts)
  const configGroup = createConfigGroup(configContext.adminsMissingSecrets, configContext.recentAlerts)

  const groups = [uploadsGroup, reviewGroup, configGroup]
  const allTasks = groups.flatMap((group) => group.tasks)

  const summary: AdminTaskCenterSummary = {
    totalPending: groups.reduce((acc, group) => acc + group.total, 0),
    critical: allTasks.filter((task) => task.severity === 'critical').length,
    warning: allTasks.filter((task) => task.severity === 'warning').length,
  }

  return { groups, summary }
}

async function loadUploadContext() {
  const [failedUploadsRaw, stalledUploadsRaw] = await Promise.all([
    db.photo.findMany({
      where: { status: 'FAILED' },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        fileKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        album: { select: { title: true } },
      },
    }),
    db.photo.findMany({
      where: {
        status: { in: ['UPLOADING', 'PROCESSING'] },
        updatedAt: {
          lt: new Date(Date.now() - STALLED_UPLOAD_THRESHOLD_MINUTES * 60 * 1000),
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        fileKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        album: { select: { title: true } },
      },
    }),
  ])

  const failedUploads: UploadTaskSource[] = failedUploadsRaw.map((upload) => ({
    id: upload.id,
    fileKey: upload.fileKey,
    status: upload.status,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
    albumTitle: upload.album?.title ?? null,
  }))
  const stalledUploads: UploadTaskSource[] = stalledUploadsRaw.map((upload) => ({
    id: upload.id,
    fileKey: upload.fileKey,
    status: upload.status,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
    albumTitle: upload.album?.title ?? null,
  }))

  return { failedUploads, stalledUploads }
}

async function loadReviewContext() {
  const [pendingReviewRaw, privateDraftsRaw] = await Promise.all([
    db.photo.findMany({
      where: { status: 'PROCESSING' },
      orderBy: { createdAt: 'asc' },
      take: 12,
      select: {
        id: true,
        fileKey: true,
        createdAt: true,
        album: { select: { title: true } },
      },
    }),
    db.photo.findMany({
      where: { status: 'COMPLETED', visibility: 'PRIVATE' },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        fileKey: true,
        updatedAt: true,
        album: { select: { title: true } },
      },
    }),
  ])

  const pendingReview: PendingReviewSource[] = pendingReviewRaw.map((photo) => ({
    id: photo.id,
    fileKey: photo.fileKey,
    createdAt: photo.createdAt,
    albumTitle: photo.album?.title ?? null,
  }))
  const privateDrafts: DraftReviewSource[] = privateDraftsRaw.map((photo) => ({
    id: photo.id,
    fileKey: photo.fileKey,
    updatedAt: photo.updatedAt,
    albumTitle: photo.album?.title ?? null,
  }))

  return { pendingReview, privateDrafts }
}

async function loadConfigContext() {
  const [adminsMissingSecretsRaw, recentAlertsRaw] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [{ pixabayApiKey: null }, { pixabayApiKey: '' }],
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      take: 12,
    }),
    db.audit.findMany({
      where: {
        action: { in: ['ERROR', 'ALERT', 'WARNING'] },
        createdAt: {
          gte: new Date(Date.now() - 72 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        action: true,
        createdAt: true,
        targetType: true,
        targetId: true,
        meta: true,
      },
    }),
  ])

  const adminsMissingSecrets: ConfigSecretSource[] = adminsMissingSecretsRaw.map((user) => ({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  }))
  const recentAlerts: ConfigAlertSource[] = recentAlertsRaw.map((alert) => ({
    id: alert.id,
    action: alert.action,
    createdAt: alert.createdAt,
    targetType: alert.targetType ?? null,
    targetId: alert.targetId ?? null,
    meta: alert.meta ?? null,
  }))

  return { adminsMissingSecrets, recentAlerts }
}



