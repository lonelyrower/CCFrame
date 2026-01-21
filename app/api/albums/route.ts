import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET all albums
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');

    const where: Record<string, unknown> = {};
    if (seriesId) {
      where.seriesId = seriesId;
    }

    const albums = await prisma.album.findMany({
      where,
      include: {
        series: true,
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 计算公开照片数量（Prisma _count 不支持 where 过滤）
    const albumIds = albums.map((a) => a.id);
    const publicCounts = albumIds.length
      ? await prisma.photo.groupBy({
          by: ['albumId'],
          where: { albumId: { in: albumIds }, isPublic: true },
          _count: { _all: true },
        })
      : [];
    const publicMap = new Map<string, number>(publicCounts.map((c) => [c.albumId as string, c._count._all]));

    return NextResponse.json({
      albums: albums.map((album: {
        id: string;
        title: string;
        summary: string | null;
        coverId: string | null;
        series: unknown;
        _count: { photos: number };
        createdAt: Date;
      }) => ({
        id: album.id,
        title: album.title,
        summary: album.summary,
        coverId: album.coverId,
        series: album.series,
        photoCount: publicMap.get(album.id) ?? 0,
        createdAt: album.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

// POST create album (admin only)
export async function POST(request: NextRequest) {
  try {
    // 双重认证检查（防御性编程）
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, summary, seriesId, coverId } = await request.json();

    const album = await prisma.album.create({
      data: {
        title,
        summary,
        seriesId: seriesId || null,
        coverId: coverId || null,
      },
      include: {
        series: true,
      },
    });

    return NextResponse.json({
      message: 'Album created successfully',
      album,
    });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    );
  }
}
