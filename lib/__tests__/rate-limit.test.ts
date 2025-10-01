import type { RateLimitResult } from "../rate-limit"

const originalEnv = { ...process.env }

const mockDateNow = (ms: number) => {
  jest.spyOn(Date, 'now').mockReturnValue(ms)
}

describe('rateLimit utilities', () => {
  afterEach(() => {
    jest.resetModules()
    jest.useRealTimers()
    jest.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  it('allows requests when redis connection is missing', async () => {
    jest.doMock('@/lib/redis', () => ({ getRedis: () => Promise.resolve(null) }))
    const { rateLimit } = await import('../rate-limit')

    const result = await rateLimit('user-1', 'auth:login', 5, 60)

    expect(result).toEqual({ allowed: true, remaining: 4, limit: 5, resetIn: expect.any(Number) })
  })

  it('enforces limit and sets ttl via redis', async () => {
    const incr = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(6)
    const expire = jest.fn().mockResolvedValue(undefined)
    jest.doMock('@/lib/redis', () => ({ getRedis: () => Promise.resolve({ incr, expire }) }))

    mockDateNow(1_700_000_000_000)
    const { rateLimit } = await import('../rate-limit')

    const first = await rateLimit('user-1', 'upload:presign', 5, 60)
    const second = await rateLimit('user-1', 'upload:presign', 5, 60)

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(4)
    expect(expire).toHaveBeenCalledTimes(1)
    const expireArgs = expire.mock.calls[0]
    expect(expireArgs[0]).toMatch(/^rl:upload:presign:user-1:/)
    expect(expireArgs[1]).toBeGreaterThanOrEqual(60)

    expect(second.allowed).toBe(false)
    expect(second.remaining).toBe(0)
    expect(second.limit).toBe(5)
    expect(second.resetIn).toBeGreaterThanOrEqual(0)
  })

  it('fails open when redis throws errors', async () => {
    const incr = jest.fn().mockRejectedValue(new Error('redis down'))
    const expire = jest.fn()
    jest.doMock('@/lib/redis', () => ({ getRedis: () => Promise.resolve({ incr, expire }) }))

    const { rateLimit } = await import('../rate-limit')

    const result = await rateLimit('user-1', 'metrics:pull', 10, 120)

    expect(result).toEqual({ allowed: true, remaining: 9, limit: 10, resetIn: expect.any(Number) })
    expect(incr).toHaveBeenCalled()
  })

  it('extracts client ip from forwarded headers with fallback', async () => {
    jest.doMock('@/lib/redis', () => ({ getRedis: () => Promise.resolve(null) }))
    const { getClientIp } = await import('../rate-limit')
    const request = new Request('http://example.com', {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.5, 70.41.3.18',
        'x-real-ip': '198.51.100.2',
      }),
    })

    expect(getClientIp(request)).toBe('203.0.113.5')

    const noHeaderReq = new Request('http://example.com')
    expect(getClientIp(noHeaderReq)).toBe('anonymous')
  })

  it('clamps negative values in rateLimitHeaders', async () => {
    jest.doMock('@/lib/redis', () => ({ getRedis: () => Promise.resolve(null) }))
    const { rateLimitHeaders } = await import('../rate-limit')
    const headers = rateLimitHeaders({ allowed: false, remaining: -3, limit: 20, resetIn: -10 })

    expect(headers['X-RateLimit-Limit']).toBe('20')
    expect(headers['X-RateLimit-Remaining']).toBe('0')
    expect(headers['X-RateLimit-Reset']).toBe('0')
  })
})
