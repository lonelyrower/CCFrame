import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'
import { buildPhotoWhereFromRule } from '@/lib/smart-albums'

export const dynamic = 'force-dynamic'

export default async function PublicSmartAlbumsList({ searchParams }: { searchParams?: { sort?: string } }) {
  const sort = (searchParams?.sort || 'recent').toLowerCase()
  const albumsRaw = await db.smartAlbum.findMany({
    where: { visibility: 'PUBLIC' },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  const albums = await Promise.all(albumsRaw.map(async (album) => {
    try {
      const rule = (album.ruleJson as any) || {}
      const where = buildPhotoWhereFromRule({ ...rule, visibility: 'PUBLIC' }, album.userId)
      const count = await db.photo.count({ where })
      return { ...album, _count: { photos: count } }
    } catch {
      return { ...album, _count: { photos: 0 } }
    }
  }))

  if (sort === 'count') {
    albums.sort((a, b) => (b._count?.photos || 0) - (a._count?.photos || 0))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">智能相册集</h1>
        <div className="text-sm text-text-secondary flex items-center gap-2">
          排序：
          <Link href="/smart?sort=recent" className={`px-2 py-1 rounded ${sort === 'recent' ? 'bg-surface-panel' : ''}`}>
            最新创建
          </Link>
          <Link href="/smart?sort=count" className={`px-2 py-1 rounded ${sort === 'count' ? 'bg-surface-panel' : ''}`}>
            匹配数量
          </Link>
        </div>
      </div>
      {albums.length === 0 ? (
        <div className="text-text-muted">暂无公开智能相册</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {albums.map((album) => (
            <Link key={album.id} href={`/smart/${album.id}`} className="block border rounded overflow-hidden bg-surface-panel hover:shadow">
              <div className="aspect-video bg-surface-panel relative">
                {album.coverPhotoId ? (
                  <Image
                    src={`/api/image/${album.coverPhotoId}/small?format=webp`}
                    alt={album.title || '智能相册封面'}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <div className="font-medium">{album.title}</div>
                <div className="text-xs text-text-muted">匹配照片：{album._count?.photos || 0}</div>
                {album.description && (
                  <div className="text-sm text-text-muted line-clamp-2 mt-1">{album.description}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

