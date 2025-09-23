import { NextResponse } from 'next/server'
import { recordFrontendWebVital } from '@/lib/observability/metrics'

interface WebVitalRequestBody {
  name: string
  value: number
  delta?: number
  id?: string
  rating?: string
  page?: string
  navigationType?: string
  timestamp?: number
  connection?: {
    effectiveType?: string
    downlink?: number
    saveData?: boolean
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebVitalRequestBody

    if (!body || typeof body.name !== 'string' || typeof body.value !== 'number') {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }

    recordFrontendWebVital({
      name: body.name,
      value: body.value,
      delta: typeof body.delta === 'number' ? body.delta : 0,
      rating: typeof body.rating === 'string' ? body.rating : 'unknown',
      id: body.id || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${body.name}-${Date.now()}`),
      path: body.page || request.headers.get('referer') || 'unknown',
      navigationType: body.navigationType,
      connection: body.connection,
      timestamp: typeof body.timestamp === 'number' ? body.timestamp : Date.now(),
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[observability] failed to ingest web vitals', error)
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
}
