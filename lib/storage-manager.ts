import { Readable } from 'stream'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getLocalStorageManager, LocalStorageManager } from './local-storage'
import { getRuntimeConfig } from './runtime-config'

getRuntimeConfig()

export type StorageProvider = 'minio' | 'aws' | 'aliyun' | 'qcloud'

export interface StorageConfig {
  provider: StorageProvider
  endpoint?: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  cdnUrl?: string
  forcePathStyle?: boolean
}

type StorageHealthStatus = {
  ok: boolean
  authOk: boolean
  latencyMs?: number
  error?: string
  code?: string
  statusCode?: number
}


type NormalizedStorageProvider = StorageProvider | 'local'

const STORAGE_PROVIDER_ALIASES: Record<string, NormalizedStorageProvider> = {
  aws: 'aws',
  s3: 'aws',
  'aws-s3': 'aws',
  minio: 'minio',
  'minio-s3': 'minio',
  aliyun: 'aliyun',
  oss: 'aliyun',
  qcloud: 'qcloud',
  cos: 'qcloud',
  local: 'local',
  filesystem: 'local',
  fs: 'local',
}

function firstEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]
    if (value && value.length > 0) {
      return value
    }
  }
  return undefined
}

function requireEnv(keys: string[], provider: string): string {
  const value = firstEnv(keys)
  if (!value) {
    const joined = keys.join(' or ')
    throw new Error(`[storage] Missing environment variable ${joined} for provider "${provider}"`)
  }
  return value
}

function normalizeStorageProvider(value?: string): NormalizedStorageProvider {
  if (!value) {
    return 'minio'
  }

  const normalized = value.trim().toLowerCase()
  const resolved = STORAGE_PROVIDER_ALIASES[normalized]
  if (!resolved) {
    console.warn(`[storage] Unknown storage provider "${value}", falling back to "minio"`)
    return 'minio'
  }
  return resolved
}


export class StorageManager {
  private config: StorageConfig
  private client: S3Client
  private fallback?: LocalStorageManager

  constructor(config: StorageConfig) {
    this.config = config
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? config.endpoint?.includes('minio'),
    })
  }

  static createFromSettings(provider: StorageProvider): StorageManager {
    const configs: Record<StorageProvider, () => StorageConfig> = {
      minio: () => ({
        provider: 'minio',
        endpoint: firstEnv(['S3_ENDPOINT', 'MINIO_ENDPOINT']) || 'http://127.0.0.1:9000',
        region: firstEnv(['S3_REGION', 'MINIO_REGION']) || 'us-east-1',
        accessKeyId: requireEnv(['S3_ACCESS_KEY_ID', 'MINIO_ROOT_USER', 'AWS_ACCESS_KEY_ID'], 'minio'),
        secretAccessKey: requireEnv(['S3_SECRET_ACCESS_KEY', 'MINIO_ROOT_PASSWORD', 'AWS_SECRET_ACCESS_KEY'], 'minio'),
        bucket: requireEnv(['S3_BUCKET_NAME', 'MINIO_BUCKET', 'AWS_S3_BUCKET'], 'minio'),
        cdnUrl: firstEnv(['CDN_BASE_URL', 'AWS_CLOUDFRONT_URL']),
        forcePathStyle: true,
      }),
      aws: () => ({
        provider: 'aws',
        endpoint: firstEnv(['AWS_S3_ENDPOINT', 'S3_ENDPOINT']),
        region: requireEnv(['AWS_REGION', 'S3_REGION'], 'aws'),
        accessKeyId: requireEnv(['AWS_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID'], 'aws'),
        secretAccessKey: requireEnv(['AWS_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY'], 'aws'),
        bucket: requireEnv(['AWS_S3_BUCKET', 'S3_BUCKET_NAME'], 'aws'),
        cdnUrl: firstEnv(['AWS_CLOUDFRONT_URL', 'CDN_BASE_URL']),
      }),
      aliyun: () => {
        const region = requireEnv(['ALIYUN_REGION'], 'aliyun')
        return {
          provider: 'aliyun',
          endpoint: firstEnv(['ALIYUN_ENDPOINT']) || `https://oss-${region}.aliyuncs.com`,
          region,
          accessKeyId: requireEnv(['ALIYUN_ACCESS_KEY_ID'], 'aliyun'),
          secretAccessKey: requireEnv(['ALIYUN_SECRET_ACCESS_KEY'], 'aliyun'),
          bucket: requireEnv(['ALIYUN_OSS_BUCKET'], 'aliyun'),
          cdnUrl: firstEnv(['ALIYUN_CDN_URL', 'CDN_BASE_URL']),
        }
      },
      qcloud: () => {
        const region = requireEnv(['QCLOUD_REGION'], 'qcloud')
        return {
          provider: 'qcloud',
          endpoint: firstEnv(['QCLOUD_ENDPOINT']) || `https://cos.${region}.myqcloud.com`,
          region,
          accessKeyId: requireEnv(['QCLOUD_SECRET_ID'], 'qcloud'),
          secretAccessKey: requireEnv(['QCLOUD_SECRET_KEY'], 'qcloud'),
          bucket: requireEnv(['QCLOUD_COS_BUCKET'], 'qcloud'),
          cdnUrl: firstEnv(['QCLOUD_CDN_URL', 'CDN_BASE_URL']),
        }
      },
    }

    const factory = configs[provider]
    if (!factory) {
      throw new Error(`Unsupported storage provider: ${provider}`)
    }

    return new StorageManager(factory())
  }
  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    try {
      await this.client.send(command)
    } catch (error) {
      const fallback = this.ensureFallback('uploadBuffer', error)
      if (!fallback) throw error
      await fallback.uploadBuffer(key, buffer, contentType)
    }
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: contentType,
    })

    try {
      return await getSignedUrl(this.client, command, { expiresIn: 3600 })
    } catch (error) {
      const fallback = this.ensureFallback('getPresignedUploadUrl', error)
      if (fallback && typeof fallback.getPresignedUploadUrl === 'function') {
        return await fallback.getPresignedUploadUrl(key, contentType)
      }
      throw error
    }
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
      return await getSignedUrl(this.client, command, { expiresIn: 3600 })
    } catch (error) {
      const fallback = this.ensureFallback('getPresignedDownloadUrl', error)
      if (fallback) {
        return fallback.getPresignedDownloadUrl(key)
      }
      throw error
    }
  }

  async downloadBuffer(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
      const result = await this.client.send(command)
      const body: any = result.Body
      if (!body) {
        throw new Error('Empty body returned from storage download')
      }
      if (Buffer.isBuffer(body)) {
        return body
      }
      if (typeof body.transformToByteArray === 'function') {
        const array = await body.transformToByteArray()
        return Buffer.from(array)
      }
      const readable = body as Readable
      const chunks: Buffer[] = []
      for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk))
      }
      return Buffer.concat(chunks)
    } catch (error) {
      const fallback = this.ensureFallback('downloadBuffer', error)
      if (fallback) {
        return fallback.downloadBuffer(key)
      }
      throw error
    }
  }

  // Compatibility alias used by some CLI脚本
  async getObjectBuffer(key: string): Promise<Buffer> {
    return this.downloadBuffer(key)
  }

  async streamObject(key: string): Promise<{ stream: Readable; contentLength?: number; contentType?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
      const result = await this.client.send(command)
      const body: any = result.Body
      if (!body) {
        throw new Error('Empty body returned from storage stream')
      }
      let stream: Readable
      if (Buffer.isBuffer(body)) {
        stream = Readable.from(body)
      } else if (typeof body.transformToByteArray === 'function') {
        const array = await body.transformToByteArray()
        stream = Readable.from(Buffer.from(array))
      } else {
        stream = body as Readable
      }
      return {
        stream,
        contentLength: typeof result.ContentLength === 'number' ? result.ContentLength : undefined,
        contentType: result.ContentType || undefined,
      }
    } catch (error) {
      const fallback = this.ensureFallback('streamObject', error)
      if (fallback) {
        return fallback.streamObject(key)
      }
      throw error
    }
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    })

    try {
      await this.client.send(command)
    } catch (error) {
      const fallback = this.ensureFallback('deleteObject', error)
      if (!fallback) throw error
      await fallback.deleteObject(key)
    }
  }

  // List objects under a prefix (used by maintenance scripts)
  async *listObjects(prefix: string): AsyncGenerator<string> {
    try {
      let continuationToken: string | undefined = undefined
      do {
        const res: import('@aws-sdk/client-s3').ListObjectsV2CommandOutput = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.config.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
          })
        )
        const contents = res.Contents || []
        for (const obj of contents) {
          if (obj.Key) yield obj.Key
        }
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
      } while (continuationToken)
    } catch (error) {
      const fallback = this.ensureFallback('listObjects', error)
      if (fallback && typeof (fallback as any).listObjects === 'function') {
        for await (const key of (fallback as any).listObjects(prefix)) {
          yield key as string
        }
        return
      }
      throw error
    }
  }

  async healthCheck(): Promise<StorageHealthStatus> {
    const start = Date.now()
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.config.bucket }))
    } catch (error) {
      const info = this.describeS3Error(error)
      return {
        ok: false,
        authOk: !this.isAuthError(info),
        latencyMs: Date.now() - start,
        error: info.message,
        code: info.code,
        statusCode: info.statusCode,
      }
    }

    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: '__healthcheck__probe__' }))
    } catch (error) {
      const info = this.describeS3Error(error)
      if (info.statusCode === 404 || info.code === 'NotFound' || info.code === 'NoSuchKey') {
        return { ok: true, authOk: true, latencyMs: Date.now() - start }
      }
      const authOk = !this.isAuthError(info)
      return {
        ok: false,
        authOk,
        latencyMs: Date.now() - start,
        error: info.message,
        code: info.code,
        statusCode: info.statusCode,
      }
    }

    return { ok: true, authOk: true, latencyMs: Date.now() - start }
  }

  private describeS3Error(error: unknown): { message: string; code?: string; statusCode?: number } {
    const err = error as any
    return {
      message: err?.message || String(error),
      code: err?.name || err?.Code,
      statusCode: err?.$metadata?.httpStatusCode,
    }
  }

  private isAuthError(info: { code?: string; statusCode?: number }): boolean {
    if (info.statusCode === 403) {
      return true
    }
    if (!info.code) {
      return false
    }
    return ['AccessDenied', 'Forbidden', 'InvalidAccessKeyId', 'SignatureDoesNotMatch'].includes(info.code)
  }

  getPublicUrl(key: string): string {
    if (this.config.cdnUrl) {
      return `${this.config.cdnUrl}/${key}`
    }

    switch (this.config.provider) {
      case 'minio':
        return `${this.config.endpoint}/${this.config.bucket}/${key}`
      case 'aws':
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`
      case 'aliyun':
        return `https://${this.config.bucket}.oss-${this.config.region}.aliyuncs.com/${key}`
      case 'qcloud':
        return `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${key}`
      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`)
    }
  }

  static generateKey(prefix: string, filename: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const ext = filename.split('.').pop()
    return `${prefix}/${timestamp}-${random}.${ext}`
  }

  private ensureFallback(operation: string, error: unknown): LocalStorageManager | null {
    console.error('Storage operation failed', {
      operation,
      provider: this.config.provider,
      error: error instanceof Error ? error.message : String(error),
    })
    try {
      if (!this.fallback) {
        this.fallback = getLocalStorageManager()
        console.warn('Switched to local storage fallback mode')
      }
      return this.fallback
    } catch (fallbackError) {
      console.error('Local storage fallback initialization failed', fallbackError)
      return null
    }
  }
}

let globalStorageManager: StorageManager | any

export function getStorageManager(): StorageManager | any {
  if (!globalStorageManager) {
    const normalized = normalizeStorageProvider(process.env.STORAGE_PROVIDER)
    const isDev = process.env.NODE_ENV !== 'production'

    if (normalized === 'local') {
      globalStorageManager = getLocalStorageManager()
      return globalStorageManager
    }

    const provider = normalized as StorageProvider

    try {
      globalStorageManager = StorageManager.createFromSettings(provider)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const providerValue = process.env.STORAGE_PROVIDER || 'minio'
      const note = `[storage] Failed to initialize provider "${providerValue}": ${message}`
      if (isDev) {
        console.warn(note)
      } else {
        console.error(note)
      }
      globalStorageManager = getLocalStorageManager()
      return globalStorageManager
    }
  }
  return globalStorageManager
}

export function setStorageProvider(provider: StorageProvider): void {
  resetStorageManager()
  if (provider === 'local') {
    globalStorageManager = getLocalStorageManager()
  } else {
    globalStorageManager = StorageManager.createFromSettings(provider)
  }
}

export function resetStorageManager(): void {
  globalStorageManager = undefined
}

