import { db } from './db'

export type AppSettingsShape = {
  imageFormats?: string | null
  imageVariantNames?: string | null
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
          imageFormats: row.imageFormats,
          imageVariantNames: row.imageVariantNames,
        }
      : null
    cached = { data, at: now }
    return data
  } catch (e) {
    return null
  }
}

// AI keys removed (feature disabled)

// Auto-tag configuration removed (feature disabled)

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
