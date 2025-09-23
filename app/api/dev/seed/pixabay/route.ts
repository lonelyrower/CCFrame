import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { getLocalStorageManager, LocalStorageManager } from '@/lib/local-storage'
import { ImageProcessor } from '@/lib/image-processing'
import { ExifProcessor } from '@/lib/exif'

// 可配置的导入数量上限
const HARD_MAX_SEED = Number(process.env.SEED_HARD_MAX || '50')
const CONFIG_MAX_SEED = Math.min(
  Math.max(1, Number(process.env.SEED_MAX_COUNT || '5')),
  HARD_MAX_SEED
)

const DEV_SEED_TOKEN = process.env.DEV_SEED_TOKEN || process.env.SEED_TOKEN || ''
const SEED_ALLOWED_IPS = (process.env.SEED_ALLOWED_IPS || '')
  .split(',')
  .map(ip => ip.trim())
  .filter(Boolean)

function extractClientIp(request: NextRequest): string | null {
  return request.ip
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 简化的权限验证：只要是登录用户就可以使用
    // 可选的额外安全层：如果设置了DEV_SEED_TOKEN，仍然验证
    if (DEV_SEED_TOKEN) {
      const providedToken = request.headers.get('x-seed-token') || ''
      if (providedToken !== DEV_SEED_TOKEN) {
        return NextResponse.json({ error: 'Token验证失败' }, { status: 403 })
      }
    }

    // 获取用户的API Key设置和默认导入数量
    const user = (await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, pixabayApiKey: true, defaultSeedCount: true } as any,
    } as any)) as { id: string; pixabayApiKey: string | null; defaultSeedCount?: number | null } | null

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const clientIp = extractClientIp(request)
    if (SEED_ALLOWED_IPS.length > 0 && (!clientIp || !SEED_ALLOWED_IPS.includes(clientIp))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    // API Key已在上面的user查询中获取
    let apiKey = user?.pixabayApiKey ?? process.env.PIXABAY_API_KEY
    if (!apiKey) {
      console.error('PIXABAY_API_KEY未设置，无法导入示例图片')
      return NextResponse.json({
        error: 'Pixabay API Key 未设置。请在管理设置 > API 配置中配置您的 API Key，或者联系管理员设置PIXABAY_API_KEY环境变量。'
      }, { status: 400 })
    }
    const query = (body.query as string) || 'nature'
    // 允许通过环境变量配置最大导入数量，仍保留一个硬上限以防误配
    // 使用用户设置的默认数量，如果未设置则使用请求中的数量
    const userDefaultCount = user?.defaultSeedCount ?? 12
    const requested = Number(body.count || userDefaultCount)
    // 提高默认最大限制到30，或使用环境变量
    const maxAllowed = Math.min(Number(process.env.SEED_MAX_COUNT || '30'), HARD_MAX_SEED)
    const count = Math.min(Math.max(1, requested), maxAllowed)
    const visibility = (body.visibility as 'PUBLIC' | 'PRIVATE') || 'PUBLIC'

    console.log(`开始导入示例图片: 查询="${query}", 数量=${count}, 环境=${process.env.NODE_ENV}`)
    console.log(`存储配置: STORAGE_PROVIDER=${process.env.STORAGE_PROVIDER || 'local'}`)

    const searchUrl = new URL('https://pixabay.com/api/')
    searchUrl.searchParams.set('key', apiKey)
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('image_type', 'photo')
    searchUrl.searchParams.set('per_page', String(count))
    searchUrl.searchParams.set('safesearch', 'true')

    const res = await fetch(searchUrl.toString())
    if (!res.ok) {
      return NextResponse.json({ error: `Pixabay error: ${res.statusText}` }, { status: 502 })
    }
    const data = await res.json()
    const hits: any[] = data.hits || []
    if (hits.length === 0) {
      return NextResponse.json({ seeded: 0 })
    }

    // 尝试使用配置的存储，如果初始化或上传失败则降级到本地存储
    let storage: any
    try {
      storage = getStorageManager()
    } catch (error) {
      console.warn('Primary storage init failed, fallback to local:', error)
      storage = getLocalStorageManager()
    }

    let seeded = 0
    for (const hit of hits) {
      try {
        const imageUrl: string = hit.largeImageURL || hit.webformatURL || hit.previewURL
        if (!imageUrl) continue

        // Download image
        const imgResp = await fetch(imageUrl)
        if (!imgResp.ok) continue
        const buffer = Buffer.from(await imgResp.arrayBuffer())

        // Exact dedup by content hash for this user
        const contentHash = await ImageProcessor.calculateContentHash(buffer)
        const duplicate = await db.photo.findFirst({ where: { userId: session.user.id, contentHash, status: 'COMPLETED' }, include: { variants: true } })

        // Generate file key for original
        const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
        let originalKey = (storage.generateKey || StorageManager.generateKey || LocalStorageManager.generateKey)('originals', `pixabay_${Date.now()}.${ext}`)
        try {
          await storage.uploadBuffer(originalKey, buffer, `image/${ext === 'jpg' ? 'jpeg' : ext}`)
        } catch (uploadErr) {
          // 开发环境常见：S3/MinIO 未启动或桶未创建；自动降级到本地存储
          console.warn('Primary storage upload failed, switching to local storage:', uploadErr)
          storage = getLocalStorageManager()
          originalKey = (storage.generateKey || LocalStorageManager.generateKey)('originals', `pixabay_${Date.now()}.${ext}`)
          await storage.uploadBuffer(originalKey, buffer, `image/${ext === 'jpg' ? 'jpeg' : ext}`)
        }

        // Create photo record (placeholder)
        const photo = await db.photo.create({
          data: {
            fileKey: originalKey,
            // 临时唯一哈希占位，避免唯一索引冲突
            hash: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            width: 0,
            height: 0,
            userId: session.user.id,
            albumId: null,
            status: 'PROCESSING',
            visibility,
          },
        })

        if (duplicate) {
          // Delete just uploaded original
          try { await storage.deleteObject(originalKey) } catch {}
          await db.photo.update({ where: { id: photo.id }, data: {
            fileKey: duplicate.fileKey,
            hash: duplicate.hash,
            contentHash: duplicate.contentHash,
            width: duplicate.width,
            height: duplicate.height,
            blurhash: duplicate.blurhash,
            exifJson: duplicate.exifJson as any,
            takenAt: duplicate.takenAt,
            location: duplicate.location as any,
            status: 'COMPLETED',
            variants: { createMany: { data: duplicate.variants.map((v: any) => ({ variant: v.variant, format: v.format, width: v.width, height: v.height, fileKey: v.fileKey, sizeBytes: v.sizeBytes })) } },
          } })
        } else {
          // Process image (variants, exif, blurhash)
          const exifData = await ExifProcessor.extractExif(buffer)
          const { variants, blurhash, metadata } = await ImageProcessor.processImage(buffer)
          // Upload variants
          const variantRecords: any[] = []
          for (const v of variants) {
            let variantKey = `variants/${photo.id}/${v.variant}.${v.format}`
            try {
              await storage.uploadBuffer(variantKey, v.buffer, `image/${v.format}`)
            } catch (variantErr) {
              // 同样对变体上传失败做本地回退
              console.warn('Variant upload failed, switching to local storage:', variantErr)
              storage = getLocalStorageManager()
              variantKey = `variants/${photo.id}/${v.variant}.${v.format}`
              await storage.uploadBuffer(variantKey, v.buffer, `image/${v.format}`)
            }
            variantRecords.push({ variant: v.variant, format: v.format, width: v.width, height: v.height, fileKey: variantKey, sizeBytes: v.size })
          }
          // Update photo
          await db.photo.update({ where: { id: photo.id }, data: {
            hash: await ImageProcessor.calculateHash(buffer),
            contentHash,
            width: metadata.width || 0,
            height: metadata.height || 0,
            blurhash,
            exifJson: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
            takenAt: exifData?.takenAt,
            location: exifData?.location ? JSON.parse(JSON.stringify(exifData.location)) : undefined,
            status: 'COMPLETED',
            variants: { createMany: { data: variantRecords } },
          } })
        }

        seeded += 1
      } catch (e) {
        console.error('Seed one image failed:', e)
      }
    }

    return NextResponse.json({ seeded })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
