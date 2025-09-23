export type LibraryVisibilityFilter = 'all' | 'PUBLIC' | 'PRIVATE'
export type LibraryStatusFilter = 'all' | 'processing' | 'review' | 'published' | 'failed'

export interface LibrarySummary {
  total: number
  public: number
  private: number
  processing: number
  failed: number
}

export interface LibraryTagInfo {
  id: string
  name: string
  color: string
}

export interface LibraryTableItem {
  id: string
  title: string | null
  fileName: string
  albumTitle: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  status: string
  tags: LibraryTagInfo[]
  width: number
  height: number
  sizeBytes: number | null
  createdAt: string
  updatedAt: string
}

export interface LibraryTableResult {
  items: LibraryTableItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export type LibraryWorkflowStage = 'processing' | 'review' | 'published' | 'failed'

export interface LibraryWorkflowItem {
  id: string
  title: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  status: string
  albumTitle: string | null
  createdAt: string
  thumbUrl: string
}

export interface LibraryWorkflowColumn {
  id: LibraryWorkflowStage
  title: string
  description: string
  items: LibraryWorkflowItem[]
}

export interface LibraryOverviewDto {
  summary: LibrarySummary
  table: LibraryTableResult
  workflow: LibraryWorkflowColumn[]
}

export interface LibraryTableQuery {
  search?: string
  status?: LibraryStatusFilter
  visibility?: LibraryVisibilityFilter
  tags?: string[]
  page?: number
  pageSize?: number
}

export interface LibraryBatchActionResult {
  updated: number
}
