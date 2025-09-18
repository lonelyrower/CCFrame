jest.mock('sharp', () => {
  class MockSharp {
    buffer: Buffer
    width: number
    height: number
    originalWidth: number
    originalHeight: number
    rawMode = false

    constructor(input: Buffer | { data: Buffer }) {
      this.buffer = Buffer.isBuffer(input) ? input : Buffer.from(input.data)
      const pixels = Math.max(Math.floor(this.buffer.length / 4), 1)
      const size = Math.max(Math.round(Math.sqrt(pixels)), 1)
      this.width = size
      this.height = size
      this.originalWidth = this.width
      this.originalHeight = this.height
    }

    metadata() {
      return Promise.resolve({ width: this.width, height: this.height })
    }

    clone() {
      const clone = new MockSharp(this.buffer)
      clone.width = this.width
      clone.height = this.height
      clone.originalWidth = this.originalWidth
      clone.originalHeight = this.originalHeight
      clone.rawMode = this.rawMode
      return clone
    }

    resize(width?: number | null, height?: number | null, opts?: { withoutEnlargement?: boolean }) {
      if (typeof width === 'number') this.width = Math.max(1, Math.floor(width))
      if (typeof height === 'number') this.height = Math.max(1, Math.floor(height))
      if (opts?.withoutEnlargement) {
        this.width = Math.min(this.width, this.originalWidth)
        this.height = Math.min(this.height, this.originalHeight)
      }
      return this
    }

    avif() { return this }
    webp() { return this }
    jpeg() { return this }
    png() { return this }
    greyscale() { return this }
    ensureAlpha() { return this }

    raw() {
      this.rawMode = true
      return this
    }

    toBuffer(opts?: { resolveWithObject?: boolean }) {
      const width = this.width || 1
      const height = this.height || 1
      if (opts?.resolveWithObject) {
        const length = width * height * 4
        const data = Buffer.alloc(length)
        for (let i = 0; i < length; i += 4) {
          data[i] = 120
          data[i + 1] = 80
          data[i + 2] = 200
          data[i + 3] = 255
        }
        return Promise.resolve({ data, info: { width, height, channels: 4 } })
      }
      return Promise.resolve({ data: this.buffer, info: { width, height } })
    }
  }

  const factory = (input: any) => new MockSharp(input)
  factory.format = {
    avif: { output: false },
    webp: { output: true },
    jpeg: { output: true },
  }
  return factory
})

import { describe, expect, test } from '@jest/globals'
import { ImageProcessor } from '../image-processing'

function createTestImage(size = 64): Buffer {
  const data = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      data[idx] = Math.floor(255 * (x / size))
      data[idx + 1] = Math.floor(255 * (y / size))
      data[idx + 2] = 180
      data[idx + 3] = 255
    }
  }
  return data
}

describe('ImageProcessor', () => {
  test('generates expected variants respecting configured names/formats', async () => {
    process.env.IMAGE_VARIANT_NAMES = 'thumb,small'
    process.env.IMAGE_FORMATS = 'jpeg,webp'

    const buf = createTestImage()
    const { variants, blurhash, metadata } = await ImageProcessor.processImage(buf)

    expect(metadata.width).toBeGreaterThan(0)
    expect(metadata.height).toBeGreaterThan(0)

    const variantNames = new Set(variants.map(v => v.variant))
    expect(Array.from(variantNames)).toEqual(expect.arrayContaining(['thumb', 'small']))
    expect(Array.from(variantNames)).not.toEqual(expect.arrayContaining(['medium', 'large']))

    const fmts = new Set(variants.map(v => v.format))
    expect(Array.from(fmts)).toEqual(expect.arrayContaining(['jpeg', 'webp']))
    expect(Array.from(fmts)).not.toEqual(expect.arrayContaining(['avif']))

    expect(blurhash.length).toBeGreaterThanOrEqual(20)

    const thumb = variants.find(v => v.variant === 'thumb' && v.format === 'jpeg')
    expect(thumb).toBeTruthy()
    if (thumb) {
      expect(thumb.width).toBeLessThanOrEqual(300)
      expect(thumb.height).toBeLessThanOrEqual(300)
    }
  })

  test('hash functions produce deterministic values', async () => {
    const buf = createTestImage(32)
    const h1 = await ImageProcessor.calculateHash(buf)
    const h2 = await ImageProcessor.calculateHash(buf)
    const c1 = await ImageProcessor.calculateContentHash(buf)
    const c2 = await ImageProcessor.calculateContentHash(buf)
    expect(h1).toEqual(h2)
    expect(c1).toEqual(c2)
    expect(h1).toHaveLength(16)
    expect(c1).toHaveLength(64)
  })
})
