import { db } from '@/lib/db'
import { buildPhotoWhereFromRule } from '@/lib/smart-albums'

export const dynamic = 'force-dynamic'

export default async function PublicSmartAlbumsList({ searchParams }: { searchParams?: { sort?: string } }) {
  const sort = (searchParams?.sort || 'recent').toLowerCase()
  const albumsRaw = await db.smartAlbum.findMany({ where: { visibility: 'PUBLIC' }, orderBy: { updatedAt: 'desc' }, take: 50 })
  // compute counts (public photos only)
  const albums = [] as any[]
  for (const a of albumsRaw) {
    try {
      const rule = (a.ruleJson as any) || {}
      const where = buildPhotoWhereFromRule({ ...rule, visibility: 'PUBLIC' }, a.userId)
      const count = await db.photo.count({ where })
      albums.push({ ...a, _count: { photos: count } })
    } catch {
      albums.push({ ...a, _count: { photos: 0 } })
    }
  }
  if (sort === 'count') {
    albums.sort((a, b) => (b._count?.photos || 0) - (a._count?.photos || 0))
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">公开智能相册</h1>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            排序：
            <a href="/smart?sort=recent" className={`px-2 py-1 rounded ${sort==='recent'?'bg-gray-200':''}`}>最近更新</a>
            <a href="/smart?sort=count" className={`px-2 py-1 rounded ${sort==='count'?'bg-gray-200':''}`}>匹配数量</a>
          </div>
        </div>
        {albums.length === 0 ? (
          <div className="text-gray-500">暂无公开智能相册</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {albums.map(a => (
              <a key={a.id} href={`/smart/${a.id}`} className="block border rounded overflow-hidden bg-white hover:shadow">
                <div className="aspect-video bg-gray-100">
                  {a.coverPhotoId ? (
                    <img src={`/api/image/${a.coverPhotoId}/small?format=webp`} alt={a.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-gray-500">匹配照片：{a._count?.photos || 0}</div>
                  {a.description && <div className="text-sm text-gray-500 line-clamp-2 mt-1">{a.description}</div>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
