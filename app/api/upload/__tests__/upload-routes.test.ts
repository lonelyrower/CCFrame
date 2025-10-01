// Set NEXTAUTH_SECRET before tests run
process.env.NEXTAUTH_SECRET = 'test-secret-for-upload-tests'

const photoStore = new Map<string, any>()
const mockStorage = { getPresignedUploadUrl: jest.fn() }
const queueAdd = jest.fn()

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  rateLimitHeaders: jest.fn(() => ({})),
  getClientIp: jest.fn(() => '127.0.0.1'),
}))

jest.mock('@/lib/db', () => ({
  db: {
    photo: {
      create: jest.fn(async ({ data }) => {
        const id = `photo-${photoStore.size + 1}`
        const record = { id, ...data }
        photoStore.set(id, record)
        return record
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        const entries = Array.from(photoStore.values())
        return entries.find((p) => p.id === where.id && p.userId === where.userId) || null
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const record = photoStore.get(where.id)
        if (record) {
          Object.assign(record, data)
        }
        return record
      }),
    },
    album: {
      findFirst: jest.fn(async ({ where }: any) => ({ id: where.id, userId: where.userId, name: 'Test Album' })),
    },
    audit: {
      create: jest.fn(async () => ({})),
    },
  },
}))

jest.mock('@/lib/storage-manager', () => ({
  getStorageManager: jest.fn(() => mockStorage),
  StorageManager: { generateKey: jest.fn(() => 'originals/generated-key.jpg') },
}))

jest.mock('@/lib/photo-dedupe', () => ({
  checkDuplicatePhoto: jest.fn(),
}))

jest.mock('@/jobs/queue', () => ({
  imageProcessingQueue: {
    add: jest.fn(async (...args: any[]) => queueAdd(...args)),
  },
}))

import { POST as uploadPresign } from '@/app/api/upload/presign/route'
import { POST as uploadCommit } from '@/app/api/upload/commit/route'
import { uploadEventCounter, metricsRegistry } from '@/lib/prometheus'
import { getServerSession } from 'next-auth'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { checkDuplicatePhoto } from '@/lib/photo-dedupe'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { imageProcessingQueue } from '@/jobs/queue'

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockedRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>
const mockedRateLimitHeaders = rateLimitHeaders as jest.MockedFunction<typeof rateLimitHeaders>
const mockedDuplicateCheck = checkDuplicatePhoto as jest.MockedFunction<typeof checkDuplicatePhoto>
const mockedGetStorageManager = getStorageManager as jest.MockedFunction<typeof getStorageManager>
const mockedQueueAdd = imageProcessingQueue.add as jest.MockedFunction<typeof imageProcessingQueue.add>

const getCounterValue = async (type: string, result: string) => {
  const metric = await uploadEventCounter.get()
  const entry = metric.values.find((value) => value.labels?.type === type && value.labels?.result === result)
  return entry ? entry.value : 0
}

describe('Upload API routes', () => {
  const mockGenerateKey = StorageManager.generateKey as jest.Mock

  beforeEach(() => {
    photoStore.clear()
    metricsRegistry.resetMetrics()
    jest.clearAllMocks()
    mockStorage.getPresignedUploadUrl.mockReset()
    mockGenerateKey.mockReset()
    mockGenerateKey.mockImplementation(() => 'originals/generated-key.jpg')
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetIn: 60 })
    mockedRateLimitHeaders.mockReturnValue({})
    mockedDuplicateCheck.mockResolvedValue({ duplicate: false })
    mockStorage.getPresignedUploadUrl.mockResolvedValue('https://upload-url')
    mockedGetStorageManager.mockReturnValue(mockStorage)
    mockedQueueAdd.mockReset()
    mockedQueueAdd.mockResolvedValue({} as any)
  })

  describe('presign POST', () => {
    it('returns 401 when unauthorized and records metric', async () => {
      mockedGetServerSession.mockResolvedValueOnce(null as any)
      const response = await uploadPresign({ json: jest.fn() } as any)
      expect(response.status).toBe(401)
      expect(await getCounterValue('presign', 'unauthorized')).toBe(1)
    })

    it('returns 429 when rate limited', async () => {
      mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any)
      mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, limit: 30, resetIn: 60 })
      mockedRateLimitHeaders.mockReturnValue({ 'X-RateLimit-Remaining': '0' })
      const response = await uploadPresign({ json: jest.fn() } as any)
      expect(response.status).toBe(429)
      expect(await getCounterValue('presign', 'rate_limited')).toBe(1)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('issues presign url and logs metrics on success', async () => {
      mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any)
      const body = {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        albumId: 'album-1',
      }
      const response = await uploadPresign({ json: jest.fn().mockResolvedValue(body) } as any)
      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toMatchObject({
        photoId: expect.any(String),
        uploadUrl: 'https://upload-url',
        fileKey: expect.any(String),
      })
      expect(await getCounterValue('presign', 'success')).toBe(1)
      expect(mockStorage.getPresignedUploadUrl).toHaveBeenCalledWith(expect.any(String), 'image/jpeg')
    })
  })

  describe('commit POST', () => {
    it('rejects unauthorized requests', async () => {
      mockedGetServerSession.mockResolvedValueOnce(null as any)
      const response = await uploadCommit({ json: jest.fn() } as any)
      expect(response.status).toBe(401)
      expect(await getCounterValue('commit', 'unauthorized')).toBe(1)
    })

    it('completes commit flow end-to-end', async () => {
      mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any)
      const presignBody = {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        albumId: 'album-1',
      }
      const presignResponse = await uploadPresign({ json: jest.fn().mockResolvedValue(presignBody) } as any)
      const { photoId, fileKey } = await presignResponse.json()
      mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetIn: 60 })
      const commitBody = { photoId, fileKey }
      const commitResponse = await uploadCommit({ json: jest.fn().mockResolvedValue(commitBody) } as any)
      expect(commitResponse.status).toBe(200)
      const commitPayload = await commitResponse.json()
      expect(commitPayload).toEqual({ success: true })
      expect(mockedQueueAdd).toHaveBeenCalledWith(
        'process-image',
        expect.objectContaining({ photoId, fileKey, userId: 'user-1' }),
      )
      expect(await getCounterValue('presign', 'success')).toBe(1)
      expect(await getCounterValue('commit', 'success')).toBe(1)
    })
  })
})

