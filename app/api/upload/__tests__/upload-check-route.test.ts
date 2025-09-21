import { NextRequest } from 'next/server'

const mockRateLimit = jest.fn()
const mockRateLimitHeaders = jest.fn()
const mockGetClientIp = jest.fn()

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  rateLimitHeaders: mockRateLimitHeaders,
  getClientIp: mockGetClientIp,
}))

const mockPhoto = {
  findFirst: jest.fn(),
}

jest.mock('@/lib/db', () => ({
  db: { photo: mockPhoto }
}))

describe('upload check route', () => {
  beforeEach(() => {
    mockRateLimit.mockReset()
    mockRateLimitHeaders.mockReset()
    mockGetClientIp.mockReset()
    mockPhoto.findFirst.mockReset()
    mockGetClientIp.mockReturnValue('127.0.0.1')
    mockRateLimitHeaders.mockReturnValue({})
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 5, limit: 5, resetIn: 60 })
  })

  it('returns 429 when rate limited', async () => {
    jest.resetModules()
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, limit: 5, resetIn: 60 })
    mockRateLimitHeaders.mockReturnValue({ 'X-RateLimit-Remaining': '0' })
    const { GET } = await import('../check/route')
    const request = new NextRequest('http://localhost/api/upload/check?hash=abcd')

    const response = await GET(request)

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: '检查频率过高，请稍后再试' })
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(mockPhoto.findFirst).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid hash', async () => {
    jest.resetModules()
    const { GET } = await import('../check/route')
    const request = new NextRequest('http://localhost/api/upload/check?hash=short')

    const response = await GET(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: '文件哈希值无效' })
    expect(mockPhoto.findFirst).not.toHaveBeenCalled()
  })

  it('returns existing false when hash not found', async () => {
    jest.resetModules()
    mockPhoto.findFirst.mockResolvedValue(null)
    const { GET } = await import('../check/route')
    const request = new NextRequest('http://localhost/api/upload/check?hash=1234567890abcdef')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ existing: false })
    expect(mockPhoto.findFirst).toHaveBeenCalledWith({
      where: { contentHash: '1234567890abcdef', status: 'COMPLETED' },
      select: { id: true, width: true, height: true, blurhash: true }
    })
  })

  it('returns existing photo payload when found', async () => {
    jest.resetModules()
    const photo = { id: 'photo-1', width: 1000, height: 700, blurhash: 'hash' }
    mockPhoto.findFirst.mockResolvedValue(photo)
    const { GET } = await import('../check/route')
    const request = new NextRequest('http://localhost/api/upload/check?hash=1234567890abcdef')

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ existing: true, photo })
    expect(mockRateLimitHeaders).toHaveBeenCalledWith({ allowed: true, remaining: 5, limit: 5, resetIn: 60 })
  })
})
