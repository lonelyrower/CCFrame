import { NextRequest, NextResponse } from 'next/server'
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

    if (!VALID_VARIANTS.has(variant)) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
    }

    // Try to find the exact requested variant/format, then fall back through formats
    const formatsToTry = [requestedFormat, ...FORMAT_ORDER.filter(f => f !== requestedFormat)]

    let record = null as null | {
      fileKey: string
      format: string
    }

    for (const fmt of formatsToTry) {
      const found = await db.photoVariant.findFirst({
        where: {
          photoId: id,
          variant,
          format: fmt,
        },
        select: { fileKey: true, format: true },
      })
      if (found) {
        record = found
        break
      }
    }

    // Optional: try original as last resort
    if (!record) {
      const original = await db.photoVariant.findFirst({
        where: { photoId: id, variant: 'original' },
        select: { fileKey: true, format: true },
      })
      if (original) record = original
    }

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

