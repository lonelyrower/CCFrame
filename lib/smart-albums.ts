import type { Prisma } from '@prisma/client'

export type SmartRule = {
  tagsAny?: string[]
  tagsAll?: string[]
  tagsNone?: string[]
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ANY'
  dateRange?: { from?: string; to?: string }
}

export function buildPhotoWhereFromRule(rule: SmartRule, userId: string): Prisma.PhotoWhereInput {
  const where: Prisma.PhotoWhereInput = { userId, status: 'COMPLETED' }
  if (rule.visibility && rule.visibility !== 'ANY') where.visibility = rule.visibility
  if (rule.dateRange) {
    const { from, to } = rule.dateRange
    if (from || to) {
      // Prefer takenAt; else createdAt
      where.AND = where.AND || []
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
    where.AND = where.AND || []
    where.AND.push({ tags: { some: { tag: { name: { in: rule.tagsAny } } } } })
  }
  if (rule.tagsAll && rule.tagsAll.length) {
    where.AND = where.AND || []
    for (const t of rule.tagsAll) {
      where.AND.push({ tags: { some: { tag: { name: t } } } })
    }
  }
  if (rule.tagsNone && rule.tagsNone.length) {
    where.AND = where.AND || []
    where.AND.push({ NOT: { tags: { some: { tag: { name: { in: rule.tagsNone } } } } } })
  }
  return where
}

