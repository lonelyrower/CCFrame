import { cacheGet, cacheSet } from '@/lib/cache'
import type { LookbookExportRecord, LookbookExportStatus } from '@/types/lookbook'

const STATUS_TTL_SECONDS = 60 * 60 * 24 // 24h

function statusKey(id: string) {
  return `lookbook:export:${id}`
}

export async function saveLookbookStatus(record: LookbookExportRecord): Promise<void> {
  await cacheSet(statusKey(record.id), record, { ttlSeconds: STATUS_TTL_SECONDS })
}

export async function getLookbookStatus(id: string): Promise<LookbookExportRecord | null> {
  return cacheGet<LookbookExportRecord>(statusKey(id))
}

export async function upsertLookbookStatus(id: string, updater: (current: LookbookExportRecord | null) => LookbookExportRecord): Promise<LookbookExportRecord> {
  const current = await getLookbookStatus(id)
  const updated = updater(current)
  await saveLookbookStatus(updated)
  return updated
}

export function buildInitialRecord(params: { id: string; templateId: string; format: 'pdf' | 'png' }): LookbookExportRecord {
  const now = new Date().toISOString()
  return {
    id: params.id,
    templateId: params.templateId,
    format: params.format,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
}

export function patchRecord(record: LookbookExportRecord, patch: Partial<LookbookExportRecord> & { status?: LookbookExportStatus }): LookbookExportRecord {
  return {
    ...record,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
}