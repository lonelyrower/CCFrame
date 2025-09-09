import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { ExifProcessor } from '@/lib/exif'
import { ImageProcessor } from '@/lib/image-processing'
import { generateImageBuffer } from '@/lib/ai-generate'
import { getAutoTagConfig } from '@/lib/settings'
import { aiProcessingQueue } from '@/jobs/queue'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const prompt: string = body?.prompt || ''
    const provider: 'auto' | 'openai' = body?.provider || 'auto'
    if (!prompt) return NextResponse.json({ error: '缺少提示词' }, { status: 400 })

    // 1) 生成图像
    const genBuf = await generateImageBuffer(prompt, provider, '1024')

    // 2) 保存原图到存储
    const storage = getStorageManager()
    const originalKey = StorageManager.generateKey('originals', `gen_${Date.now()}.png`)
    await storage.uploadBuffer(originalKey, genBuf, 'image/png')

    // 3) 写入占位 Photo 记录
    const photo = await db.photo.create({
      data: {
        fileKey: originalKey,
        hash: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        width: 0,
        height: 0,
        userId: session.user.id,
        albumId: null,
        status: 'PROCESSING',
        visibility: 'PRIVATE',
      },
    })

    // Exact dedup for this user
    const contentHash = await ImageProcessor.calculateContentHash(genBuf)
    const duplicate = await db.photo.findFirst({ where: { userId: session.user.id, contentHash, status: 'COMPLETED' }, include: { variants: true } })

    // 4) 本地处理变体/EXIF/blurhash（若不是重复）
    let exifData: any = null
    let variants: any[] = []
    let blurhash: string | undefined
    let metadata: any = {}
    if (!duplicate) {
      exifData = await ExifProcessor.extractExif(genBuf)
      const p = await ImageProcessor.processImage(genBuf)
      variants = p.variants
      blurhash = p.blurhash
      metadata = p.metadata
    }

    const variantRecords: any[] = []
    if (!duplicate) {
      for (const v of variants) {
        const variantKey = `variants/${photo.id}/${v.variant}.${v.format}`
        await storage.uploadBuffer(variantKey, v.buffer, `image/${v.format}`)
        variantRecords.push({ variant: v.variant, format: v.format, width: v.width, height: v.height, fileKey: variantKey, sizeBytes: v.size })
      }
    }

    if (duplicate) {
      // Remove uploaded original; reuse existing
      try { await storage.deleteObject(originalKey) } catch {}
      await db.photo.update({ where: { id: photo.id }, data: {
        fileKey: duplicate.fileKey,
        hash: duplicate.hash,
        contentHash: duplicate.contentHash,
        width: duplicate.width,
        height: duplicate.height,
        blurhash: duplicate.blurhash || null,
        exifJson: duplicate.exifJson as any,
        status: 'COMPLETED',
        variants: { createMany: { data: duplicate.variants.map((v: any) => ({ variant: v.variant, format: v.format, width: v.width, height: v.height, fileKey: v.fileKey, sizeBytes: v.sizeBytes })) } },
      } })
    } else {
      await db.photo.update({ where: { id: photo.id }, data: {
        hash: await ImageProcessor.calculateHash(genBuf),
        contentHash,
        width: metadata.width || 0,
        height: metadata.height || 0,
        blurhash,
        exifJson: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
        status: 'COMPLETED',
        variants: { createMany: { data: variantRecords } },
      } })
    }

    // Schedule auto-tagging if enabled
    try {
      const conf = await getAutoTagConfig()
      if (conf.enabled) {
        const job = await db.job.create({
          data: {
            type: 'AI_AUTO_TAG' as any,
            payloadJson: { photoId: photo.id, includeColors: conf.includeColors, includeContent: conf.includeContent } as any,
            userId: session.user.id,
            status: 'PENDING',
            progress: 0,
          }
        })
        await aiProcessingQueue.add('ai-process', { jobId: job.id, photoId: photo.id, taskType: 'AI_AUTO_TAG' as any, params: { includeColors: conf.includeColors, includeContent: conf.includeContent } })
      }
    } catch (e) {
      console.warn('Auto-tag schedule failed (gen):', e)
    }

    return NextResponse.json({ photoId: photo.id })
  } catch (e) {
    console.error('AI generate error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
