import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getTimelineQuery } from '@/lib/timeline/timeline-service'

const TimelineQuerySchema = z
  .object({
    startYear: z.number().int().min(1900).max(3000).optional(),
    endYear: z.number().int().min(1900).max(3000).optional(),
    personas: z.array(z.string().min(1)).optional(),
    tags: z.array(z.string().min(1)).optional(),
  })
  .partial()

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}))
    const filtersInput = TimelineQuerySchema.parse(payload?.filters ?? payload ?? {})
    const data = await getTimelineQuery(filtersInput)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid filters', issues: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to load timeline data' }, { status: 500 })
  }
}
