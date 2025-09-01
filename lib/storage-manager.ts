import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

export class StorageManager {
  private config: StorageConfig
  private client: S3Client

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
        endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
        region: 'us-east-1',
        accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
        bucket: process.env.S3_BUCKET_NAME!,
        forcePathStyle: true
      }),
      aws: () => ({
        provider: 'aws',
        region: process.env.AWS_REGION!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        bucket: process.env.AWS_S3_BUCKET!,
        cdnUrl: process.env.AWS_CLOUDFRONT_URL
      }),
      aliyun: () => ({
        provider: 'aliyun', 
        endpoint: `https://oss-${process.env.ALIYUN_REGION}.aliyuncs.com`,
        region: process.env.ALIYUN_REGION!,
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
        secretAccessKey: process.env.ALIYUN_SECRET_ACCESS_KEY!,
        bucket: process.env.ALIYUN_OSS_BUCKET!,
        cdnUrl: process.env.ALIYUN_CDN_URL
      }),
      qcloud: () => ({
        provider: 'qcloud',
        endpoint: `https://cos.${process.env.QCLOUD_REGION}.myqcloud.com`,
        region: process.env.QCLOUD_REGION!,
        accessKeyId: process.env.QCLOUD_SECRET_ID!,
        secretAccessKey: process.env.QCLOUD_SECRET_KEY!,
        bucket: process.env.QCLOUD_COS_BUCKET!,
        cdnUrl: process.env.QCLOUD_CDN_URL
      })
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
    
    await this.client.send(command)
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: contentType,
    })
    
    return getSignedUrl(this.client, command, { expiresIn: 3600 })
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    })
    
    await this.client.send(command)
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
}

// 全局存储管理器
let globalStorageManager: StorageManager

export function getStorageManager(): StorageManager {
  if (!globalStorageManager) {
    // 从数据库或环境变量读取用户设置的存储方式
    const provider = (process.env.STORAGE_PROVIDER as StorageProvider) || 'minio'
    globalStorageManager = StorageManager.createFromSettings(provider)
  }
  return globalStorageManager
}

export function setStorageProvider(provider: StorageProvider): void {
  globalStorageManager = StorageManager.createFromSettings(provider)
}