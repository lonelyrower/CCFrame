import { getAIKey } from './settings'

export type TTIProvider = 'auto' | 'openai'

export async function generateImageBuffer(prompt: string, provider: TTIProvider = 'auto', size: '512' | '1024' = '1024'): Promise<Buffer> {
  let chosen: TTIProvider = provider
  if (provider === 'auto') {
    chosen = 'openai'
  }

  switch (chosen) {
    case 'openai':
      return openaiGenerate(prompt, size)
    default:
      throw new Error('No text-to-image provider configured')
  }
}

async function openaiGenerate(prompt: string, size: '512' | '1024'): Promise<Buffer> {
  const key = await getAIKey('openai')
  if (!key) throw new Error('OPENAI_API_KEY 未配置（可在 AI 设置 或 环境变量中设置）')
  const mod: any = await import('openai')
  const OpenAI = mod.default || mod
  const client = new OpenAI({ apiKey: key })
  const result = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: size === '1024' ? '1024x1024' : '512x512',
    response_format: 'b64_json'
  })
  const b64 = result?.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI 图像生成失败')
  return Buffer.from(b64, 'base64')
}

