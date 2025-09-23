export type LookbookTemplateKind = 'poster' | 'brochure' | 'social'

export interface LookbookTemplate {
  id: string
  kind: LookbookTemplateKind
  name: string
  description: string
  aspectRatio: string
  pageCount: number
  formats: Array<'pdf' | 'png'>
  defaultFormat: 'pdf' | 'png'
  previewImage: string
}

export interface LookbookTemplateSection {
  id: string
  title: string
  selected: boolean
}

export interface LookbookExportRequest {
  templateId: string
  format: 'pdf' | 'png'
  photoIds: string[]
  includeSections?: string[]
  theme?: string | null
  userId?: string | null
}

export type LookbookExportStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface LookbookExportRecord {
  id: string
  status: LookbookExportStatus
  templateId: string
  format: 'pdf' | 'png'
  downloadUrl?: string | null
  message?: string | null
  createdAt: string
  updatedAt: string
  expiresAt?: string | null
}

export interface LookbookExportResponse {
  exportId: string
}
