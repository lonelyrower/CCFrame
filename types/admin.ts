export type AdminTaskSeverity = 'info' | 'warning' | 'critical'

export interface AdminTaskMeta {
  label: string
  value: string
}

export interface AdminTaskEmptyState {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

export interface AdminTaskItem {
  id: string
  title: string
  description?: string
  href?: string
  actionLabel?: string
  severity: AdminTaskSeverity
  createdAt: Date
  meta?: AdminTaskMeta[]
}

export type AdminTaskItemDto = Omit<AdminTaskItem, 'createdAt'> & {
  createdAt: string
}

export interface AdminTaskGroup {
  id: string
  title: string
  description: string
  emptyState: AdminTaskEmptyState
  tasks: AdminTaskItem[]
  total: number
}

export type AdminTaskGroupDto = Omit<AdminTaskGroup, 'tasks'> & {
  tasks: AdminTaskItemDto[]
}

export interface AdminTaskCenterSummary {
  totalPending: number
  critical: number
  warning: number
}

export interface AdminTaskCenter {
  summary: AdminTaskCenterSummary
  groups: AdminTaskGroup[]
}

export interface AdminTaskCenterDto {
  summary: AdminTaskCenterSummary
  groups: AdminTaskGroupDto[]
}

export interface AdminDashboardMetrics {
  totalPhotos: number
  totalAlbums: number
  publicPhotos: number
  privatePhotos: number
  processing: number
  failedUploads: number
  recentUploads: number
  storageUsedBytes: number
}

export interface AdminActivityItem {
  id: string
  title: string
  description?: string
  timestamp: Date
  href?: string
  icon?: string
}

export type AdminActivityItemDto = Omit<AdminActivityItem, 'timestamp'> & {
  timestamp: string
}

export interface AdminRecentUploadItem {
  id: string
  title: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  createdAt: Date
  albumTitle?: string | null
  thumbUrl: string
}

export type AdminRecentUploadItemDto = Omit<AdminRecentUploadItem, 'createdAt'> & {
  createdAt: string
}

export interface AdminDashboardSnapshot {
  metrics: AdminDashboardMetrics
  taskCenter: AdminTaskCenter
  activity: AdminActivityItem[]
  recentUploads: AdminRecentUploadItem[]
}

export interface AdminDashboardSnapshotDto {
  metrics: AdminDashboardMetrics
  taskCenter: AdminTaskCenterDto
  activity: AdminActivityItemDto[]
  recentUploads: AdminRecentUploadItemDto[]
}
