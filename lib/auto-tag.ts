import sharp from 'sharp'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { getAIKey } from '@/lib/settings'

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
      case g: h = ((b - r) / d + 2); break
      case b: h = ((r - g) / d + 4); break
    }
    h /= 6
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h: h * 360, s, v }
}

function mapColorTags(avg: { r: number; g: number; b: number }, sigma: { r: number; g: number; b: number }) {
  const { h, s, v } = rgbToHsv(avg.r, avg.g, avg.b)
  const tags: string[] = []
  // Color family
  if (s < 0.15) {
    tags.push('黑白/低饱和')
  } else {
    if (h < 15 || h >= 345) tags.push('红色系')
    else if (h < 45) tags.push('橙黄色')
    else if (h < 75) tags.push('黄色系')
    else if (h < 150) tags.push('绿色系')
    else if (h < 210) tags.push('青色系')
    else if (h < 255) tags.push('蓝色系')
    else if (h < 300) tags.push('紫色系')
    else tags.push('粉色系')
  }
  // Warm/Cool
  if (s >= 0.2) {
    if (h < 75 || h >= 300) tags.push('暖色')
    else if (h >= 150 && h <= 255) tags.push('冷色')
  }
  // Brightness
  if (v >= 0.8) tags.push('明亮')
  else if (v <= 0.25) tags.push('暗调')

  // Vibrance: based on channel stddev
  const variance = (sigma.r + sigma.g + sigma.b) / 3
  if (variance >= 40) tags.push('高对比')
  return tags
}

export async function extractColorTags(buffer: Buffer): Promise<string[]> {
  const stats = await sharp(buffer).stats()
  const avg = {
    r: stats.channels[0]?.mean || 0,
    g: stats.channels[1]?.mean || 0,
    b: stats.channels[2]?.mean || 0,
  }
  const sigma = {
    r: stats.channels[0]?.stdev || 0,
    g: stats.channels[1]?.stdev || 0,
    b: stats.channels[2]?.stdev || 0,
  }
  return mapColorTags(avg, sigma)
}

export async function extractContentTags(buffer: Buffer, provider: 'auto' | 'gemini' | 'openai' = 'auto'): Promise<string[]> {
  // Prefer Gemini; fallback to OpenAI; if neither available, return []
  const googleKey = await getAIKey('google')
  const openaiKey = await getAIKey('openai')

  try {
    if ((provider === 'auto' || provider === 'gemini') && googleKey) {
      const mod: any = await import('@google/generative-ai')
      const Client = mod.GoogleGenerativeAI
      const client = new Client(googleKey)
      const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const prompt = '请识别图片中的主要内容与场景，输出不超过10个简短中文标签，使用逗号分隔，避免形容词，多用名词，如：人物, 风景, 海滩, 城市, 夜景, 动物, 花卉, 美食。仅输出标签列表。'
      const imagePart = { inlineData: { data: buffer.toString('base64'), mimeType: 'image/jpeg' } }
      const res = await model.generateContent([prompt, imagePart] as any)
      const text = res.response.text() || ''
      const tags = text.split(/[，,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 10)
      return tags
    }
    if ((provider === 'auto' || provider === 'openai') && openaiKey) {
      const mod: any = await import('openai')
      const OpenAI = mod.default || mod
      const client = new OpenAI({ apiKey: openaiKey })
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '你是图像内容标注助手，输出中文标签，逗号分隔，不超过10个。' },
          {
            role: 'user',
            content: [
              { type: 'text', text: '识别图片中的主要内容与场景，仅输出标签列表：' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${buffer.toString('base64')}` } }
            ] as any
          }
        ],
      })
      const text = res.choices?.[0]?.message?.content || ''
      const tags = text.split(/[，,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 10)
      return tags
    }
  } catch (e) {
    console.warn('Content tag extraction failed, fallback to empty:', e)
  }

  return []
}

export function colorForTag(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('红')) return '#ef4444'
  if (n.includes('橙') || n.includes('黄')) return '#f59e0b'
  if (n.includes('绿')) return '#22c55e'
  if (n.includes('青')) return '#06b6d4'
  if (n.includes('蓝')) return '#3b82f6'
  if (n.includes('紫')) return '#8b5cf6'
  if (n.includes('粉')) return '#ec4899'
  if (n.includes('黑') || n.includes('白') || n.includes('灰')) return '#6b7280'
  return '#6b7280'
}

export async function autoTagPhoto(photoId: string, options: { includeColors?: boolean; includeContent?: boolean } = {}) {
  const { includeColors = true, includeContent = true } = options
  const photo = await db.photo.findUnique({ where: { id: photoId }, include: { variants: true } })
  if (!photo) throw new Error('Photo not found')
  const storage = getStorageManager()
  const candidate = photo.variants.find(v => v.variant === 'small') || photo.variants[0]
  const key = candidate?.fileKey || photo.fileKey
  const url = await storage.getPresignedDownloadUrl(key)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('Failed to fetch image')
  const buf = Buffer.from(await resp.arrayBuffer())

  const tagSet = new Set<string>()
  if (includeColors) (await extractColorTags(buf)).forEach(t => tagSet.add(t))
  if (includeContent) {
    // Provider preference comes from settings
    const { getAutoTagConfig, claimAutoTagQuota } = await import('./settings')
    const conf = await getAutoTagConfig()
    const allowed = await claimAutoTagQuota(1)
    if (allowed) {
      (await extractContentTags(buf, conf.provider)).forEach(t => tagSet.add(t))
    }
  }

  const names = Array.from(tagSet).slice(0, 12)
  for (const name of names) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name, color: colorForTag(name) },
    })
    // connect if not exists
    await db.photoTag.upsert({
      where: { photoId_tagId: { photoId: photo.id, tagId: tag.id } },
      update: {},
      create: { photoId: photo.id, tagId: tag.id },
    })
  }
  return { added: names.length }
}
