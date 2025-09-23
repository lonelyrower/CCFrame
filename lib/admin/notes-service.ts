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

  const note = await db.photoNote.findUnique({
    where: { photoId_userId: { photoId, userId } },
  })

  return {
    photoId,
    note: note?.note ?? '',
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

  const record = await db.photoNote.upsert({
    where: { photoId_userId: { photoId, userId } },
    create: {
      photoId,
      userId,
      note,
    },
    update: {
      note,
    },
  })

  return {
    photoId: record.photoId,
    note: record.note,
    updatedAt: record.updatedAt,
  }
}
