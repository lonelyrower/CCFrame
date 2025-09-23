import type { LookbookExportRequest } from '@/types/lookbook'
import { getLookbookTemplateById } from './templates'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { getLookbookStatus, patchRecord, saveLookbookStatus } from './export-status'

const MIME_BY_FORMAT: Record<LookbookExportRequest['format'], string> = {
  pdf: 'application/pdf',
  png: 'image/png',
}

const PNG_PLACEHOLDER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAklEQVR4AewaftIAAAXQSURBVO3BQREAAAjDMO5f9C2hgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsgg8AVqEJQQAAAABJRU5ErkJggg==',
  'base64',
)

export interface LookbookExportJobData {
  exportId: string
  request: LookbookExportRequest
}

export async function markLookbookProcessing(exportId: string) {
  const current = await getLookbookStatus(exportId)
  if (!current) return
  const next = patchRecord(current, { status: 'processing' })
  await saveLookbookStatus(next)
}

export async function markLookbookFailure(exportId: string, message: string) {
  const current = await getLookbookStatus(exportId)
  if (!current) return
  const next = patchRecord(current, { status: 'failed', message })
  await saveLookbookStatus(next)
}

export async function processLookbookExport(data: LookbookExportJobData) {
  const { exportId, request } = data
  const template = getLookbookTemplateById(request.templateId)
  if (!template) {
    throw new Error(`Unknown lookbook template: ${request.templateId}`)
  }

  const buffer = request.format === 'pdf' ? createPdfBuffer(template.name, request) : createPngBuffer()
  const key = StorageManager.generateKey('lookbooks', `${exportId}.${request.format}`)
  const contentType = MIME_BY_FORMAT[request.format]

  const storage = getStorageManager()
  await storage.uploadBuffer(key, buffer, contentType)

  let downloadUrl: string | null = null
  if (typeof storage.getPublicUrl === 'function') {
    try {
      downloadUrl = storage.getPublicUrl(key)
    } catch {
      downloadUrl = null
    }
  }
  if (!downloadUrl && typeof storage.getPresignedDownloadUrl === 'function') {
    try {
      downloadUrl = await storage.getPresignedDownloadUrl(key)
    } catch {
      downloadUrl = null
    }
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString()

  const current = await getLookbookStatus(exportId)
  if (current) {
    const next = patchRecord(current, { status: 'ready', downloadUrl: downloadUrl ?? null, expiresAt })
    await saveLookbookStatus(next)
  }

  return { key, downloadUrl, expiresAt }
}

function createPngBuffer(): Buffer {
  return PNG_PLACEHOLDER
}

function createPdfBuffer(templateName: string, request: LookbookExportRequest): Buffer {
  const lines = [
    'Lookbook Export Placeholder',
    `Template: ${templateName}`,
    `Photos: ${request.photoIds.length}`,
    `Generated: ${new Date().toISOString()}`,
  ]
  const content = buildPdfStream(lines)
  return Buffer.from(content, 'utf-8')
}

function buildPdfStream(lines: string[]): string {
  const escapedLines = lines.map((line) => line.replace(/([\\()])/g, '\\$1'))
  const textCommands = escapedLines
    .map((line, index) => `${index === 0 ? '' : '0 -24 Td\n'}(${line}) Tj`)
    .join('\n')

  const streamContent = `BT\n/F1 18 Tf\n72 720 Td\n${textCommands}\nET\n`
  const objects: string[] = []

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('<< /Type /Pages /Count 1 /Kids [3 0 R] >>')
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>')
  objects.push(`<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream`)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  let offset = 0
  const header = '%PDF-1.4\n'
  offset += header.length
  const bodyParts: string[] = []
  const xrefEntries: number[] = [0]

  objects.forEach((obj, idx) => {
    const objectString = `${idx + 1} 0 obj\n${obj}\nendobj\n`
    bodyParts.push(objectString)
    xrefEntries.push(offset)
    offset += objectString.length
  })

  const xrefOffset = offset
  let xref = `xref\n0 ${objects.length + 1}\n`
  xref += '0000000000 65535 f \n'
  for (let i = 1; i < xrefEntries.length; i += 1) {
    xref += `${xrefEntries[i].toString().padStart(10, '0')} 00000 n \n`
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return [header, ...bodyParts, xref, trailer].join('')
}