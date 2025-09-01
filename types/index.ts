import { Photo, Album, PhotoVariant, Tag, User, Job, EditVersion } from '@prisma/client'

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
  'AI_ENHANCEMENT',
  'AI_UPSCALE',
  'AI_REMOVE_BACKGROUND',
  'AI_STYLE_TRANSFER',
  'FACE_DETECTION',
] as const
export type JobType = typeof JobTypeValues[number]

export interface PhotoWithDetails extends Photo {
  variants: PhotoVariant[]
  tags: Array<{
    tag: Tag
  }>
  album?: Album | null
  _count?: {
    editVersions: number
  }
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

export interface AITask {
  id: string
  type: JobType
  status: JobStatus
  progress: number
  params: Record<string, any>
  result?: Record<string, any>
  error?: string
}

export interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}
