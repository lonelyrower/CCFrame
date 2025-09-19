import Image from 'next/image'
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">�����������</h1>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            ����
            <a href="/smart?sort=recent" className={`px-2 py-1 rounded ${sort === 'recent' ? 'bg-gray-200' : ''}`}>
              �������
            </a>
            <a href="/smart?sort=count" className={`px-2 py-1 rounded ${sort === 'count' ? 'bg-gray-200' : ''}`}>
              ƥ������
            </a>
          </div>
        </div>
        {albums.length === 0 ? (
          <div className="text-gray-500">���޹����������</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {albums.map((album) => (
              <a key={album.id} href={`/smart/${album.id}`} className="block border rounded overflow-hidden bg-white hover:shadow">
                <div className="aspect-video bg-gray-100 relative">
                  {album.coverPhotoId ? (
                    <Image
                      src={`/api/image/${album.coverPhotoId}/small?format=webp`}
                      alt={album.title || '����������'}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="font-medium">{album.title}</div>
                  <div className="text-xs text-gray-500">ƥ����Ƭ��{album._count?.photos || 0}</div>
                  {album.description && (
                    <div className="text-sm text-gray-500 line-clamp-2 mt-1">{album.description}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

