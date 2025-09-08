import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'

export const dynamic = 'force-dynamic'

const VALID_VARIANTS = new Set(['thumb', 'small', 'medium', 'large', 'original'])
const FORMAT_ORDER = ['webp', 'jpeg', 'avif'] as const

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; variant: string } }
) {
  try {
    const { id, variant } = params
    if (!id || !variant) {
      return NextResponse.json({ error: 'Missing id or variant' }, { status: 400 })
    }

    const url = new URL(req.url)
    const requestedFormat = (url.searchParams.get('format') || 'webp').toLowerCase()

    // Support legacy alias "thumbnail" => "thumb"
    const reqVariant = variant === 'thumbnail' ? 'thumb' : variant

    if (!VALID_VARIANTS.has(reqVariant)) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
    }

    // Load photo with variants for permission check and selection
    const photo = await db.photo.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    })
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Enforce access for private photos
    if (photo.visibility === 'PRIVATE') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || session.user.id !== photo.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Try to find the exact requested variant/format, then fall back through formats
    const formatsToTry = [requestedFormat, ...FORMAT_ORDER.filter((f) => f !== requestedFormat)]
    const sizePreference: Record<string, string[]> = {
      thumb: ['thumb', 'small', 'medium', 'large'],
      small: ['small', 'medium', 'thumb', 'large'],
      medium: ['medium', 'small', 'large', 'thumb'],
      large: ['large', 'medium', 'small', 'thumb'],
      original: ['original'],
    }
    const sizes = sizePreference[reqVariant] || [reqVariant, 'small', 'medium', 'large', 'thumb']
    const record = sizes
      .map((sz) => formatsToTry.map((fmt) => photo.variants.find((v) => v.variant === sz && v.format === fmt)).find(Boolean))
      .find(Boolean)

    if (!record) {
      return NextResponse.json({ error: 'Image variant not found' }, { status: 404 })
    }

    const storage = getStorageManager()

    // Generate a signed download URL (works for private buckets and public alike)
    const signedUrl = await storage.getPresignedDownloadUrl(record.fileKey)

    // Let Next/Image fetch via redirect; cache aggressively at the edge and browser
    const res = NextResponse.redirect(signedUrl, { status: 302 })
    res.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return res
  } catch (err) {
    console.error('Image serve error:', err)
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 })
  }
}
