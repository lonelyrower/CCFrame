import { NextResponse, type NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'logs', 'story-events.log')

async function appendLog(payload: unknown) {
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true })
    await fs.appendFile(LOG_FILE, `${JSON.stringify(payload)}\n`, 'utf8')
  } catch (error) {
    console.warn('[api/lightbox/events] failed to write log', error)
  }
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let payload: any = null

    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else {
      const text = await request.text()
      payload = text ? JSON.parse(text) : {}
    }

    const enriched = {
      ...payload,
      receivedAt: new Date().toISOString(),
    }

    await appendLog(enriched)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[api/lightbox/events] failed', error)
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }
}
