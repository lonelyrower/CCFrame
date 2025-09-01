import sharp from 'sharp'
import { encode } from 'blurhash'

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

    for (const variant of IMAGE_VARIANTS) {
      for (const format of variant.formats) {
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

        const buffer = await processedImage.toBuffer()
        const info = await processedImage.toBuffer({ resolveWithObject: true })

        variants.push({
          variant: variant.name,
          format,
          buffer,
          width: info.info.width,
          height: info.info.height,
          size: buffer.length
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

    // Simple perceptual hash
    const average = data.reduce((sum, pixel) => sum + pixel, 0) / data.length
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      if (data[i] >= average) {
        hash |= 1 << i
      }
    }

    return hash.toString(16)
  }
}