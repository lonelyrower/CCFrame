import { mocked } from 'jest-mock'

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    photoVariant: {
      aggregate: jest.fn(),
    },
  },
}))

jest.mock('@/lib/runtime-config', () => ({
  getRuntimeConfig: jest.fn(),
}))

jest.mock('@/lib/storage-manager', () => ({
  StorageManager: {
    createFromSettings: jest.fn(),
  },
}))

jest.mock('@/lib/observability/metrics', () => ({
  recordAdminOperation: jest.fn(),
  recordAdminAlert: jest.fn(),
}))

import { db } from '@/lib/db'
import { getRuntimeConfig } from '@/lib/runtime-config'
import { validateSettings } from '@/lib/admin/settings-service'
import { recordAdminAlert, recordAdminOperation } from '@/lib/observability/metrics'
import { StorageManager } from '@/lib/storage-manager'

describe('settings-service validation', () => {
  const userMock = mocked(db.user.findUnique)
  const aggregateMock = mocked(db.photoVariant.aggregate)
  const runtimeMock = mocked(getRuntimeConfig)
  const storageMock = StorageManager.createFromSettings as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    aggregateMock.mockResolvedValue({ _sum: { sizeBytes: 1024 } } as any)
  })

  test('storage validation succeeds for local provider', async () => {
    runtimeMock.mockReturnValue({ storage: { provider: 'local' } })
    const result = await validateSettings('storage', 'user-1')
    expect(result.success).toBe(true)
    expect(storageMock).not.toHaveBeenCalled()
  })

  test('storage validation runs health check for minio', async () => {
    runtimeMock.mockReturnValue({ storage: { provider: 'minio', minio: {} } })
    storageMock.mockReturnValue({
      healthCheck: jest.fn().mockResolvedValue({ ok: true, latencyMs: 42 }),
    } as any)
    const result = await validateSettings('storage', 'user-1')
    expect(result.success).toBe(true)
    expect(storageMock).toHaveBeenCalled()
    expect(recordAdminOperation).toHaveBeenCalledWith(
      'settings.validate.storage',
      expect.any(Number),
      'success',
      expect.objectContaining({ message: expect.any(String) }),
    )
  })

  test('integrations validation fails without api key and records alert', async () => {
    runtimeMock.mockReturnValue({})
    userMock.mockResolvedValue({ pixabayApiKey: '', defaultSeedCount: 12 } as any)
    const result = await validateSettings('integrations', 'user-2')
    expect(result.success).toBe(false)
    expect(recordAdminAlert).toHaveBeenCalledWith('settings-integrations', expect.any(String), undefined)
  })

  test('integrations validation success when key present', async () => {
    runtimeMock.mockReturnValue({})
    userMock.mockResolvedValue({ pixabayApiKey: 'key', defaultSeedCount: 12 } as any)
    const result = await validateSettings('integrations', 'user-3')
    expect(result.success).toBe(true)
  })

  test('semantic validation warns when enabled but missing model', async () => {
    runtimeMock.mockReturnValue({ semantic: { enabled: true } })
    const result = await validateSettings('semantic', 'user-4')
    expect(result.success).toBe(false)
  })
})
