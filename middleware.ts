import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page and public routes
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/metrics/track')
  ) {
    return NextResponse.next();
  }

  // Public API 路由（仅 GET），并针对 /api/photos 进行更严格控制
  const publicApiRoutes = ['/api/tags', '/api/series', '/api/albums', '/api/site-copy'];
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  // 允许上述公共 API 的 GET 请求直接放行
  if (isPublicApiRoute && request.method === 'GET') {
    return NextResponse.next();
  }

  // /api/photos 列表仅在显式 isPublic=true 时允许匿名 GET
  if (request.method === 'GET' && pathname === '/api/photos') {
    const isPublic = request.nextUrl.searchParams.get('isPublic');
    if (isPublic === 'true') {
      return NextResponse.next();
    }
    // 未显式请求公开内容则需要鉴权
  }

  // Protect admin routes and non-GET API routes
  if (pathname.startsWith('/admin') || (pathname.startsWith('/api') && !pathname.startsWith('/api/auth'))) {
    const token = request.cookies.get('session')?.value;

    if (!token) {
      // Redirect to login for page requests
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      // Return 401 for API requests
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const session = await verifySession(token);

    if (!session) {
      // Redirect to login for page requests
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      // Return 401 for API requests
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add session to headers for API routes
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
