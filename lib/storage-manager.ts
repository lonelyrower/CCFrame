import { Readable } from 'stream'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getLocalStorageManager, LocalStorageManager } from './local-storage'

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
        endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
        region: process.env.S3_REGION || 'us-east-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
        bucket: process.env.S3_BUCKET_NAME!,
        cdnUrl: process.env.CDN_BASE_URL,
        forcePathStyle: true,
      }),
      aws: () => ({
        provider: 'aws',
        region: process.env.AWS_REGION!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        bucket: process.env.AWS_S3_BUCKET!,
        cdnUrl: process.env.AWS_CLOUDFRONT_URL,
      }),
      aliyun: () => ({
        provider: 'aliyun',
        endpoint: `https://oss-${process.env.ALIYUN_REGION}.aliyuncs.com`,
        region: process.env.ALIYUN_REGION!,
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
        secretAccessKey: process.env.ALIYUN_SECRET_ACCESS_KEY!,
        bucket: process.env.ALIYUN_OSS_BUCKET!,
        cdnUrl: process.env.ALIYUN_CDN_URL,
      }),
      qcloud: () => ({
        provider: 'qcloud',
        endpoint: `https://cos.${process.env.QCLOUD_REGION}.myqcloud.com`,
        region: process.env.QCLOUD_REGION!,
        accessKeyId: process.env.QCLOUD_SECRET_ID!,
        secretAccessKey: process.env.QCLOUD_SECRET_KEY!,
        bucket: process.env.QCLOUD_COS_BUCKET!,
        cdnUrl: process.env.QCLOUD_CDN_URL,
      }),
    }

    return new StorageManager(configs[provider]())
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
      if (fallback) {
        throw new Error('STORAGE_PRESIGN_UNAVAILABLE_FALLBACK')
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
        ok: authOk,
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
    const provider = (process.env.STORAGE_PROVIDER as StorageProvider) || 'minio'
    const isDev = process.env.NODE_ENV !== 'production'

    if (process.env.STORAGE_PROVIDER === 'local') {
      return getLocalStorageManager()
    }

    if (isDev) {
      const s3Endpoint = process.env.S3_ENDPOINT
      const s3Bucket = process.env.S3_BUCKET_NAME
      const s3Key = process.env.S3_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER
      const s3Secret = process.env.S3_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD
      const awsBucket = process.env.AWS_S3_BUCKET
      const awsKey = process.env.AWS_ACCESS_KEY_ID
      const awsSecret = process.env.AWS_SECRET_ACCESS_KEY

      const minioIncomplete = provider === 'minio' && (!s3Endpoint || !s3Bucket || !s3Key || !s3Secret)
      const awsIncomplete = provider === 'aws' && (!awsBucket || !awsKey || !awsSecret)
      if (minioIncomplete || awsIncomplete) {
        return getLocalStorageManager()
      }
    }

    if (isDev && provider === 'minio') {
      try {
        globalStorageManager = StorageManager.createFromSettings(provider)
      } catch (error) {
        console.warn('S3/MinIO not available, falling back to local storage:', error)
        return getLocalStorageManager()
      }
    } else {
      globalStorageManager = StorageManager.createFromSettings(provider)
    }
  }
  return globalStorageManager
}

export function setStorageProvider(provider: StorageProvider): void {
  globalStorageManager = StorageManager.createFromSettings(provider)
}
