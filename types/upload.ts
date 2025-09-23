export type UploadQueueStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface UploadQueueItemDto {
  id: string
  jobId?: string | number | null
  photoId?: string | null
  fileName: string
  status: UploadQueueStatus
  progress: number
  attempts?: number
  visibility?: 'PUBLIC' | 'PRIVATE'
  userId?: string | null
  createdAt: string
  updatedAt: string
  thumbUrl?: string | null
  error?: string | null
  deduplicatedFrom?: string | null
  meta?: Record<string, unknown>
}

export interface UploadQueueGroupDto {
  id: 'queued' | 'processing' | 'completed' | 'failed'
  title: string
  description?: string
  total: number
  items: UploadQueueItemDto[]
}

export interface UploadQueueCountsDto {
  queued: number
  processing: number
  failed: number
  completed24h: number
}

export interface UploadGuardInfoDto {
  storageUsedBytes: number
  storageLimitBytes?: number | null
  percentUsed: number
  approachingLimit: boolean
  message: string
}

export interface UploadQueueSnapshotDto {
  counts: UploadQueueCountsDto
  groups: UploadQueueGroupDto[]
  guard: UploadGuardInfoDto
  generatedAt: string
}

export interface UploadTimelineEntryDto {
  id: string
  type: string
  title: string
  description?: string
  timestamp: string
  severity: 'info' | 'success' | 'warning' | 'error'
  photoId?: string | null
  userId?: string | null
  meta?: Record<string, unknown>
}
