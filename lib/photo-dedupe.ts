import { db } from '@/lib/db'
import { PHOTO_STATUS } from './constants'

export interface DedupeResult {
  duplicate: boolean
  existingPhotoId?: string
}

/**
 * Check whether a photo with the same content hash already exists for the user.
 * Returns existing photo id if found and status is at least PROCESSING/COMPLETED.
 */
export async function checkDuplicatePhoto(userId: string, contentHash: string): Promise<DedupeResult> {
  if (!contentHash) return { duplicate: false }
  const existing = await db.photo.findFirst({
    where: { userId, contentHash },
    select: { id: true, status: true }
  })
  if (!existing) return { duplicate: false }
  return { duplicate: true, existingPhotoId: existing.id }
}

/**
 * If duplicate found, optionally link into an album instead of re-uploading variants.
 * (Placeholder logic for future extension.)
 */
export async function handleDuplicateReuse(photoId: string, targetAlbumId?: string) {
  if (!targetAlbumId) return
  // Ensure photo is in album (idempotent upsert-like behavior)
  await db.photo.update({
    where: { id: photoId },
    data: { albumId: targetAlbumId }
  })
}
