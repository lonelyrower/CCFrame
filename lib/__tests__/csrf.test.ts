import { NextRequest } from 'next/server'
import { CSRFProtection, withCSRFProtection } from '../csrf'

// Mock dependencies
jest.mock('next-auth')
jest.mock('../auth')

const mockGetServerSession = jest.requireMock('next-auth').getServerSession

describe('CSRFProtection', () => {
  const testUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: { id: testUserId }
    })
  })

  describe('Token Generation and Verification', () => {
    it('should generate and verify valid token', () => {
      const token = CSRFProtection.generateToken(testUserId)

      expect(typeof token).toBe('string')
      expect(token).toContain('.')

      const isValid = CSRFProtection.verifyToken(token, testUserId)
      expect(isValid).toBe(true)
    })

    it('should reject token with wrong user ID', () => {
      const token = CSRFProtection.generateToken(testUserId)
      const isValid = CSRFProtection.verifyToken(token, 'different-user')

      expect(isValid).toBe(false)
    })

    it('should reject malformed token', () => {
      const isValid = CSRFProtection.verifyToken('malformed-token', testUserId)
      expect(isValid).toBe(false)
    })

    it('should reject expired token', () => {
      // Mock Date.now to simulate token generation in the past
      const originalNow = Date.now
      Date.now = jest.fn(() => 0) // Token generated at timestamp 0

      const token = CSRFProtection.generateToken(testUserId)

      // Restore Date.now and advance time beyond expiry
      Date.now = jest.fn(() => 1000 * 60 * 60 * 2) // 2 hours later

      const isValid = CSRFProtection.verifyToken(token, testUserId)

      // Restore original Date.now
      Date.now = originalNow

      expect(isValid).toBe(false)
    })
  })

  describe('Token Extraction', () => {
    it('should extract token from X-CSRF-Token header', () => {
      const token = 'test-token-123'
      const request = new NextRequest('http://localhost/test', {
        headers: { 'X-CSRF-Token': token }
      })

      const extracted = CSRFProtection.extractToken(request)
      expect(extracted).toBe(token)
    })

    it('should extract token from _token query parameter', () => {
      const token = 'test-token-123'
      const request = new NextRequest(`http://localhost/test?_token=${token}`)

      const extracted = CSRFProtection.extractToken(request)
      expect(extracted).toBe(token)
    })

    it('should return null when no token found', () => {
      const request = new NextRequest('http://localhost/test')
      const extracted = CSRFProtection.extractToken(request)
      expect(extracted).toBeNull()
    })
  })

  describe('Request Verification', () => {
    it('should verify valid request', async () => {
      const token = CSRFProtection.generateToken(testUserId)
      const request = new NextRequest('http://localhost/test', {
        headers: { 'X-CSRF-Token': token }
      })

      const result = await CSRFProtection.verifyRequest(request)

      expect(result.valid).toBe(true)
      expect(result.userId).toBe(testUserId)
    })

    it('should reject request without session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/test')
      const result = await CSRFProtection.verifyRequest(request)

      expect(result.valid).toBe(false)
      expect(result.userId).toBeUndefined()
    })

    it('should reject request without token', async () => {
      const request = new NextRequest('http://localhost/test')
      const result = await CSRFProtection.verifyRequest(request)

      expect(result.valid).toBe(false)
    })
  })

  describe('CSRF Protection Middleware', () => {
    const mockHandler = jest.fn()

    beforeEach(() => {
      mockHandler.mockClear()
      mockHandler.mockResolvedValue(new Response('OK'))
    })

    it('should allow GET requests without CSRF check', async () => {
      const protectedHandler = withCSRFProtection(mockHandler)
      const request = new NextRequest('http://localhost/test', { method: 'GET' })

      await protectedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request)
    })

    it('should require CSRF token for POST requests', async () => {
      const protectedHandler = withCSRFProtection(mockHandler)
      const request = new NextRequest('http://localhost/test', { method: 'POST' })

      const response = await protectedHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid CSRF token')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should allow POST requests with valid CSRF token', async () => {
      const token = CSRFProtection.generateToken(testUserId)
      const protectedHandler = withCSRFProtection(mockHandler)
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'X-CSRF-Token': token }
      })

      await protectedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request)
    })

    it('should require CSRF token for PUT requests', async () => {
      const protectedHandler = withCSRFProtection(mockHandler)
      const request = new NextRequest('http://localhost/test', { method: 'PUT' })

      const response = await protectedHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid CSRF token')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should require CSRF token for DELETE requests', async () => {
      const protectedHandler = withCSRFProtection(mockHandler)
      const request = new NextRequest('http://localhost/test', { method: 'DELETE' })

      const response = await protectedHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid CSRF token')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should require CSRF token for PATCH requests', async () => {
      const protectedHandler = withCSRFProtection(mockHandler)
      const request = new NextRequest('http://localhost/test', { method: 'PATCH' })

      const response = await protectedHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid CSRF token')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})