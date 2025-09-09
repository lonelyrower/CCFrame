import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { db } from '@/lib/db'
import { z } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const uploadRequestSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  albumId: z.string().optional(),
  contentHash: z.string().length(64).optional(), // hex sha256
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filename, contentType, size, albumId, contentHash } = uploadRequestSchema.parse(body)

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

    // If frontend provided contentHash, check exact duplicate for fast-path
    if (contentHash) {
      const dup = await db.photo.findFirst({ where: { userId: session.user.id, contentHash, status: 'COMPLETED' }, include: { variants: true } })
      if (dup) {
        // Create a new completed photo referencing existing files (no upload needed)
        const photo = await db.photo.create({
          data: {
            fileKey: dup.fileKey,
            hash: dup.hash,
            contentHash: dup.contentHash,
            width: dup.width,
            height: dup.height,
            userId: session.user.id,
            albumId,
            status: 'COMPLETED',
            blurhash: dup.blurhash,
            exifJson: dup.exifJson as any,
            takenAt: dup.takenAt,
            location: dup.location as any,
            variants: { createMany: { data: dup.variants.map((v: any) => ({ variant: v.variant, format: v.format, width: v.width, height: v.height, fileKey: v.fileKey, sizeBytes: v.sizeBytes })) } },
          }
        })
        return NextResponse.json({ photoId: photo.id, completed: true })
      }
    }

    // Generate file key
    const fileKey = StorageManager.generateKey('originals', filename)

    // Create photo record (uploading)
    const photo = await db.photo.create({
      data: {
        fileKey,
        hash: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        width: 0,
        height: 0,
        userId: session.user.id,
        albumId,
        status: 'UPLOADING'
      }
    })

    const storage = getStorageManager()
    const uploadUrl = await storage.getPresignedUploadUrl(fileKey, contentType)

    return NextResponse.json({ photoId: photo.id, uploadUrl, fileKey })
  } catch (error) {
    console.error('Upload presign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
