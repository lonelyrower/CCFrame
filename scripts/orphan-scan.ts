#!/usr/bin/env -S node --no-warnings
import 'dotenv/config'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { logger } from '@/lib/logger'
import { ImageProcessor } from '@/lib/image-processing'
import { ExifProcessor } from '@/lib/exif'

interface Flags {
  autoFixMissing: boolean
  deleteOrphans: boolean
  dry: boolean
  concurrency: number
  limit: number
}

function parseFlags(argv: string[]): Flags {
  const m = new Map<string,string>()
  for (const a of argv) {
    const [k,v] = a.includes('=') ? a.split('=') : [a,'true']
    m.set(k.replace(/^--/, ''), v)
  }
  return {
    autoFixMissing: m.get('auto-fix-missing') === 'true',
    deleteOrphans: m.get('delete-orphans') === 'true',
    dry: m.get('dry') === 'true',
    concurrency: Math.max(1, parseInt(m.get('concurrency') || '3', 10)),
    limit: parseInt(m.get('limit') || '0', 10)
  }
}

interface ScanResult {
  missingFiles: Array<{ photoId: string; variant: string; format: string; expectedKey: string }>
  orphanObjects: string[]
  totalDbVariants: number
  totalStorageVariantObjects: number
  scannedPhotos: number
}

async function listAllVariantObjects(storage: any, prefix: string): Promise<string[]> {
  const out: string[] = []
  for await (const key of storage.listObjects(prefix)) {
    out.push(key)
  }
  return out
}

async function run() {
  const flags = parseFlags(process.argv.slice(2))
  const storage = getStorageManager()
  const photos = await db.photo.findMany({ select: { id: true, fileKey: true, blurhash: true, variants: { select: { variant: true, format: true, fileKey: true } } }, take: flags.limit && flags.limit > 0 ? flags.limit : undefined })
  const allVariantObjects = await listAllVariantObjects(storage, 'variants/')
  const objectSet = new Set(allVariantObjects)

  const missingFiles: ScanResult['missingFiles'] = []
  let totalDbVariants = 0
  photos.forEach(p => {
    p.variants.forEach(v => {
      totalDbVariants++
      if (!objectSet.has(v.fileKey)) {
        missingFiles.push({ photoId: p.id, variant: v.variant, format: v.format, expectedKey: v.fileKey })
      }
    })
  })

  // Orphan objects: exist in storage but not referenced in DB
  const dbKeys = new Set<string>(photos.flatMap(p => p.variants.map(v => v.fileKey)))
  const orphanObjects = allVariantObjects.filter(k => !dbKeys.has(k))

  const result: ScanResult = {
    missingFiles,
    orphanObjects,
    totalDbVariants,
    totalStorageVariantObjects: allVariantObjects.length,
    scannedPhotos: photos.length,
  }

  // If no fix flags, just output
  if (!flags.autoFixMissing && !flags.deleteOrphans) {
    logger.info({ ...result, missingCount: missingFiles.length, orphanCount: orphanObjects.length }, 'orphan-scan summary')
    console.log(JSON.stringify(result, null, 2))
    return
  }

  if (flags.dry) {
    logger.info({ dry: true, willFix: flags.autoFixMissing, willDelete: flags.deleteOrphans, missing: missingFiles.length, orphans: orphanObjects.length }, 'dry-run only')
    console.log(JSON.stringify({ mode: 'dry', ...result }, null, 2))
    return
  }

  // Process fixes
  let regenerated = 0
  let deleted = 0
  const imageProcessor = new ImageProcessor()
  const exifProcessor = new ExifProcessor()

  async function regenerateOne(entry: { photoId: string; variant: string; format: string; expectedKey: string }) {
    try {
      const photo = await db.photo.findUnique({ where: { id: entry.photoId } })
      if (!photo || !photo.fileKey) return
      const buf = await storage.getObjectBuffer(photo.fileKey)
      if (!buf) return
      const { variants, blurhash } = await ImageProcessor.processImage(buf)
      const match = variants.find(v => v.variant === entry.variant && v.format === entry.format)
      if (!match) return
      await storage.uploadBuffer(entry.expectedKey, match.buffer, `image/${match.format}`)
      await db.photoVariant.upsert({
        where: { photoId_variant_format: { photoId: entry.photoId, variant: entry.variant, format: entry.format } },
        create: { photoId: entry.photoId, variant: entry.variant, format: entry.format, width: match.width, height: match.height, fileKey: entry.expectedKey, sizeBytes: match.size },
        update: { fileKey: entry.expectedKey, width: match.width, height: match.height, sizeBytes: match.size }
      })
      if (!photo.blurhash && blurhash) {
        await db.photo.update({ where: { id: photo.id }, data: { blurhash } })
      }
      regenerated++
      logger.info({ photoId: entry.photoId, variant: entry.variant, format: entry.format }, 'regenerated missing variant')
    } catch (e) {
      logger.error({ err: (e as Error).message, entry }, 'failed to regenerate')
    }
  }

  async function deleteOne(key: string) {
    try {
      await storage.deleteObject(key)
      deleted++
      logger.info({ key }, 'deleted orphan object')
    } catch (e) {
      logger.error({ key, err: (e as Error).message }, 'failed to delete orphan')
    }
  }

  const regenTasks = flags.autoFixMissing ? missingFiles.map(m => () => regenerateOne(m)) : []
  const deleteTasks = flags.deleteOrphans ? orphanObjects.map(k => () => deleteOne(k)) : []
  const allTasks = [...regenTasks, ...deleteTasks]
  const conc = flags.concurrency
  for (let i = 0; i < allTasks.length; i += conc) {
    await Promise.all(allTasks.slice(i, i + conc).map(fn => fn()))
  }

  logger.info({ regenerated, deleted, missingRemaining: missingFiles.length - regenerated, orphanRemaining: orphanObjects.length - deleted }, 'auto-fix complete')
  console.log(JSON.stringify({ ...result, regenerated, deleted }, null, 2))
}

if (require.main === module) {
  run().catch(e => {
    console.error(e)
    process.exit(1)
  })
}

