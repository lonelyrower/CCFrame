import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET single series
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated (admin)
    const session = await getSession();
    const isAdmin = Boolean(session);
    const { id } = await params;

    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        albums: {
          include: {
            photos: {
              // 非管理员仅预览公开照片
              where: isAdmin ? {} : { isPublic: true },
              take: 1,
            },
            // Prisma 不支持在 _count 中使用 where 过滤，这里仅取总数
            _count: { select: { photos: true } },
          },
        },
      },
    });

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      );
    }

    // 非管理员需要将 _count.photos 替换为“公开照片数量”
    if (series && !isAdmin) {
      const albumIds = series.albums.map((a) => a.id);
      if (albumIds.length > 0) {
        const counts = await prisma.photo.groupBy({
          by: ['albumId'],
          where: { albumId: { in: albumIds }, isPublic: true },
          _count: { _all: true },
        });
        const map = new Map<string, number>(counts.map((c) => [c.albumId as string, c._count._all]));
        const seriesSanitized = {
          ...series,
          albums: series.albums.map((a) => ({
            ...a,
            _count: { ...a._count, photos: map.get(a.id) || 0 },
          })),
        };
        return NextResponse.json({ series: seriesSanitized });
      }
    }

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

// PUT update series (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { slug, title, summary, brand, coverId } = await request.json();
    const { id } = await params;

    const series = await prisma.series.update({
      where: { id },
      data: {
        slug,
        title,
        summary,
        brand: brand || null,
        coverId: coverId || null,
      },
    });

    return NextResponse.json({
      message: 'Series updated successfully',
      series,
    });
  } catch (error) {
    console.error('Error updating series:', error);
    return NextResponse.json(
      { error: 'Failed to update series' },
      { status: 500 }
    );
  }
}

// DELETE series (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.series.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Series deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json(
      { error: 'Failed to delete series' },
      { status: 500 }
    );
  }
}
