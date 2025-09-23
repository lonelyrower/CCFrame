import { NextResponse } from 'next/server'
import { z } from 'zod'

import type { TagNodeRole } from '@/types/tag-graph'
import { getTagUniverse } from '@/lib/tags/tag-graph-service'

const querySchema = z.object({
  layout: z.enum(['force', 'radial']).optional(),
  focusTagId: z.string().min(1).optional(),
  minimumWeight: z.coerce.number().min(0).max(1).optional(),
  role: z.enum(['primary', 'secondary', 'supporting']).optional(),
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const { layout = 'radial', focusTagId, minimumWeight, role } = querySchema.parse(params)

    const view = await getTagUniverse(layout, {
      focusTagId,
      minimumWeight,
      role: role as TagNodeRole | undefined,
    })

    return NextResponse.json(view)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', issues: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to load tag universe' }, { status: 500 })
  }
}
