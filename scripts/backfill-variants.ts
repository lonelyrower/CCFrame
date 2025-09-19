#!/usr/bin/env tsx
import 'dotenv/config'
import { db } from '@/lib/db'
import { withTiming, TimingAggregate } from '@/lib/with-timing'
import { getStorageManager } from '@/lib/storage-manager'
import { ImageProcessor } from '@/lib/image-processing'
import { PHOTO_STATUS } from '@/lib/constants'
import { ExifProcessor } from '@/lib/exif'
import { getStorageSettings } from '@/lib/settings'

interface ParsedArgs {
  limit: number
  dry: boolean
  dryPlan: boolean
  onlyMissing: boolean
  variantsArg?: string | null
  formatsArg?: string | null
  recomputeBlurhash: boolean
  recomputeExif: boolean
  concurrency: number
  since?: string | null
  specificId?: string | null
  continueOnError: boolean
  outputJson: boolean
  force: boolean
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = new Map<string, string>()
  for (const a of argv) {
    const [k, v] = a.includes('=') ? a.split('=') : [a, 'true']
    args.set(k.replace(/^--/, ''), v)
  }
  return {
    limit: parseInt(args.get('limit') || '0', 10),
    dry: args.get('dry') === 'true',
    dryPlan: args.get('dry-plan') === 'true',
    onlyMissing: args.get('only-missing') !== 'false',
    variantsArg: args.get('variants'),
    formatsArg: args.get('formats'),
    recomputeBlurhash: args.get('recompute-blurhash') === 'true',
    recomputeExif: args.get('recompute-exif') === 'true',
    concurrency: Math.max(1, parseInt(args.get('concurrency') || '1', 10)),
    since: args.get('since'),
    specificId: args.get('id'),
    continueOnError: args.get('continue-on-error') === 'true',
    outputJson: args.get('output-json') === 'true',
    force: args.get('force') === 'true',
  }
}

export function computePlan(photo: any, needNames: Set<string>, needFormats: Set<string>) {
  const have = new Set(photo.variants.map((v: any) => `${v.variant}.${v.format}`))
  const want: string[] = []
  needNames.forEach(n => needFormats.forEach(f => want.push(`${n}.${f}`)))
  const missing = want.filter(k => !have.has(k))
  return { have, want, missing }
}

export function buildPhotoQuery(options: { since?: string | null; specificId?: string | null }) {
  const where: any = { status: PHOTO_STATUS.COMPLETED }
  if (options.since) {
    const date = new Date(options.since)
    if (!isNaN(date.getTime())) where.createdAt = { gte: date }
  }
  if (options.specificId) where.id = options.specificId
  return where
}

type Task = () => Promise<void>

export async function processPhoto(params: {
  photo: any
  index: number
  total: number
  needNames: Set<string>
  needFormats: Set<string>
  force: boolean
  onlyMissing: boolean
  dry: boolean
  recomputeBlurhash: boolean
  recomputeExif: boolean
  storage: any
  imageProcessor: ImageProcessor
  exifProcessor: ExifProcessor
}) {
  const { photo: p, index, total, needNames, needFormats, force, onlyMissing, dry, recomputeBlurhash, recomputeExif, storage, imageProcessor, exifProcessor } = params
  const { missing, want } = computePlan(p, needNames, needFormats)
  if (!force && onlyMissing && missing.length === 0) {
    return { skipped: true, uploaded: 0, variantsCreated: 0 }
  }
  console.log(`[${index}/${total}] photo ${p.id} missing: ${missing.join(', ') || 'none'}${force ? ' (force)' : ''}`)
  if (!force && missing.length === 0 && onlyMissing) return { skipped: true, uploaded: 0, variantsCreated: 0 }
  if (dry) return { skipped: false, uploaded: 0, variantsCreated: 0 }
  let base = p.fileKey ? await storage.getObjectBuffer(p.fileKey) : null
  if (!base) {
    console.warn(`Photo ${p.id} missing original fileKey=${p.fileKey}`)
    return { skipped: false, uploaded: 0, variantsCreated: 0 }
  }
  if (recomputeExif) {
    try {
      const exif = await ExifProcessor.extractExif(base)
      if (exif) {
          await db.photo.update({ where: { id: p.id }, data: { exifJson: JSON.stringify(exif) } })
      }
    } catch (e) {
      console.warn(`EXIF recompute failed for ${p.id}: ${(e as Error).message}`)
    }
  }
  const processed = await ImageProcessor.processImage(base)
  // filter variants to allowed names/formats (processImage already respects settings but we may have overrides)
  const variants = processed.variants.filter(v => needNames.has(v.variant) && needFormats.has(v.format))
  const toCreate: any[] = []
  let uploaded = 0
  for (const v of variants) {
    const key = `${v.variant}.${v.format}`
    if (!force && onlyMissing && !missing.includes(key)) continue
    const fileKey = `variants/${p.id}/${key}`
    await storage.uploadBuffer(fileKey, v.buffer, `image/${v.format}`)
    uploaded++
    toCreate.push({ variant: v.variant, format: v.format, width: v.width, height: v.height, fileKey, sizeBytes: v.size })
  }
  if (toCreate.length) {
    await db.photoVariant.createMany({ data: toCreate })
  }
  if ((recomputeBlurhash || !p.blurhash) && processed.blurhash) {
    await db.photo.update({ where: { id: p.id }, data: { blurhash: processed.blurhash } })
  }
  return { skipped: false, uploaded, variantsCreated: toCreate.length }
}

export async function runPipeline(parsed = parseArgs(process.argv.slice(2))) {
  const { limit, dry, dryPlan, onlyMissing, variantsArg, formatsArg, recomputeBlurhash, recomputeExif, concurrency, since, specificId, continueOnError, outputJson, force } = parsed as any
  const storage = getStorageManager()
  const settings = await getStorageSettings()
  const needNames = new Set(
    variantsArg ? variantsArg.split(',').map((s: string) => s.trim()).filter(Boolean) : (settings.imageVariantNames || ['thumb', 'small', 'medium', 'large'])
  )
  const needFormats = new Set(
    formatsArg ? formatsArg.split(',').map((s: string) => s.trim()).filter(Boolean) : (settings.imageFormats || ['avif', 'webp', 'jpeg'])
  )
  const where = buildPhotoQuery({ since, specificId })
  const photos = await db.photo.findMany({
    where,
    select: { id: true, blurhash: true, fileKey: true, variants: { select: { variant: true, format: true } } },
    orderBy: { createdAt: 'asc' },
    take: limit && limit > 0 ? limit : undefined,
  })
  if (!photos.length) {
    console.log('No photos matched criteria.')
    return { processed: 0, skipped: 0, uploaded: 0, errors: 0 }
  }
  if (dryPlan) {
    const plan = photos.map(p => {
      const { missing, want } = computePlan(p, needNames as Set<string>, needFormats as Set<string>)
      return { id: p.id, totalDesired: want.length, missing }
    })
    const summary = { photos: plan.length, plan }
    console.log(JSON.stringify(summary, null, 2))
    return summary
  }
  const imageProcessor = new ImageProcessor()
  const exifProcessor = new ExifProcessor()
  let processed = 0
  let skipped = 0
  let uploaded = 0
  const errors: any[] = []
  const timingAgg = new TimingAggregate()
  async function workerQueue() {
    const iterator = photos[Symbol.iterator]()
    const runners: Promise<void>[] = []
    for (let i = 0; i < concurrency; i++) {
      const runLoop = async () => {
        while (true) {
          const next = iterator.next()
          if (next.done) return
          const p = next.value
          try {
            const idx = ++processed
            const { ms, result } = await withTiming('variantPhoto', async () => processPhoto({
              photo: p,
              index: idx,
              total: photos.length,
              needNames: needNames as Set<string>,
              needFormats: needFormats as Set<string>,
              force,
              onlyMissing,
              dry,
              recomputeBlurhash,
              recomputeExif,
              storage,
              imageProcessor,
              exifProcessor,
            }))
            timingAgg.add(ms)
            if (result.skipped) skipped++
            uploaded += result.uploaded
          } catch (e: any) {
            errors.push({ id: p.id, error: e.message })
            console.error('Error processing photo', p.id, e)
            if (!continueOnError) break
          }
        }
      }
      runners.push(runLoop())
    }
    await Promise.all(runners)
  }
  await workerQueue()
  const summary = { processed, skipped, uploaded, errors: errors.length, errorDetails: errors, timing: timingAgg.summary() }
  if (outputJson) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    console.log('Summary:', summary)
  }
  return summary
}

async function run() {
  await runPipeline()
}

if (require.main === module) {
  run()
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      try {
        await db.$disconnect()
      } catch {
        // ignore
      }
    })
}
