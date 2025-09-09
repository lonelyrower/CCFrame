import { db } from './db'

export type AppSettingsShape = {
  openaiApiKey?: string | null
  googleApiKey?: string | null
  clipdropApiKey?: string | null
  removeBgApiKey?: string | null
  imageFormats?: string | null
  imageVariantNames?: string | null
  autoTagEnabled?: boolean
  autoTagIncludeColors?: boolean
  autoTagIncludeContent?: boolean
  autoTagProvider?: 'auto' | 'gemini' | 'openai' | null
  autoTagDailyLimit?: number | null
  autoTagUsageDate?: string | null
  autoTagUsageCount?: number
}

let cached: { data: AppSettingsShape | null; at: number } = { data: null, at: 0 }
const TTL_MS = 60_000

export async function getAppSettingsCached(): Promise<AppSettingsShape | null> {
  const now = Date.now()
  if (cached.data && now - cached.at < TTL_MS) return cached.data
  try {
    const row = await db.appSettings.findUnique({ where: { id: 'singleton' } })
    const data: AppSettingsShape | null = row
      ? {
          openaiApiKey: row.openaiApiKey,
          googleApiKey: row.googleApiKey,
          clipdropApiKey: row.clipdropApiKey,
          removeBgApiKey: row.removeBgApiKey,
          imageFormats: row.imageFormats,
          imageVariantNames: row.imageVariantNames,
          autoTagEnabled: row.autoTagEnabled,
          autoTagIncludeColors: row.autoTagIncludeColors,
          autoTagIncludeContent: row.autoTagIncludeContent,
          autoTagProvider: (row.autoTagProvider as any) || null,
          autoTagDailyLimit: row.autoTagDailyLimit || null,
          autoTagUsageDate: row.autoTagUsageDate || null,
          autoTagUsageCount: row.autoTagUsageCount || 0,
        }
      : null
    cached = { data, at: now }
    return data
  } catch (e) {
    return null
  }
}

export async function getAIKey(name: 'openai' | 'google' | 'clipdrop' | 'removebg'): Promise<string | undefined> {
  // Prefer DB setting, then env var
  const settings = await getAppSettingsCached().catch(() => null)
  switch (name) {
    case 'openai':
      return settings?.openaiApiKey || process.env.OPENAI_API_KEY
    case 'google':
      return settings?.googleApiKey || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY
    case 'clipdrop':
      return settings?.clipdropApiKey || process.env.CLIPDROP_API_KEY
    case 'removebg':
      return settings?.removeBgApiKey || process.env.REMOVE_BG_API_KEY
  }
}

export async function hasAIKey(name: 'openai' | 'google' | 'clipdrop' | 'removebg'): Promise<boolean> {
  return Boolean(await getAIKey(name))
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// Attempts to claim N content-tagging units from the daily budget.
// Returns true if allowed (and consumes the quota), false otherwise.
export async function claimAutoTagQuota(n: number): Promise<boolean> {
  try {
    const settings = await db.appSettings.findUnique({ where: { id: 'singleton' } })
    const limit = settings?.autoTagDailyLimit ?? null
    if (!limit || limit <= 0) return true // unlimited
    const today = todayStr()
    const usageDate = settings?.autoTagUsageDate || ''
    const usageCount = usageDate === today ? (settings?.autoTagUsageCount || 0) : 0
    if (usageCount + n > limit) return false
    await db.appSettings.update({
      where: { id: 'singleton' },
      data: {
        autoTagUsageDate: today,
        autoTagUsageCount: usageCount + n,
      }
    })
    // invalidate cache
    cached = { data: null, at: 0 }
    return true
  } catch (e) {
    return true // fail-open to avoid blocking
  }
}

export async function getAutoTagConfig(): Promise<{
  enabled: boolean
  includeColors: boolean
  includeContent: boolean
  provider: 'auto' | 'gemini' | 'openai'
  dailyLimit: number | null
}> {
  const s = (await getAppSettingsCached()) || {}
  return {
    enabled: !!s.autoTagEnabled,
    includeColors: s.autoTagIncludeColors !== false,
    includeContent: s.autoTagIncludeContent !== false,
    provider: (s.autoTagProvider as any) || 'auto',
    dailyLimit: s.autoTagDailyLimit ?? null,
  }
}

export async function getStorageSettings(): Promise<{
  imageFormats: string[] | null
  imageVariantNames: string[] | null
}> {
  const s = (await getAppSettingsCached()) || {}
  const formats = (s.imageFormats || process.env.IMAGE_FORMATS || '').trim()
  const names = (s.imageVariantNames || process.env.IMAGE_VARIANT_NAMES || '').trim()
  return {
    imageFormats: formats ? formats.split(',').map(x => x.trim().toLowerCase()).filter(Boolean) : null,
    imageVariantNames: names ? names.split(',').map(x => x.trim().toLowerCase()).filter(Boolean) : null,
  }
}
