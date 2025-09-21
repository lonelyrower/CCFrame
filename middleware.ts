import { NextRequest, NextResponse } from 'next/server'
import { addSecurityHeaders } from './lib/security-headers'

// 需要认证的路径
const PROTECTED_PATHS = [
  '/admin',
  '/api/admin',
  '/api/upload',
  '/api/photos',
  '/api/albums',
  '/api/tags'
]

// 需要 HTTPS 的路径（生产环境）
const HTTPS_REQUIRED_PATHS = [
  '/admin/login',
  '/api/admin',
  '/api/upload'
]

// 静态资源路径
const STATIC_PATHS = [
  '/_next/',
  '/icons/',
  '/images/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // 跳过静态资源
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 生产环境 HTTPS 重定向
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.FORCE_HTTPS !== 'false' &&
    request.headers.get('x-forwarded-proto') !== 'https' &&
    HTTPS_REQUIRED_PATHS.some(path => pathname.startsWith(path))
  ) {
    url.protocol = 'https:'
    return NextResponse.redirect(url)
  }

  // 创建响应
  const response = NextResponse.next()

  // 添加安全头
  addSecurityHeaders(response)

  // 添加自定义安全头
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')

  // 对于管理页面，添加额外的安全措施
  if (pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // 对于 API 路由，添加 API 特定的头
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')

    // 对于非健康检查的 API，添加速率限制头
    if (!pathname.includes('/health')) {
      response.headers.set('X-RateLimit-Policy', 'per-user')
    }
  }

  // 对于图片 API，添加缓存控制
  if (pathname.startsWith('/api/image/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    response.headers.set('Vary', 'Accept-Encoding')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * 1. /_next/static (静态文件)
     * 2. /_next/image (图片优化文件)
     * 3. /favicon.ico (网站图标)
     * 4. 以 . 开头的文件 (如 .well-known)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}