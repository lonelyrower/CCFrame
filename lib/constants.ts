// Centralized string constants & TypeScript literal unions for domain states/visibilities.
// Using const objects + types (instead of enum) for better tree-shaking and DX.

// Visibility levels used by Photo, Album, SmartAlbum
export const VISIBILITY = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE'
} as const
export type Visibility = typeof VISIBILITY[keyof typeof VISIBILITY]

// Photo processing lifecycle
export const PHOTO_STATUS = {
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const
export type PhotoStatus = typeof PHOTO_STATUS[keyof typeof PHOTO_STATUS]

// Background job types (extend over time)
export const JOB_TYPE = {
  THUMBNAIL_GENERATION: 'THUMBNAIL_GENERATION',
  EXIF_EXTRACTION: 'EXIF_EXTRACTION',
  VARIANT_GENERATION: 'VARIANT_GENERATION',
  HASH_COMPUTATION: 'HASH_COMPUTATION',
  FACE_DETECTION: 'FACE_DETECTION',
  EMBEDDING_GENERATION: 'EMBEDDING_GENERATION'
} as const
export type JobType = typeof JOB_TYPE[keyof typeof JOB_TYPE]

// Background job statuses
export const JOB_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const
export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS]

// Album sort direction or modes could be added later; placeholder for future extension

// Smart Album visibility uses VISIBILITY; rule operators could be centralized later

// Tag colors or defaults can live here if standardized

// Helper type guards (optional)
export function isPhotoStatus(v: any): v is PhotoStatus { return Object.values(PHOTO_STATUS).includes(v) }
export function isVisibility(v: any): v is Visibility { return Object.values(VISIBILITY).includes(v) }
export function isJobStatus(v: any): v is JobStatus { return Object.values(JOB_STATUS).includes(v) }
export function isJobType(v: any): v is JobType { return Object.values(JOB_TYPE).includes(v) }
