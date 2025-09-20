import fs from 'fs'
import path from 'path'
import { getRuntimeConfig } from './runtime-config'

getRuntimeConfig()

const fsp = fs.promises
const MIME_BY_EXT: Record<string, string> = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.svg': 'image/svg+xml',
}

export class LocalStorageManager {
  private basePath: string
  private initialized = false

  constructor(basePath: string = './uploads') {
    this.basePath = path.resolve(basePath)
    this.ensureBaseDirs()
  }

  private ensureBaseDirs(): void {
    if (this.initialized) return
    const dirs = [
      this.basePath,
      path.join(this.basePath, 'originals'),
      path.join(this.basePath, 'variants'),
      path.join(this.basePath, 'enhanced'),
      path.join(this.basePath, 'upscaled'),
      path.join(this.basePath, 'no-bg'),
    ]
    for (const dir of dirs) {
      fs.mkdirSync(dir, { recursive: true })
    }
    this.initialized = true
  }

  private resolveKey(key: string): string {
    const normalized = key.replace(/\\/g, '/')
    const fullPath = path.join(this.basePath, normalized)
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error(`Invalid storage key: ${key}`)
    }
    return fullPath
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    this.ensureBaseDirs()
    const filePath = this.resolveKey(key)
    const dir = path.dirname(filePath)
    await fsp.mkdir(dir, { recursive: true })
    await fsp.writeFile(filePath, buffer)
  }

  async downloadBuffer(key: string): Promise<Buffer> {
    this.ensureBaseDirs()
    const filePath = this.resolveKey(key)
    return fsp.readFile(filePath)
  }

  // Compatibility alias used by some CLI脚本
  async getObjectBuffer(key: string): Promise<Buffer> {
    return this.downloadBuffer(key)
  }

  async streamObject(key: string): Promise<{ stream: fs.ReadStream; contentLength?: number; contentType?: string }> {
    this.ensureBaseDirs()
    const filePath = this.resolveKey(key)
    const stat = await fsp.stat(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_BY_EXT[ext] || 'application/octet-stream'
    const stream = fs.createReadStream(filePath)
    return { stream, contentLength: stat.size, contentType }
  }

  async *listObjects(prefix: string): AsyncGenerator<string> {
    this.ensureBaseDirs()
    const startDir = path.join(this.basePath, prefix)
    try {
      const stack: string[] = [startDir]
      while (stack.length) {
        const dir = stack.pop() as string
        const entries = await fsp.readdir(dir, { withFileTypes: true } as any)
        for (const ent of entries as any) {
          const full = path.join(dir, ent.name)
          if (ent.isDirectory()) {
            stack.push(full)
          } else if (ent.isFile()) {
            const rel = path.relative(this.basePath, full).replace(/\\\\/g, '/').replace(/\\/g, '/')
            yield rel
          }
        }
      }
    } catch {
      // If directory does not exist, yield nothing
    }
  }

  async healthCheck(): Promise<{ ok: boolean; authOk: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now()
    try {
      this.ensureBaseDirs()
      await fsp.access(this.basePath)
      return { ok: true, authOk: true, latencyMs: Date.now() - start }
    } catch (error) {
      return {
        ok: false,
        authOk: true,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    this.ensureBaseDirs()
    // 对于本地存储，我们返回一个特殊的URL，指向本地上传API
    return `/api/upload/local?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    this.ensureBaseDirs()
    const filePath = this.resolveKey(key)
    try {
      await fsp.access(filePath)
      return `/api/image/file/${key}`
    } catch (error) {
      throw new Error(`File not found: ${key}`)
    }
  }

  async deleteObject(key: string): Promise<void> {
    this.ensureBaseDirs()
    const filePath = this.resolveKey(key)
    try {
      await fsp.unlink(filePath)
    } catch {
      // ignore missing files
    }
  }

  getPublicUrl(key: string): string {
    this.ensureBaseDirs()
    return `/api/image/file/${key}`
  }

  static generateKey(prefix: string, filename: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const ext = filename.split('.').pop()
    return `${prefix}/${timestamp}-${random}.${ext}`
  }
}

let globalLocalStorageManager: LocalStorageManager | null = null

export function getLocalStorageManager(): LocalStorageManager {
  if (!globalLocalStorageManager) {
    const basePath = process.env.UPLOAD_PATH || './uploads'
    globalLocalStorageManager = new LocalStorageManager(basePath)
  }
  return globalLocalStorageManager
}
