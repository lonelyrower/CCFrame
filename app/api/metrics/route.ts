import { NextRequest, NextResponse } from 'next/server'

import { metricsRegistry } from '@/lib/prometheus'

export const dynamic = 'force-dynamic'

const metricsToken = process.env.METRICS_TOKEN || ''
const metricsAllowedIps = (process.env.METRICS_ALLOWED_IPS || '')
  .split(',')
  .map(ip => ip.trim())
  .filter(Boolean)

function extractClientIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || null
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 })
  }

  const clientIp = extractClientIp(request)
  if (metricsAllowedIps.length > 0 && (!clientIp || !metricsAllowedIps.includes(clientIp))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (metricsToken) {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim()
    if (token !== metricsToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await metricsRegistry.metrics()
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': metricsRegistry.contentType,
      'Cache-Control': 'no-store',
    },
  })
}
