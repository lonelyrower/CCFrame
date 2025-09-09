import sharp from 'sharp'
import { encode } from 'blurhash'
import { getStorageSettings } from './settings'

export interface ImageVariant {
  name: string
  width: number
  height?: number
  quality: number
  formats: string[]
}

export const IMAGE_VARIANTS: ImageVariant[] = [
  { name: 'thumb', width: 300, height: 300, quality: 80, formats: ['avif', 'webp', 'jpeg'] },
  { name: 'small', width: 600, quality: 85, formats: ['avif', 'webp', 'jpeg'] },
  { name: 'medium', width: 1200, quality: 90, formats: ['avif', 'webp', 'jpeg'] },
  { name: 'large', width: 2400, quality: 95, formats: ['avif', 'webp', 'jpeg'] },
]

function enabledFormats(): string[] {
  const env = (process.env.IMAGE_FORMATS || '').trim()
  if (!env) return ['avif', 'webp', 'jpeg']
  return env.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

function enabledVariantNames(): string[] {
  const env = (process.env.IMAGE_VARIANT_NAMES || '').trim()
  if (!env) return ['thumb', 'small', 'medium', 'large']
  return env.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

export class ImageProcessor {
  static async processImage(inputBuffer: Buffer): Promise<{
    metadata: sharp.Metadata
    variants: Array<{
      variant: string
      format: string
      buffer: Buffer
      width: number
      height: number
      size: number
    }>
    blurhash: string
  }> {
    const image = sharp(inputBuffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata')
    }

    // Generate blurhash
    const blurhash = await this.generateBlurhash(inputBuffer)

    // Generate variants
    const variants: Array<{
      variant: string
      format: string
      buffer: Buffer
      width: number
      height: number
      size: number
    }> = []

    const storageSettings = await getStorageSettings()
    const allowNames = new Set(storageSettings.imageVariantNames || ['thumb', 'small', 'medium', 'large'])
    const allowFormats = new Set(storageSettings.imageFormats || ['avif', 'webp', 'jpeg'])
    for (const variant of IMAGE_VARIANTS) {
      if (!allowNames.has(variant.name)) continue
      const fmts = variant.formats.filter(f => allowFormats.has(f))
      for (const format of fmts) {
        let processedImage = image.clone()

        // Resize
        if (variant.name === 'thumb') {
          processedImage = processedImage.resize(variant.width, variant.height, {
            fit: 'cover',
            position: 'center'
          })
        } else {
          processedImage = processedImage.resize(variant.width, null, {
            withoutEnlargement: true
          })
        }

        // Convert format
        switch (format) {
          case 'avif':
            processedImage = processedImage.avif({ quality: variant.quality })
            break
          case 'webp':
            processedImage = processedImage.webp({ quality: variant.quality })
            break
          case 'jpeg':
            processedImage = processedImage.jpeg({ quality: variant.quality, progressive: true })
            break
        }

        const { data: outBuffer, info } = await processedImage.toBuffer({ resolveWithObject: true })

        variants.push({
          variant: variant.name,
          format,
          buffer: outBuffer,
          width: info.width,
          height: info.height,
          size: outBuffer.length,
        })
      }
    }

    return {
      metadata,
      variants,
      blurhash
    }
  }

  static async generateBlurhash(inputBuffer: Buffer): Promise<string> {
    const image = sharp(inputBuffer)
    const { data, info } = await image
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true })

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
  }

  static async calculateHash(buffer: Buffer): Promise<string> {
    const image = sharp(buffer)
    const { data } = await image
      .greyscale()
      .resize(8, 8, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    // 64-bit perceptual hash packed into 8 bytes to avoid 32-bit overflow
    const average = data.reduce((sum, pixel) => sum + pixel, 0) / data.length
    const bytes = new Uint8Array(8)
    for (let i = 0; i < data.length; i++) {
      if (data[i] >= average) {
        const byteIndex = Math.floor(i / 8)
        const bitIndex = i % 8
        bytes[byteIndex] |= 1 << bitIndex
      }
    }

    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  static async calculateContentHash(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto')
    const hash = crypto.createHash('sha256')
    hash.update(buffer)
    return hash.digest('hex')
  }
}
