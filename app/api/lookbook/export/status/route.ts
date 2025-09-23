import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getLookbookStatus } from '@/lib/lookbook/export-status'

const querySchema = z.object({
  id: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(url.searchParams.entries()))
    const status = await getLookbookStatus(params.id)
    if (!status) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 })
    }
    return NextResponse.json(status)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', issues: error.flatten() }, { status: 400 })
    }
    console.error('[lookbook-export-status] failed', error)
    return NextResponse.json({ error: 'Failed to load export status' }, { status: 500 })
  }
}
