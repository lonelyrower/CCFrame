import fs from 'fs'
import path from 'path'
import { HeadBucketCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { StorageManager, getStorageManager } from '@/lib/storage-manager'
import { getLocalStorageManager } from '@/lib/local-storage'

describe('Storage Manager Fallback', () => {
  const orig = { ...process.env }
  afterEach(() => {
    jest.restoreAllMocks()
    process.env = { ...orig }
  })

  test('falls back to local for incomplete minio config in dev', () => {
    ;(process as any).env.NODE_ENV = 'development'
    process.env.STORAGE_PROVIDER = 'minio'
    delete process.env.S3_ENDPOINT
    delete process.env.S3_BUCKET_NAME
    const mgr = getStorageManager()
    expect(typeof mgr.uploadBuffer).toBe('function')
  })

  test('switches to local fallback when remote upload fails', async () => {
    const manager = new StorageManager({
      provider: 'minio',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      bucket: 'test-bucket',
      forcePathStyle: true,
    })

    const uploadsRoot = path.resolve('./uploads')
    const key = 'variants/fallback-test.txt'
    const filePath = path.join(uploadsRoot, key)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    jest.spyOn((manager as any).client, 'send').mockRejectedValue(new Error('s3 unavailable'))

    await manager.uploadBuffer(key, Buffer.from('fallback'), 'text/plain')
    expect(fs.existsSync(filePath)).toBe(true)
  })

  test('downloadBuffer falls back to local storage on failure', async () => {
    const manager = new StorageManager({
      provider: 'minio',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      bucket: 'test-bucket',
      forcePathStyle: true,
    })

    const key = 'variants/fallback-read.txt'
    const local = getLocalStorageManager()
    await local.uploadBuffer(key, Buffer.from('read'), 'text/plain')

    jest.spyOn((manager as any).client, 'send').mockRejectedValue(new Error('s3 unavailable'))

    const buf = await manager.downloadBuffer(key)
    expect(buf.toString()).toBe('read')
  })

  test('aws provider accepts S3_* config fallback', () => {
    process.env.S3_BUCKET_NAME = 'alias-bucket'
    process.env.S3_ACCESS_KEY_ID = 'alias-key'
    process.env.S3_SECRET_ACCESS_KEY = 'alias-secret'
    process.env.S3_REGION = 'ap-southeast-1'
    delete process.env.AWS_S3_BUCKET
    delete process.env.AWS_ACCESS_KEY_ID
    delete process.env.AWS_SECRET_ACCESS_KEY

    const manager = StorageManager.createFromSettings('aws')
    const config = (manager as any).config
    expect(config.bucket).toBe('alias-bucket')
    expect(config.region).toBe('ap-southeast-1')
  })
})

describe('StorageManager healthCheck', () => {
  const baseConfig = {
    provider: 'minio' as const,
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    accessKeyId: 'key',
    secretAccessKey: 'secret',
    bucket: 'test-bucket',
    forcePathStyle: true,
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('reports ok when bucket accessible and probe key missing', async () => {
    const manager = new StorageManager(baseConfig)
    jest.spyOn((manager as any).client, 'send').mockImplementation((command: any) => {
      if (command instanceof HeadBucketCommand) {
        return Promise.resolve({})
      }
      if (command instanceof HeadObjectCommand) {
        const err: any = new Error('NotFound')
        err.$metadata = { httpStatusCode: 404 }
        err.name = 'NotFound'
        err.Code = 'NotFound'
        return Promise.reject(err)
      }
      return Promise.resolve({})
    })

    const result = await manager.healthCheck()
    expect(result.ok).toBe(true)
    expect(result.authOk).toBe(true)
    expect(result.statusCode).toBeUndefined()
  })

  test('marks authentication errors when bucket head fails', async () => {
    const manager = new StorageManager(baseConfig)
    jest.spyOn((manager as any).client, 'send').mockImplementation((command: any) => {
      if (command instanceof HeadBucketCommand) {
        const err: any = new Error('AccessDenied')
        err.$metadata = { httpStatusCode: 403 }
        err.name = 'AccessDenied'
        err.Code = 'AccessDenied'
        return Promise.reject(err)
      }
      return Promise.resolve({})
    })

    const result = await manager.healthCheck()
    expect(result.ok).toBe(false)
    expect(result.authOk).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  test('returns error when probe object fails for non auth reason', async () => {
    const manager = new StorageManager(baseConfig)
    jest.spyOn((manager as any).client, 'send').mockImplementation((command: any) => {
      if (command instanceof HeadBucketCommand) {
        return Promise.resolve({})
      }
      if (command instanceof HeadObjectCommand) {
        const err: any = new Error('S3Failure')
        err.$metadata = { httpStatusCode: 500 }
        err.name = 'InternalError'
        err.Code = 'InternalError'
        return Promise.reject(err)
      }
      return Promise.resolve({})
    })

    const result = await manager.healthCheck()
    expect(result.ok).toBe(false)
    expect(result.authOk).toBe(true)
    expect(result.statusCode).toBe(500)
  })
})
