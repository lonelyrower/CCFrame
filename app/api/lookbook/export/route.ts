import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'

import { lookbookExportQueue } from '@/jobs/queue'
import { getLookbookTemplateById } from '@/lib/lookbook/templates'
import { buildInitialRecord, saveLookbookStatus } from '@/lib/lookbook/export-status'
import type { LookbookExportRequest } from '@/types/lookbook'

const requestSchema = z.object({
  templateId: z.string().min(1),
  format: z.enum(['pdf', 'png']).optional(),
  photoIds: z.array(z.string().min(1)).min(1),
  includeSections: z.array(z.string().min(1)).optional(),
  theme: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const parsed = requestSchema.parse(payload)
    const template = getLookbookTemplateById(parsed.templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const format = parsed.format ?? template.defaultFormat
    if (!template.formats.includes(format)) {
      return NextResponse.json({ error: 'Format not supported by template' }, { status: 400 })
    }

    const exportId = randomUUID()

    const record = buildInitialRecord({ id: exportId, templateId: template.id, format })
    await saveLookbookStatus(record)

    const jobPayload: LookbookExportRequest = {
      templateId: template.id,
      format,
      photoIds: parsed.photoIds,
      includeSections: parsed.includeSections,
      theme: parsed.theme ?? null,
    }

    await lookbookExportQueue.add('lookbook-export', { exportId, request: jobPayload }, { jobId: exportId })

    return NextResponse.json({ exportId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', issues: error.flatten() }, { status: 400 })
    }
    console.error('[lookbook-export] failed', error)
    return NextResponse.json({ error: 'Failed to enqueue lookbook export' }, { status: 500 })
  }
}
