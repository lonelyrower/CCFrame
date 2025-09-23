import { mocked } from 'jest-mock'

jest.mock('@/lib/db', () => ({
  db: {
    photo: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    audit: {
      findMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getTaskGroups } from '@/lib/admin/task-center'

describe('task-center', () => {
  const photoFindMany = mocked(db.photo.findMany)
  const userFindMany = mocked(db.user.findMany)
  const auditFindMany = mocked(db.audit.findMany)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('aggregates tasks into groups with summary totals', async () => {
    const now = new Date()
    photoFindMany
      .mockResolvedValueOnce([
        { id: 'failed-1', fileKey: 'failed.jpg', updatedAt: now, createdAt: now, status: 'FAILED', album: { title: 'A' } },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 'stall-1',
          fileKey: 'stall.jpg',
          updatedAt: new Date(now.getTime() - 60_000),
          createdAt: now,
          status: 'PROCESSING',
          album: { title: 'B' },
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 'pending-1',
          fileKey: 'pending.jpg',
          createdAt: now,
          album: { title: 'C' },
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 'draft-1',
          fileKey: 'draft.jpg',
          updatedAt: now,
          album: { title: 'D' },
        },
      ] as any)

    userFindMany.mockResolvedValueOnce([
      { id: 'u1', email: 'missing@ccframe.dev', createdAt: now },
    ] as any)

    auditFindMany.mockResolvedValueOnce([
      { id: 'alert-1', action: 'ERROR', targetType: 'queue', targetId: 'job-1', createdAt: now, meta: {}, userId: 'u1' },
    ] as any)

    const { groups, summary } = await getTaskGroups()

    const uploadsGroup = groups.find((group) => group.id === 'uploads')
    const reviewGroup = groups.find((group) => group.id === 'review')
    const configGroup = groups.find((group) => group.id === 'configuration')

    expect(uploadsGroup?.total).toBe(2)
    expect(reviewGroup?.total).toBe(2)
    expect(configGroup?.total).toBe(2)
    expect(summary.totalPending).toBe(6)
    expect(summary.critical).toBeGreaterThanOrEqual(1)
  })
})
