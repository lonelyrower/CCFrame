import { db } from '@/lib/db'

export interface PhotoNoteRecord {
  photoId: string
  note: string
  updatedAt: Date
}

export async function getPhotoNote(userId: string, photoId: string): Promise<PhotoNoteRecord | null> {
  const photo = await db.photo.findFirst({
    where: { id: photoId, userId },
    select: { id: true, updatedAt: true },
  })

  if (!photo) {
    return null
  }

  const note = await db.photoNote.findFirst({
    where: { photoId, userId },
  })

  return {
    photoId,
    note: note?.content ?? '',
    updatedAt: note?.updatedAt ?? photo.updatedAt,
  }
}

export async function updatePhotoNote(userId: string, photoId: string, note: string): Promise<PhotoNoteRecord> {
  const photo = await db.photo.findFirst({
    where: { id: photoId, userId },
    select: { id: true },
  })

  if (!photo) {
    throw new Error('UNAUTHORIZED')
  }

  const existing = await db.photoNote.findFirst({
    where: { photoId, userId },
  })

  const record = existing
    ? await db.photoNote.update({
        where: { id: existing.id },
        data: { content: note },
      })
    : await db.photoNote.create({
        data: {
          photoId,
          userId,
          content: note,
        },
      })

  return {
    photoId: record.photoId,
    note: record.content,
    updatedAt: record.updatedAt,
  }
}
