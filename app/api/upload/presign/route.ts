import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { db } from '@/lib/db'
import { z } from 'zod'

const uploadRequestSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  albumId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filename, contentType, size, albumId } = uploadRequestSchema.parse(body)

    // Validate content type
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    // Validate album ownership if provided
    if (albumId) {
      const album = await db.album.findFirst({
        where: { id: albumId, userId: session.user.id }
      })
      if (!album) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 })
      }
    }

    // Generate file key
    const fileKey = StorageManager.generateKey('originals', filename)

    // Create photo record
    const photo = await db.photo.create({
      data: {
        fileKey,
        hash: '', // Will be set during processing
        width: 0, // Will be set during processing
        height: 0, // Will be set during processing
        userId: session.user.id,
        albumId,
        status: 'UPLOADING'
      }
    })

    // Get presigned URL
    const storage = getStorageManager()
    const uploadUrl = await storage.getPresignedUploadUrl(fileKey, contentType)

    return NextResponse.json({
      photoId: photo.id,
      uploadUrl,
      fileKey
    })
  } catch (error) {
    console.error('Upload presign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
