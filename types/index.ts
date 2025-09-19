import { Photo, Album, PhotoVariant, Tag, User, Job } from '@prisma/client'
import { JOB_STATUS, JOB_TYPE, type JobStatus as JobStatusLiteral, type JobType as JobTypeLiteral, type Visibility, VISIBILITY } from '@/lib/constants'

export type { Visibility }
export type JobStatus = JobStatusLiteral
export type JobType = JobTypeLiteral
export { VISIBILITY }

export const JobStatusValues = Object.values(JOB_STATUS) as readonly JobStatus[]
export const JobStatus = JOB_STATUS

export const JobTypeValues = Object.values(JOB_TYPE) as readonly JobType[]
export const JobType = JOB_TYPE

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

// AI �༭����������Ƴ�

export interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

