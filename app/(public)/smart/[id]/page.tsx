import Image from 'next/image'
import { db } from '@/lib/db'
import { buildPhotoWhereFromRule } from '@/lib/smart-albums'

export const dynamic = 'force-dynamic'

export default async function PublicSmartAlbumPage({ params }: { params: { id: string } }) {
  const album = await db.smartAlbum.findUnique({ where: { id: params.id } })
  if (!album || album.visibility !== 'PUBLIC') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        未找到该智能相册或未公开
      </div>
    )
  }

  const rule = (album.ruleJson as any) || {}
  // 构建查询，强制仅展示公开照片
  const where = buildPhotoWhereFromRule({ ...rule, visibility: 'PUBLIC' }, album.userId)
  const photos = await db.photo.findMany({ where, include: { variants: true }, orderBy: { createdAt: 'desc' }, take: 200 })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{album.title}</h1>
        {album.description && <p className="text-gray-600 mt-1">{album.description}</p>}
      </div>
      {photos.length === 0 ? (
        <div className="text-gray-500">暂无公开照片</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square">
              <Image
                src={`/api/image/${p.id}/small?format=webp`}
                alt={`Photo ${p.id}`}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="rounded object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

