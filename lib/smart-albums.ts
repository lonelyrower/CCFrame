import type { Prisma } from '@prisma/client'
import { PHOTO_STATUS, VISIBILITY } from '@/lib/constants'

export type SmartRule = {
  tagsAny?: string[]
  tagsAll?: string[]
  tagsNone?: string[]
  visibility?: typeof VISIBILITY.PUBLIC | typeof VISIBILITY.PRIVATE | 'ANY'
  dateRange?: { from?: string; to?: string }
}

export function buildPhotoWhereFromRule(rule: SmartRule, userId: string): Prisma.PhotoWhereInput {
  const where: Prisma.PhotoWhereInput = { userId, status: PHOTO_STATUS.COMPLETED }
  if (rule.visibility && rule.visibility !== 'ANY') where.visibility = rule.visibility
  if (rule.dateRange) {
    const { from, to } = rule.dateRange
    if (from || to) {
      // Prefer takenAt; else createdAt
      const andArr: Prisma.PhotoWhereInput[] = Array.isArray((where as any).AND) ? ((where as any).AND as Prisma.PhotoWhereInput[]) : []
      ;(where as any).AND = andArr
      const takenFilter: any = {}
      if (from) takenFilter.gte = new Date(from)
      if (to) takenFilter.lte = new Date(to)
      where.OR = [
        { takenAt: takenFilter },
        { AND: [ { takenAt: null }, { createdAt: takenFilter } ] },
      ]
    }
  }
  if (rule.tagsAny && rule.tagsAny.length) {
    const andArr: Prisma.PhotoWhereInput[] = Array.isArray((where as any).AND) ? ((where as any).AND as Prisma.PhotoWhereInput[]) : []
    andArr.push({ tags: { some: { tag: { name: { in: rule.tagsAny } } } } })
    ;(where as any).AND = andArr
  }
  if (rule.tagsAll && rule.tagsAll.length) {
    const andArr: Prisma.PhotoWhereInput[] = Array.isArray((where as any).AND) ? ((where as any).AND as Prisma.PhotoWhereInput[]) : []
    for (const t of rule.tagsAll) {
      andArr.push({ tags: { some: { tag: { name: t } } } })
    }
    ;(where as any).AND = andArr
  }
  if (rule.tagsNone && rule.tagsNone.length) {
    const andArr: Prisma.PhotoWhereInput[] = Array.isArray((where as any).AND) ? ((where as any).AND as Prisma.PhotoWhereInput[]) : []
    andArr.push({ NOT: { tags: { some: { tag: { name: { in: rule.tagsNone } } } } } })
    ;(where as any).AND = andArr
  }
  return where
}
