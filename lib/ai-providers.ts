// 说明：为避免在未安装可选依赖时构建失败，移除对
// '@google/generative-ai' 与 'openai' 的静态导入，改为在
// 方法内部进行惰性动态导入；若导入失败或未配置 API Key，
// 则回退到本地基于 sharp 的占位实现。

import { getAIKey, hasAIKey } from './settings'

export interface AIProvider {
  name: string
  enhance: (imageBuffer: Buffer, options: EnhanceOptions) => Promise<Buffer>
  upscale: (imageBuffer: Buffer, scale: number) => Promise<Buffer>
  removeBackground: (imageBuffer: Buffer) => Promise<Buffer>
  styleTransfer: (imageBuffer: Buffer, style: string) => Promise<Buffer>
  cleanup?: (imageBuffer: Buffer, maskBuffer: Buffer) => Promise<Buffer>
}

export interface EnhanceOptions {
  brightness?: number
  contrast?: number
  saturation?: number
  sharpness?: number
  denoise?: boolean
  autoFix?: boolean
}

// Gemini Vision API Provider
export class GeminiAIProvider implements AIProvider {
  name = 'Gemini'

  private async getClient(): Promise<any | null> {
    try {
      const apiKey = await getAIKey('google')
      if (!apiKey) return null
      const mod: any = await import('@google/generative-ai')
      const Client = mod.GoogleGenerativeAI
      return new Client(apiKey)
    } catch {
      return null
    }
  }

  async enhance(imageBuffer: Buffer, options: EnhanceOptions): Promise<Buffer> {
    // 若可选依赖或 Key 不可用，直接采用本地增强回退
    const client = await this.getClient()
    if (!client) {
      return await this.applyEnhancements(imageBuffer, options, 'local-fallback')
    }

    try {
      const model = client.getGenerativeModel({ model: 'gemini-pro-vision' })
      const prompt = this.buildEnhancePrompt(options)
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      }
      const result = await model.generateContent([prompt, imagePart])
      const response = result.response
      const analysis = response.text()
      return await this.applyEnhancements(imageBuffer, options, analysis)
    } catch (error) {
      console.warn('Gemini enhance failed, fallback to local:', error)
      return await this.applyEnhancements(imageBuffer, options, 'local-fallback')
    }
  }

  async upscale(imageBuffer: Buffer, scale: number): Promise<Buffer> {
    // 本地放大占位实现
    const sharp = await import('sharp')
    return sharp.default(imageBuffer)
      .resize(undefined, undefined, {
        kernel: 'lanczos3',
        fit: 'fill'
      })
      .jpeg({ quality: 95 })
      .toBuffer()
  }

  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    // 可以结合Remove.bg API或本地模型
    throw new Error('Background removal not implemented for Gemini')
  }

  async styleTransfer(imageBuffer: Buffer, style: string): Promise<Buffer> {
    const client = await this.getClient()
    if (!client) {
      return await this.applyStyleTransfer(imageBuffer, 'local-fallback')
    }

    const model = client.getGenerativeModel({ model: 'gemini-pro-vision' })
    const prompt = `请分析这张图片的${style}风格转换建议，包括色调、对比度、饱和度等具体参数建议。`
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    }
    const result = await model.generateContent([prompt, imagePart])
    const suggestions = result.response.text()
    return await this.applyStyleTransfer(imageBuffer, suggestions)
  }

  private buildEnhancePrompt(options: EnhanceOptions): string {
    let prompt = '请分析这张图片的质量并给出具体的增强建议，包括：'
    
    if (options.brightness !== undefined) prompt += `\n- 亮度调整建议（当前设置：${options.brightness}）`
    if (options.contrast !== undefined) prompt += `\n- 对比度优化建议（当前设置：${options.contrast}）`
    if (options.saturation !== undefined) prompt += `\n- 饱和度调整建议（当前设置：${options.saturation}）`
    if (options.sharpness !== undefined) prompt += `\n- 锐化处理建议（当前设置：${options.sharpness}）`
    if (options.denoise) prompt += `\n- 降噪处理建议`
    if (options.autoFix) prompt += `\n- 自动修复建议`
    
    return prompt + '\n请给出具体的数值参数建议。'
  }

  private async applyEnhancements(imageBuffer: Buffer, options: EnhanceOptions, analysis: string): Promise<Buffer> {
    const sharp = await import('sharp')
    let pipeline = sharp.default(imageBuffer)

    // 根据选项应用增强
    if (options.brightness !== undefined) {
      pipeline = pipeline.modulate({ brightness: 1 + options.brightness / 100 })
    }
    
    if (options.contrast !== undefined) {
      pipeline = pipeline.linear(1 + options.contrast / 100, 0)
    }
    
    if (options.saturation !== undefined) {
      pipeline = pipeline.modulate({ saturation: 1 + options.saturation / 100 })
    }
    
    if (options.sharpness !== undefined) {
      pipeline = pipeline.sharpen(options.sharpness)
    }

    return pipeline.jpeg({ quality: 95 }).toBuffer()
  }

  private async applyStyleTransfer(imageBuffer: Buffer, suggestions: string): Promise<Buffer> {
    const sharp = await import('sharp')
    // 这里可以根据Gemini的建议应用具体的风格转换
    // 实际实现中可能需要更复杂的图像处理算法
    
    return sharp.default(imageBuffer)
      .modulate({ saturation: 1.2 }) // 示例：增加饱和度
      .gamma(1.1) // 示例：调整伽马值
      .jpeg({ quality: 95 })
      .toBuffer()
  }
}

// OpenAI DALL-E Provider (可选)
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI'

  private async getClient(): Promise<any | null> {
    try {
      const apiKey = await getAIKey('openai')
      if (!apiKey) return null
      const mod: any = await import('openai')
      const OpenAI = mod.default || mod
      return new OpenAI({ apiKey })
    } catch {
      return null
    }
  }

  async enhance(imageBuffer: Buffer, options: EnhanceOptions): Promise<Buffer> {
    const client = await this.getClient()
    if (!client) throw new Error('OpenAI not configured or dependency missing')
    // 占位：未实现真实 OpenAI 图像编辑
    throw new Error('OpenAI image enhancement not implemented')
  }

  async upscale(imageBuffer: Buffer, scale: number): Promise<Buffer> {
    const client = await this.getClient()
    if (!client) throw new Error('OpenAI not configured or dependency missing')
    throw new Error('OpenAI image upscaling not implemented')
  }

  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    const client = await this.getClient()
    if (!client) throw new Error('OpenAI not configured or dependency missing')
    throw new Error('OpenAI background removal not implemented')
  }

  async styleTransfer(imageBuffer: Buffer, style: string): Promise<Buffer> {
    const client = await this.getClient()
    if (!client) throw new Error('OpenAI not configured or dependency missing')
    throw new Error('OpenAI style transfer not implemented')
  }
}

// Local provider using sharp only (fallback)
class LocalProvider implements AIProvider {
  name = 'Local'
  async enhance(imageBuffer: Buffer, options: EnhanceOptions): Promise<Buffer> {
    const sharp = (await import('sharp')).default
    let pipeline = sharp(imageBuffer)
    if (typeof options.brightness === 'number') pipeline = pipeline.modulate({ brightness: 1 + options.brightness / 100 })
    if (typeof options.saturation === 'number') pipeline = pipeline.modulate({ saturation: 1 + options.saturation / 100 })
    if (typeof options.contrast === 'number') pipeline = pipeline.linear(1 + options.contrast / 100, 0)
    if (typeof options.sharpness === 'number') pipeline = pipeline.sharpen(options.sharpness)
    return pipeline.jpeg({ quality: 95 }).toBuffer()
  }
  async upscale(imageBuffer: Buffer, scale: number): Promise<Buffer> {
    const sharp = (await import('sharp')).default
    const meta = await sharp(imageBuffer).metadata()
    const width = meta.width ? Math.round(meta.width * Math.max(2, Math.min(4, Number(scale) || 2))) : undefined
    return sharp(imageBuffer).resize(width, null, { withoutEnlargement: false }).jpeg({ quality: 95 }).toBuffer()
  }
  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    // Fallback: not a true background removal, just convert to PNG
    const sharp = (await import('sharp')).default
    return sharp(imageBuffer).png().toBuffer()
  }
  async styleTransfer(imageBuffer: Buffer, style: string): Promise<Buffer> {
    const sharp = (await import('sharp')).default
    return sharp(imageBuffer).modulate({ saturation: 1.1 }).gamma(1.05).jpeg({ quality: 95 }).toBuffer()
  }

  async cleanup(imageBuffer: Buffer, maskBuffer: Buffer): Promise<Buffer> {
    // 简易占位：未实现真实去物体；请配置 Clipdrop API Key
    throw new Error('去物体需要配置 Clipdrop（在后台 AI 设置中设置 CLIPDROP_API_KEY）')
  }
}

// Clipdrop provider: background removal + upscaling
class ClipdropProvider implements AIProvider {
  name = 'Clipdrop'
  private async getKey(): Promise<string> {
    const key = await getAIKey('clipdrop')
    if (!key) throw new Error('CLIPDROP_API_KEY not configured (or not set in AI 设置)')
    return key
  }

  private async postBinary(endpoint: string, imageBuffer: Buffer): Promise<Buffer> {
    const apiKey = await this.getKey()
    const form = new FormData()
    // Use Blob to avoid additional deps
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
    form.append('image_file', blob, 'image.jpg')
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form as any,
    })
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`
      try { msg = (await res.text()) || msg } catch {}
      throw new Error(`Clipdrop API error: ${msg}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  async enhance(imageBuffer: Buffer, options: EnhanceOptions): Promise<Buffer> {
    // No direct clipdrop endpoint for generic enhance; fallback to Local
    return new LocalProvider().enhance(imageBuffer, options)
  }
  async upscale(imageBuffer: Buffer, scale: number): Promise<Buffer> {
    // Clipdrop upscaler ignores scale param (single model). We'll accept it.
    return this.postBinary('https://clipdrop-api.co/image-upscaling/v1', imageBuffer)
  }
  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    return this.postBinary('https://clipdrop-api.co/remove-background/v1', imageBuffer)
  }
  async styleTransfer(imageBuffer: Buffer, style: string): Promise<Buffer> {
    // Not implemented; fallback
    return new LocalProvider().styleTransfer(imageBuffer, style)
  }

  async cleanup(imageBuffer: Buffer, maskBuffer: Buffer): Promise<Buffer> {
    const apiKey = await this.getKey()
    const form = new FormData()
    form.append('image_file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg')
    form.append('mask_file', new Blob([maskBuffer], { type: 'image/png' }), 'mask.png')
    const res = await fetch('https://clipdrop-api.co/cleanup/v1', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form as any,
    })
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`
      try { msg = (await res.text()) || msg } catch {}
      throw new Error(`Clipdrop Cleanup error: ${msg}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }
}

// Remove.bg provider: background removal only
class RemoveBgProvider implements AIProvider {
  name = 'Remove.bg'
  private async getKey(): Promise<string> {
    const key = await getAIKey('removebg')
    if (!key) throw new Error('REMOVE_BG_API_KEY not configured (or not set in AI 设置)')
    return key
  }

  async enhance(imageBuffer: Buffer, options: EnhanceOptions): Promise<Buffer> {
    return new LocalProvider().enhance(imageBuffer, options)
  }
  async upscale(imageBuffer: Buffer, scale: number): Promise<Buffer> {
    return new LocalProvider().upscale(imageBuffer, scale)
  }
  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    const apiKey = await this.getKey()
    const form = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
    form.append('image_file', blob, 'image.jpg')
    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form as any,
    })
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`
      try { msg = (await res.text()) || msg } catch {}
      throw new Error(`remove.bg API error: ${msg}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }
  async styleTransfer(imageBuffer: Buffer, style: string): Promise<Buffer> {
    return new LocalProvider().styleTransfer(imageBuffer, style)
  }
}

// AI Provider Factory
export type AIProviderName = 'auto' | 'local' | 'gemini' | 'openai' | 'clipdrop' | 'removebg'

export class AIProviderFactory {
  static create(provider: AIProviderName = 'local', taskType?: string): AIProvider {
    switch (provider) {
      case 'local':
        return new LocalProvider()
      case 'gemini':
        return new GeminiAIProvider()
      case 'openai':
        return new OpenAIProvider()
      case 'clipdrop':
        return new ClipdropProvider()
      case 'removebg':
        return new RemoveBgProvider()
      default:
        return new LocalProvider()
    }
  }
}

// AI任务处理器
export class AIImageProcessor {
  static async processImage(
    imageBuffer: Buffer, 
    taskType: string, 
    params: Record<string, any>,
    provider: AIProviderName = 'auto'
  ): Promise<Buffer> {
    let chosen: AIProviderName = provider
    if (provider === 'auto') {
      chosen = await this.resolveAutoProvider(taskType)
    }
    const aiProvider = AIProviderFactory.create(chosen, taskType)
    
    switch (taskType) {
      case 'enhance':
        return aiProvider.enhance(imageBuffer, params as EnhanceOptions)
      case 'upscale':
        return aiProvider.upscale(imageBuffer, params.scale || 2)
      case 'remove-background':
        return aiProvider.removeBackground(imageBuffer)
      case 'cleanup': {
        if (typeof (aiProvider as any).cleanup !== 'function') {
          throw new Error('选定的提供商不支持去物体')
        }
        const maskBuf = params?.maskBuffer
        if (!maskBuf || !(maskBuf instanceof Buffer)) {
          throw new Error('缺少或无效的掩膜数据')
        }
        return (aiProvider as any).cleanup(imageBuffer, maskBuf)
      }
      case 'style-transfer':
        return aiProvider.styleTransfer(imageBuffer, params.style || 'artistic')
      default:
        throw new Error(`Unsupported task type: ${taskType}`)
    }
  }

  static async resolveAutoProvider(taskType: string): Promise<AIProviderName> {
    if (taskType === 'cleanup') {
      if (await hasAIKey('clipdrop')) return 'clipdrop'
      return 'local'
    }
    if (taskType === 'remove-background') {
      if (await hasAIKey('clipdrop')) return 'clipdrop'
      if (await hasAIKey('removebg')) return 'removebg'
      return 'local'
    }
    if (taskType === 'upscale') {
      if (await hasAIKey('clipdrop')) return 'clipdrop'
      return 'local'
    }
    if (await hasAIKey('google')) return 'gemini'
    return 'local'
  }
}
