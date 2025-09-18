import { Photo, Album, PhotoVariant, Tag, User, Job } from '@prisma/client'

export type Visibility = 'PUBLIC' | 'PRIVATE'

export const JobStatusValues = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] as const
export type JobStatus = typeof JobStatusValues[number]

export const JobStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING', 
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const

export const JobTypeValues = [
  'THUMBNAIL_GENERATION',
  'EXIF_EXTRACTION',
  'FACE_DETECTION',
] as const
export type JobType = typeof JobTypeValues[number]

export interface PhotoWithDetails extends Photo {
  variants: PhotoVariant[]
  tags: Array<{
    tag: Tag
  }>
  album?: Album | null
  _count?: Record<string, number>
}

export interface AlbumWithDetails extends Album {
  photos: Photo[]
  coverPhoto?: Photo | null
  _count: {
    photos: number
  }
}

export interface JobWithDetails extends Job {
  user: User
}

export interface ViewMode {
  type: 'masonry' | 'grid' | 'lightbox' | 'timeline' | 'map'
  columns?: number
}

export interface ImageVariant {
  variant: string
  format: string
  url: string
  width: number
  height: number
}

export interface ExifData {
  camera?: string
  lens?: string
  focalLength?: number
  aperture?: number
  iso?: number
  shutterSpeed?: string
  takenAt?: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
}

// AI 编辑相关类型已移除

export interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}
