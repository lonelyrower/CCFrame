import { NextResponse } from 'next/server'
import { metricsRegistry } from '@/lib/prometheus'

export const dynamic = 'force-dynamic'

export async function GET() {
  const body = await metricsRegistry.metrics()
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': metricsRegistry.contentType,
      'Cache-Control': 'no-store',
    },
  })
}
