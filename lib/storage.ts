import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: process.env.S3_ENDPOINT?.includes('minio') || process.env.S3_ENDPOINT?.includes('localhost'),
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!

export class StorageService {
  static async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })
    
    return getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
  }

  static async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    
    return getSignedUrl(s3Client, command, { expiresIn: 3600 })
  }

  static async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    
    await s3Client.send(command)
  }

  static async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    
    await s3Client.send(command)
  }

  static getPublicUrl(key: string): string {
    if (process.env.CDN_BASE_URL) {
      return `${process.env.CDN_BASE_URL}/${key}`
    }
    
    if (process.env.S3_ENDPOINT?.includes('minio') || process.env.S3_ENDPOINT?.includes('localhost')) {
      return `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`
    }
    
    return `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
  }

  static generateKey(prefix: string, filename: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const ext = filename.split('.').pop()
    return `${prefix}/${timestamp}-${random}.${ext}`
  }
}