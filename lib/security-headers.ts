import { NextResponse } from 'next/server'

/**
 * 安全响应头配置
 */
export const SECURITY_HEADERS = {
  // 内容安全策略
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js 需要 unsafe-inline 和 unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind CSS 需要 unsafe-inline
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "child-src 'none'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests"
  ].join('; '),

  // 防止点击劫持
  'X-Frame-Options': 'DENY',

  // 防止 MIME 类型嗅探
  'X-Content-Type-Options': 'nosniff',

  // XSS 保护
  'X-XSS-Protection': '1; mode=block',

  // 强制 HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // 引用策略
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // 权限策略
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '),

  // 跨域策略
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

/**
 * 为响应添加安全头
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * 创建带安全头的响应
 */
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = new NextResponse(body, init)
  return addSecurityHeaders(response)
}

/**
 * JSON 响应包装器，自动添加安全头
 */
export function secureJsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(data, {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8'
    }
  })

  return addSecurityHeaders(response)
}