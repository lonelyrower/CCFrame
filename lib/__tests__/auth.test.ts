import type { NextAuthOptions } from "next-auth"

const mockDbUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
}

jest.mock('@/lib/db', () => ({ db: { user: mockDbUser } }))

const mockBcrypt = {
  compare: jest.fn(),
  hash: jest.fn(),
}

jest.mock('bcryptjs', () => mockBcrypt)

describe('auth module', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    mockDbUser.findUnique.mockReset()
    mockDbUser.create.mockReset()
    mockBcrypt.compare.mockReset()
    mockBcrypt.hash.mockReset()
    Object.assign(process.env, originalEnv)
  })

  afterEach(() => {
    jest.resetModules()
  })

  const withAuthModule = async (fn: (mod: { authOptions: NextAuthOptions; createAdminUser: () => Promise<any> }) => Promise<void>) => {
    await jest.isolateModulesAsync(async () => {
      const mod = await import('../auth')
      await fn(mod)
    })
  }

  const getAuthorizeFn = (authOptions: NextAuthOptions) => {
    const provider: any = authOptions.providers[0]
    expect(provider).toBeDefined()
    const authorize = provider.options?.authorize
    expect(typeof authorize).toBe('function')
    return authorize as (credentials: any) => Promise<any>
  }

  it('returns null when credentials are missing', async () => {
    await withAuthModule(async ({ authOptions }) => {
      const authorize = getAuthorizeFn(authOptions)
      const result = await authorize(undefined)
      expect(result).toBeNull()
    })
  })

  it('returns null when user not found', async () => {
    mockDbUser.findUnique.mockResolvedValue(null)
    await withAuthModule(async ({ authOptions }) => {
      const authorize = getAuthorizeFn(authOptions)
      const result = await authorize({ email: 'test@example.com', password: 'secret' })
      expect(mockDbUser.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } })
      expect(result).toBeNull()
    })
  })

  it('returns null when password does not match', async () => {
    mockDbUser.findUnique.mockResolvedValue({ id: 'u1', email: 'test@example.com', passwordHash: 'hash' })
    mockBcrypt.compare.mockResolvedValue(false)
    await withAuthModule(async ({ authOptions }) => {
      const authorize = getAuthorizeFn(authOptions)
      const result = await authorize({ email: 'test@example.com', password: 'wrong' })
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrong', 'hash')
      expect(result).toBeNull()
    })
  })

  it('returns user when credentials valid', async () => {
    mockDbUser.findUnique.mockResolvedValue({ id: 'u1', email: 'test@example.com', passwordHash: 'hash' })
    mockBcrypt.compare.mockResolvedValue(true)
    await withAuthModule(async ({ authOptions }) => {
      const authorize = getAuthorizeFn(authOptions)
      const result = await authorize({ email: 'test@example.com', password: 'secret' })
      expect(result).toEqual({ id: 'u1', email: 'test@example.com', twoFactorEnabled: false })
    })
  })

  it('createAdminUser skips when env missing', async () => {
    delete process.env.ADMIN_EMAIL
    delete process.env.ADMIN_PASSWORD
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    await withAuthModule(async ({ createAdminUser }) => {
      const result = await createAdminUser()
      expect(result).toBeUndefined()
    })

    expect(mockDbUser.findUnique).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('createAdminUser returns existing user when found', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com'
    process.env.ADMIN_PASSWORD = 'password'
    mockDbUser.findUnique.mockResolvedValue({ id: 'admin', email: 'admin@example.com' })
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})

    await withAuthModule(async ({ createAdminUser }) => {
      const result = await createAdminUser()
      expect(result).toEqual({ id: 'admin', email: 'admin@example.com' })
    })

    expect(mockDbUser.create).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('createAdminUser creates user when missing', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com'
    process.env.ADMIN_PASSWORD = 'password'
    mockDbUser.findUnique.mockResolvedValueOnce(null)
    mockBcrypt.hash.mockResolvedValue('hashed')
    mockDbUser.create.mockResolvedValue({ id: 'admin', email: 'admin@example.com' })
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})

    await withAuthModule(async ({ createAdminUser }) => {
      const result = await createAdminUser()
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password', 12)
      expect(mockDbUser.create).toHaveBeenCalledWith({
        data: { email: 'admin@example.com', passwordHash: 'hashed' }
      })
      expect(result).toEqual({ id: 'admin', email: 'admin@example.com' })
    })

    log.mockRestore()
  })
})
