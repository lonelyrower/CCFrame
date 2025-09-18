import { buildPhotoWhereFromRule, type SmartRule } from '../smart-albums'
import { PHOTO_STATUS, VISIBILITY } from '@/lib/constants'

describe('buildPhotoWhereFromRule', () => {
  test('basic visibility filter', () => {
    const rule: SmartRule = { visibility: VISIBILITY.PUBLIC }
    const where = buildPhotoWhereFromRule(rule, 'user1')
    expect(where).toMatchObject({ userId: 'user1', status: PHOTO_STATUS.COMPLETED, visibility: VISIBILITY.PUBLIC })
  })

  test('date range builds OR with takenAt preference', () => {
    const rule: SmartRule = { dateRange: { from: '2024-01-01', to: '2024-12-31' } }
    const where: any = buildPhotoWhereFromRule(rule, 'u')
    expect(where.OR).toBeDefined()
    expect(where.OR.length).toBe(2)
  })

  test('tagsAny & tagsNone combine in AND', () => {
    const rule: SmartRule = { tagsAny: ['travel','family'], tagsNone: ['work'] }
    const where: any = buildPhotoWhereFromRule(rule, 'u2')
    expect(where.AND).toBeDefined()
    const andJson = JSON.stringify(where.AND)
    expect(andJson).toContain('travel')
    expect(andJson).toContain('family')
    expect(andJson).toContain('work')
  })
})
