import { NextRequest } from 'next/server'

const getServerSession = jest.fn()

jest.mock('next-auth', () => ({
  getServerSession,
}))

jest.mock('@/lib/auth', () => ({ authOptions: {} }))

const mockDb = {
  user: {
    findUnique: jest.fn(),
  },
  photo: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({ db: mockDb }))

const storageInstance = {
  generateKey: jest.fn((prefix: string, name: string) => `${prefix}/${name}`),
  uploadBuffer: jest.fn(),
  deleteObject: jest.fn(),
}
const getStorageManager = jest.fn(() => storageInstance)
const storageManagerStatic = {
  generateKey: jest.fn((prefix: string, name: string) => `${prefix}/${name}`),
}

jest.mock('@/lib/storage-manager', () => ({
  getStorageManager,
  StorageManager: storageManagerStatic,
}))

const localStorageInstance = {
  generateKey: jest.fn((prefix: string, name: string) => `${prefix}/${name}`),
  uploadBuffer: jest.fn(),
}
const getLocalStorageManager = jest.fn(() => localStorageInstance)
const localStorageStatic = {
  generateKey: jest.fn((prefix: string, name: string) => `${prefix}/${name}`),
}

jest.mock('@/lib/local-storage', () => ({
  getLocalStorageManager,
  LocalStorageManager: localStorageStatic,
}))

const ImageProcessor = {
  processImage: jest.fn(),
  calculateContentHash: jest.fn(),
  calculateHash: jest.fn(),
}

jest.mock('@/lib/image-processing', () => ({ ImageProcessor }))

const ExifProcessor = {
  extractExif: jest.fn(),
}

jest.mock('@/lib/exif', () => ({ ExifProcessor }))

const originalFetch = global.fetch
const fetchMock = jest.fn()

const originalEnv = { ...process.env }

describe('Pixabay seed route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).fetch = fetchMock
    Object.keys(process.env).forEach(key => { delete process.env[key] })
    Object.assign(process.env, originalEnv)
    mockDb.user.findUnique.mockReset()
    mockDb.photo.findFirst.mockReset()
    mockDb.photo.create.mockReset()
    mockDb.photo.update.mockReset()
    storageInstance.generateKey.mockReset()
    storageInstance.uploadBuffer.mockReset()
    storageInstance.deleteObject.mockReset()
    storageManagerStatic.generateKey.mockReset()
    getStorageManager.mockReset()
    localStorageInstance.generateKey.mockReset()
    localStorageInstance.uploadBuffer.mockReset()
    localStorageStatic.generateKey.mockReset()
    getLocalStorageManager.mockReset()
    ImageProcessor.processImage.mockReset()
    ImageProcessor.calculateContentHash.mockReset()
    ImageProcessor.calculateHash.mockReset()
    ExifProcessor.extractExif.mockReset()
    fetchMock.mockReset()
    getServerSession.mockReset()

    getStorageManager.mockImplementation(() => storageInstance)
    storageInstance.generateKey.mockImplementation((prefix: string, name: string) => `${prefix}/${name}`)
    storageInstance.uploadBuffer.mockImplementation(async () => undefined)
    storageInstance.deleteObject.mockImplementation(async () => undefined)
    storageManagerStatic.generateKey.mockImplementation((prefix: string, name: string) => `${prefix}/${name}`)
    getLocalStorageManager.mockImplementation(() => localStorageInstance)
    localStorageInstance.generateKey.mockImplementation((prefix: string, name: string) => `${prefix}/${name}`)
    localStorageInstance.uploadBuffer.mockImplementation(async () => undefined)
    localStorageStatic.generateKey.mockImplementation((prefix: string, name: string) => `${prefix}/${name}`)
  })

  afterAll(() => {
    if (originalFetch) {
      ;(global as any).fetch = originalFetch
    }
    Object.keys(process.env).forEach(key => { delete process.env[key] })
    Object.assign(process.env, originalEnv)
  })

  const runPost = async (request: NextRequest, assert: (response: Response) => Promise<void>) => {
    await jest.isolateModulesAsync(async () => {
      const { POST } = await import('../pixabay/route')
      const response = await POST(request)
      await assert(response)
    })
  }

  it('returns 401 when session missing', async () => {
    process.env.SEED_TOKEN = 'token'
    getServerSession.mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/dev/seed/pixabay', { method: 'POST' })

    await runPost(request, async response => {
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })
  })

  it('rejects when seed token mismatch', async () => {
    process.env.SEED_TOKEN = 'token'
    process.env.SEED_ALLOWED_IPS = ''
    getServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-1', pixabayApiKey: 'key' })

    const request = new NextRequest('http://localhost/api/dev/seed/pixabay', {
      method: 'POST',
      headers: new Headers({ 'x-seed-token': 'wrong' }),
      body: JSON.stringify({ count: 1 }),
    })

    await runPost(request, async response => {
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Forbidden' })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('returns seeded count zero when pixabay returns no hits', async () => {
    process.env.SEED_TOKEN = 'token'
    process.env.SEED_ALLOWED_IPS = ''
    process.env.SEED_MAX_COUNT = '5'
    getServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-1', pixabayApiKey: 'api-key' })
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ hits: [] }) })

    const request = new NextRequest('http://localhost/api/dev/seed/pixabay', {
      method: 'POST',
      headers: new Headers({ 'x-seed-token': 'token' }),
      body: JSON.stringify({ count: 2, query: 'nature' }),
    })

    await runPost(request, async response => {
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ seeded: 0 })
      expect(getStorageManager).not.toHaveBeenCalled()
    })
  })

  it('processes images and uploads when hits returned', async () => {
    process.env.SEED_TOKEN = 'token'
    process.env.SEED_ALLOWED_IPS = ''
    process.env.SEED_MAX_COUNT = '5'
    getServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-1', pixabayApiKey: 'api-key' })
    mockDb.photo.findFirst.mockResolvedValue(null)
    mockDb.photo.create.mockResolvedValue({ id: 'photo-1' })
    mockDb.photo.update.mockResolvedValue({})

    const arrayBuffer = new TextEncoder().encode('image-data').buffer
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hits: [{ largeImageURL: 'https://cdn.example.com/photo.jpg' }] }) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => arrayBuffer })

    ImageProcessor.calculateContentHash.mockResolvedValue('content-hash')
    ImageProcessor.processImage.mockResolvedValue({
      variants: [
        { variant: 'thumb', format: 'jpeg', buffer: Buffer.from('thumb'), width: 320, height: 200, size: 123 },
      ],
      blurhash: 'blurhash',
      metadata: { width: 2048, height: 1365 },
    })
    ImageProcessor.calculateHash.mockResolvedValue('perceptual-hash')
    ExifProcessor.extractExif.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/dev/seed/pixabay', {
      method: 'POST',
      headers: new Headers({ 'x-seed-token': 'token' }),
      body: JSON.stringify({ count: 1, query: 'forest', visibility: 'PRIVATE' }),
    })

    await runPost(request, async response => {
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ seeded: 1 })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(mockDb.photo.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', contentHash: 'content-hash', status: 'COMPLETED' },
        include: { variants: true }
      })
      expect(storageInstance.uploadBuffer).toHaveBeenCalledTimes(2)
      expect(ImageProcessor.processImage).toHaveBeenCalled()
      expect(mockDb.photo.update).toHaveBeenCalledWith({
        where: { id: 'photo-1' },
        data: expect.objectContaining({
          hash: 'perceptual-hash',
          contentHash: 'content-hash',
          status: 'COMPLETED',
        })
      })
    })
  })
})
