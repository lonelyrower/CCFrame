import { NextRequest } from 'next/server'
import { GET } from '../health/route'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/storage-manager')
jest.mock('@/lib/redis')
jest.mock('@/lib/metrics')
jest.mock('@/lib/semantic-config')
jest.mock('@/lib/prometheus')

const mockDb = jest.requireMock('@/lib/db').db
const mockGetStorageManager = jest.requireMock('@/lib/storage-manager').getStorageManager
const mockGetRedis = jest.requireMock('@/lib/redis').getRedis
const mockGetImageTimingAverages = jest.requireMock('@/lib/metrics').getImageTimingAverages
const mockGetEmbeddingMetrics = jest.requireMock('@/lib/metrics').getEmbeddingMetrics
const mockGetSemanticApiMetrics = jest.requireMock('@/lib/metrics').getSemanticApiMetrics
const mockGetSemanticConfig = jest.requireMock('@/lib/semantic-config').getSemanticConfig

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockGetImageTimingAverages.mockReturnValue({
      count: 10,
      avgTotal: 150.5,
      avgBlurhash: 25.3,
      avgVariants: 125.2
    })

    mockGetEmbeddingMetrics.mockReturnValue({
      queryCache: { hits: 50, misses: 10, hitRate: 0.83 },
      negativeCache: { hits: 5, inserts: 2, size: 2 },
      layers: { memory: 30, redis: 15, provider: 5, negative: 5 }
    })

    mockGetSemanticApiMetrics.mockReturnValue({
      count: 100,
      avgMs: 85.2,
      p95Ms: 180.5,
      cacheHitRate: 0.45
    })

    mockGetSemanticConfig.mockReturnValue({
      enabled: true,
      mode: 'shadow'
    })
  })

  it('should return healthy status when all services are up', async () => {
    // Mock successful database query
    mockDb.$queryRaw.mockResolvedValue([])
    mockDb.$queryRawUnsafe.mockResolvedValueOnce([{ c: 0 }]).mockResolvedValueOnce([{ c: 5 }])

    // Mock successful storage health check
    const mockStorage = {
      healthCheck: jest.fn().mockResolvedValue({
        ok: true,
        latencyMs: 15,
        authOk: true
      })
    }
    mockGetStorageManager.mockReturnValue(mockStorage)

    // Mock successful Redis ping
    const mockRedis = {
      ping: jest.fn().mockResolvedValue('PONG')
    }
    mockGetRedis.mockResolvedValue(mockRedis)

    const request = new NextRequest('http://localhost/api/health')
    const response = await GET()

    expect(response.status).toBe(200)

    const data = await response.json()

    expect(data.ok).toBe(true)
    expect(data.version).toBeDefined()
    expect(data.time).toBeDefined()
    expect(data.uptimeSeconds).toBeGreaterThan(0)

    expect(data.services.db.ok).toBe(true)
    expect(data.services.storage.ok).toBe(true)
    expect(data.services.redis.ok).toBe(true)

    expect(data.metrics.process).toBeDefined()
    expect(data.metrics.imageProcessing).toBeDefined()
    expect(data.metrics.embeddings).toBeDefined()
    expect(data.metrics.semanticApi).toBeDefined()

    expect(data.semantic.mode).toBe('shadow')
    expect(data.latencyMs).toBeGreaterThan(0)
  })

  it('should return unhealthy status when database is down', async () => {
    // Mock database error
    mockDb.$queryRaw.mockRejectedValue(new Error('Connection refused'))
    mockDb.$queryRawUnsafe.mockResolvedValueOnce([{ c: 0 }]).mockResolvedValueOnce([{ c: 5 }])

    // Mock successful other services
    const mockStorage = {
      healthCheck: jest.fn().mockResolvedValue({ ok: true, latencyMs: 15, authOk: true })
    }
    mockGetStorageManager.mockReturnValue(mockStorage)

    const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') }
    mockGetRedis.mockResolvedValue(mockRedis)

    const request = new NextRequest('http://localhost/api/health')
    const response = await GET()

    expect(response.status).toBe(503)

    const data = await response.json()

    expect(data.ok).toBe(false)
    expect(data.services.db.ok).toBe(false)
    expect(data.dbError).toBe('Connection refused')
  })

  it('should return unhealthy status when storage is down', async () => {
    // Mock successful database
    mockDb.$queryRaw.mockResolvedValue([])
    mockDb.$queryRawUnsafe.mockResolvedValueOnce([{ c: 0 }]).mockResolvedValueOnce([{ c: 5 }])

    // Mock storage error
    const mockStorage = {
      healthCheck: jest.fn().mockResolvedValue({
        ok: false,
        authOk: false,
        error: 'Storage unavailable'
      })
    }
    mockGetStorageManager.mockReturnValue(mockStorage)

    // Mock successful Redis
    const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') }
    mockGetRedis.mockResolvedValue(mockRedis)

    const request = new NextRequest('http://localhost/api/health')
    const response = await GET()

    expect(response.status).toBe(503)

    const data = await response.json()

    expect(data.ok).toBe(false)
    expect(data.services.storage.ok).toBe(false)
    expect(data.services.storage.authOk).toBe(false)
    expect(data.storageError).toBe('Storage unavailable')
  })

  it('should handle Redis being unavailable gracefully', async () => {
    // Mock successful database
    mockDb.$queryRaw.mockResolvedValue([])
    mockDb.$queryRawUnsafe.mockResolvedValueOnce([{ c: 0 }]).mockResolvedValueOnce([{ c: 5 }])

    // Mock successful storage
    const mockStorage = {
      healthCheck: jest.fn().mockResolvedValue({ ok: true, latencyMs: 15, authOk: true })
    }
    mockGetStorageManager.mockReturnValue(mockStorage)

    // Mock Redis unavailable
    mockGetRedis.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/health')
    const response = await GET()

    expect(response.status).toBe(200)

    const data = await response.json()

    expect(data.ok).toBe(true)
    expect(data.services.redis.ok).toBe(false)
    expect(data.redisError).toBe('Redis not configured')
  })

  it('should handle Redis connection error', async () => {
    // Set REDIS_URL to simulate Redis being configured
    process.env.REDIS_URL = 'redis://localhost:6379'

    // Mock successful database
    mockDb.$queryRaw.mockResolvedValue([])
    mockDb.$queryRawUnsafe.mockResolvedValueOnce([{ c: 0 }]).mockResolvedValueOnce([{ c: 5 }])

    // Mock successful storage
    const mockStorage = {
      healthCheck: jest.fn().mockResolvedValue({ ok: true, latencyMs: 15, authOk: true })
    }
    mockGetStorageManager.mockReturnValue(mockStorage)

    // Mock Redis error
    const mockRedis = {
      ping: jest.fn().mockRejectedValue(new Error('Connection timeout'))
    }
    mockGetRedis.mockResolvedValue(mockRedis)

    const request = new NextRequest('http://localhost/api/health')
    const response = await GET()

    expect(response.status).toBe(503)

    const data = await response.json()

    expect(data.ok).toBe(false)
    expect(data.services.redis.ok).toBe(false)
    expect(data.redisError).toBe('Connection timeout')

    // Cleanup
    delete process.env.REDIS_URL
  })

  it('should include embedding lifecycle metrics', async () => {
    // Mock successful services
    mockDb.$queryRaw.mockResolvedValue([])
    mockDb.$queryRawUnsafe.mockResolvedValueOnce([{ c: 2 }]).mockResolvedValueOnce([{ c: 3 }])

    const mockStorage = {
      healthCheck: jest.fn().mockResolvedValue({ ok: true, latencyMs: 15, authOk: true })
    }
    mockGetStorageManager.mockReturnValue(mockStorage)

    const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') }
    mockGetRedis.mockResolvedValue(mockRedis)

    const request = new NextRequest('http://localhost/api/health')
    const response = await GET()

    const data = await response.json()

    expect(data.metrics.embeddingLifecycle).toEqual({
      orphanCount: 2,
      missingCount: 3
    })
  })

  it('should handle embedding lifecycle query errors', async () => {
    // Mock successful services
    mockDb.$queryRaw.mockResolvedValue([])
    mockDb.$queryRawUnsafe.mockRejectedValue(new Error('Query failed'))

    const mockStorage = {
      healthCheck: jest.fn().mockResolvedValue({ ok: true, latencyMs: 15, authOk: true })
    }
    mockGetStorageManager.mockReturnValue(mockStorage)

    const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') }
    mockGetRedis.mockResolvedValue(mockRedis)

    const request = new NextRequest('http://localhost/api/health')
    const response = await GET()

    const data = await response.json()

    expect(data.metrics.embeddingLifecycleError).toBe('Query failed')
  })
})