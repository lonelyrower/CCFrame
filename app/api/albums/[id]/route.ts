import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { PHOTOS_PER_PAGE } from '@/lib/constants';

// GET single album with paginated photos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);

    // 分页参数
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || String(PHOTOS_PER_PAGE));
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? PHOTOS_PER_PAGE : Math.min(rawLimit, 100);

    // Check if user is authenticated (admin)
    const session = await getSession();
    const isAdmin = Boolean(session);
    const { id } = await params;

    // 分别查询专辑信息和照片（支持分页）
    const [album, photoCount] = await Promise.all([
      prisma.album.findUnique({
        where: { id },
        include: {
          series: true,
        },
      }),
      prisma.photo.count({
        where: {
          albumId: id,
          ...(isAdmin ? {} : { isPublic: true }),
        },
      }),
    ]);

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // 分页查询照片
    const photos = await prisma.photo.findMany({
      where: {
        albumId: id,
        ...(isAdmin ? {} : { isPublic: true }),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      album: {
        ...album,
        photos: photos.map((photo) => ({
          ...photo,
          tags: photo.tags.map((pt) => pt.tag.name),
        })),
      },
      pagination: {
        page,
        limit,
        total: photoCount,
        totalPages: Math.ceil(photoCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}

// PUT update album (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 双重认证检查（防御性编程）
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, summary, seriesId, coverId } = await request.json();
    const { id } = await params;

    const album = await prisma.album.update({
      where: { id },
      data: {
        title,
        summary,
        seriesId: seriesId || null,
        coverId: coverId || null,
      },
    });

    return NextResponse.json({
      message: 'Album updated successfully',
      album,
    });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

// DELETE album (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 双重认证检查
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Album deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}
