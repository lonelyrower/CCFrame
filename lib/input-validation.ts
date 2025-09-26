import { isIP } from 'node:net'
import { z } from 'zod'

/**
 * 通用输入验证模式
 */

// 文件名验证
export const fileNameSchema = z
  .string()
  .min(1, '文件名不能为空')
  .max(255, '文件名不能超过255个字符')
  .refine(
    (name) => !/[<>:"/\\|?*\x00-\x1f]/.test(name),
    '文件名包含非法字符'
  )
  .refine(
    (name) => !['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'].includes(name.toUpperCase()),
    '文件名不能使用系统保留名称'
  )

// 标签名验证
export const tagNameSchema = z
  .string()
  .min(1, '标签名不能为空')
  .max(50, '标签名不能超过50个字符')
  .refine(
    (name) => /^[一-龥A-Za-z0-9_\-\s]+$/.test(name),
    '标签名只能包含字母、数字、下划线、连字符和空格'
  )

// 相册名验证
export const albumNameSchema = z
  .string()
  .min(1, '相册名不能为空')
  .max(100, '相册名不能超过100个字符')
  .refine(
    (name) => !/[<>:"/\\|?*\x00-\x1f]/.test(name),
    '相册名包含非法字符'
  )

// 描述验证
export const descriptionSchema = z
  .string()
  .max(1000, '描述不能超过1000个字符')
  .optional()

// 邮箱验证
export const emailSchema = z
  .string()
  .email('邮箱格式不正确')
  .max(254, '邮箱地址过长')

// 密码验证
export const passwordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .max(128, '密码不能超过128个字符')
  .refine(
    (password) => /[A-Z]/.test(password),
    '密码必须包含至少一个大写字母'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    '密码必须包含至少一个小写字母'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    '密码必须包含至少一个数字'
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    '密码必须包含至少一个特殊字符'
  )

// 2FA 验证码验证
export const twoFactorCodeSchema = z
  .string()
  .length(6, '验证码必须是6位数字')
  .refine(
    (code) => /^\d{6}$/.test(code),
    '验证码只能包含数字'
  )

// 搜索查询验证
export const searchQuerySchema = z
  .string()
  .min(1, '搜索词不能为空')
  .max(200, '搜索词不能超过200个字符')
  .refine(
    (query) => !/[<>"]/.test(query),
    '搜索词包含非法字符'
  )

// URL 验证
export const urlSchema = z
  .string()
  .url('URL格式不正确')
  .max(2048, 'URL过长')
  .refine(
    (url) => ['http:', 'https:'].includes(new URL(url).protocol),
    'URL必须使用HTTP或HTTPS协议'
  )

// 颜色代码验证
export const colorCodeSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, '颜色代码格式不正确')

// 分页参数验证
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, '页码必须大于0').default(1),
  limit: z.coerce.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').default(20),
  cursor: z.string().optional()
})

// 文件上传验证
export const fileUploadSchema = z.object({
  filename: fileNameSchema,
  contentType: z
    .string()
    .refine(
      (type) => type.startsWith('image/'),
      '只支持图片文件'
    )
    .refine(
      (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(type.toLowerCase()),
      '不支持的图片格式'
    ),
  size: z
    .number()
    .int()
    .min(1, '文件不能为空')
    .max(50 * 1024 * 1024, '文件大小不能超过50MB'),
  albumId: z.string().cuid().optional(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/, 'contentHash格式不正确').optional()
})

/**
 * HTML 清理函数
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * SQL 注入防护（额外保护，Prisma 已经有内置保护）
 */
export function sanitizeSqlInput(input: string): string {
  return input.replace(/(--|;|')/g, '')
}

/**
 * 文件路径清理
 */
export function sanitizePath(path: string): string {
  return path
    .replace(/\.\./g, '') // 移除目录遍历
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // 移除非法字符
    .replace(/^\/+/, '') // 移除开头的斜杠
    .replace(/\/+/g, '/') // 合并多个斜杠
}

/**
 * 用户输入清理
 */
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/\0/g, '') // 移除 null 字符
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // 移除控制字符
    .slice(0, 10000) // 限制长度
}

/**
 * 验证并清理标签数组
 */
export function validateAndSanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map(tag => sanitizeUserInput(tag))
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 20) // 最多20个标签
}

/**
 * IP 地址验证
 */
export const ipAddressSchema = z
  .string()
  .refine(
    (ip) => isIP(ip) !== 0,
    'IP��ַ��ʽ����ȷ'
  )

export function sanitizeUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'

  return sanitizeUserInput(userAgent)
    .slice(0, 500) // 限制用户代理字符串长度
}

/**
 * EXIF 数据验证和清理
 */
export function sanitizeExifData(exifData: any): any {
  if (!exifData || typeof exifData !== 'object') {
    return {}
  }

  const sanitized: any = {}
  const allowedKeys = [
    'Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ISO',
    'ExposureTime', 'DateTimeOriginal', 'Orientation', 'WhiteBalance',
    'Flash', 'ColorSpace', 'ExifImageWidth', 'ExifImageHeight'
  ]

  for (const key of allowedKeys) {
    if (key in exifData) {
      const value = exifData[key]
      if (typeof value === 'string') {
        sanitized[key] = sanitizeUserInput(value).slice(0, 200)
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[key] = value
      } else if (value instanceof Date) {
        sanitized[key] = value.toISOString()
      }
    }
  }

  return sanitized
}
