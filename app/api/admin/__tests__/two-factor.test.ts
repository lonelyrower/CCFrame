import { NextRequest } from 'next/server'
import { POST as setupPost } from '../two-factor/setup/route'
import { POST as enablePost } from '../two-factor/enable/route'
import { POST as disablePost } from '../two-factor/disable/route'
import { GET as statusGet } from '../two-factor/status/route'

// Mock dependencies
jest.mock('@/lib/admin-auth')
jest.mock('@/lib/two-factor')
jest.mock('@/lib/logger')

const mockRequireAdmin = jest.requireMock('@/lib/admin-auth').requireAdmin
const mockTwoFactorAuth = jest.requireMock('@/lib/two-factor').TwoFactorAuth
const mockLogger = jest.requireMock('@/lib/logger').logger

describe('Two-Factor Authentication API', () => {
  const mockAdminAuth = {
    adminUserId: 'test-admin-id',
    adminEmail: 'admin@test.com',
    session: { user: { id: 'test-admin-id', email: 'admin@test.com' } }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(mockAdminAuth)
    mockLogger.info = jest.fn()
    mockLogger.warn = jest.fn()
    mockLogger.error = jest.fn()
  })

  describe('Setup 2FA', () => {
    it('should generate 2FA setup successfully', async () => {
      const mockSetup = {
        qrCodeUrl: 'data:image/png;base64,test',
        manualEntryKey: 'TESTKEY123',
        secret: 'TESTSECRET123'
      }

      mockTwoFactorAuth.isEnabled.mockResolvedValue(false)
      mockTwoFactorAuth.generateSetup.mockResolvedValue(mockSetup)

      const request = new NextRequest('http://localhost/api/admin/two-factor/setup', {
        method: 'POST'
      })

      const response = await setupPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.qrCodeUrl).toBe(mockSetup.qrCodeUrl)
      expect(data.manualEntryKey).toBe(mockSetup.manualEntryKey)
      expect(data.secret).toBe(mockSetup.secret)
    })

    it('should fail if 2FA is already enabled', async () => {
      mockTwoFactorAuth.isEnabled.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/two-factor/setup', {
        method: 'POST'
      })

      const response = await setupPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('2FA already enabled')
    })
  })

  describe('Enable 2FA', () => {
    it('should enable 2FA with valid token', async () => {
      mockTwoFactorAuth.isEnabled.mockResolvedValue(false)
      mockTwoFactorAuth.verifyToken.mockReturnValue(true)
      mockTwoFactorAuth.enableTwoFactor.mockResolvedValue(undefined)

      const requestBody = {
        secret: 'TESTSECRET123',
        token: '123456'
      }

      const request = new NextRequest('http://localhost/api/admin/two-factor/enable', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await enablePost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('双重认证已启用')
    })

    it('should fail with invalid token', async () => {
      mockTwoFactorAuth.isEnabled.mockResolvedValue(false)
      mockTwoFactorAuth.verifyToken.mockReturnValue(false)

      const requestBody = {
        secret: 'TESTSECRET123',
        token: '000000'
      }

      const request = new NextRequest('http://localhost/api/admin/two-factor/enable', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await enablePost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('验证码无效')
    })
  })

  describe('Disable 2FA', () => {
    it('should disable 2FA with valid token', async () => {
      mockTwoFactorAuth.isEnabled.mockResolvedValue(true)
      mockTwoFactorAuth.getUserSecret.mockResolvedValue('TESTSECRET123')
      mockTwoFactorAuth.verifyToken.mockReturnValue(true)
      mockTwoFactorAuth.disableTwoFactor.mockResolvedValue(undefined)

      const requestBody = {
        token: '123456'
      }

      const request = new NextRequest('http://localhost/api/admin/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await disablePost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('双重认证已禁用')
    })

    it('should fail if 2FA is not enabled', async () => {
      mockTwoFactorAuth.isEnabled.mockResolvedValue(false)

      const requestBody = {
        token: '123456'
      }

      const request = new NextRequest('http://localhost/api/admin/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await disablePost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('2FA not enabled')
    })
  })

  describe('2FA Status', () => {
    it('should return enabled status', async () => {
      mockTwoFactorAuth.isEnabled.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/two-factor/status', {
        method: 'GET'
      })

      const response = await statusGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enabled).toBe(true)
      expect(data.message).toBe('双重认证已启用')
    })

    it('should return disabled status', async () => {
      mockTwoFactorAuth.isEnabled.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/admin/two-factor/status', {
        method: 'GET'
      })

      const response = await statusGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enabled).toBe(false)
      expect(data.message).toBe('双重认证未启用')
    })
  })
})