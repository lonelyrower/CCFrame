import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all series
export async function GET() {
  try {
    const series = await prisma.series.findMany({
      include: {
        albums: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const coverIds = series
      .map((item) => item.coverId)
      .filter((id): id is string => Boolean(id));
    const coverPhotos = coverIds.length
      ? await prisma.photo.findMany({
          where: { id: { in: coverIds }, isPublic: true },
          select: {
            id: true,
            fileKey: true,
            isPublic: true,
            dominantColor: true,
            width: true,
            height: true,
          },
        })
      : [];
    const coverMap = new Map(coverPhotos.map((photo) => [photo.id, photo]));

    // 统计所有专辑的公开照片数量
    const allAlbumIds = series.flatMap((s) => s.albums.map((a) => a.id));
    const counts = allAlbumIds.length
      ? await prisma.photo.groupBy({
          by: ['albumId'],
          where: { albumId: { in: allAlbumIds }, isPublic: true },
          _count: { _all: true },
        })
      : [];
    const map = new Map<string, number>(counts.map((c) => [c.albumId as string, c._count._all]));

    return NextResponse.json({
      series: series.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        summary: s.summary,
        brand: s.brand,
        coverId: s.coverId,
        coverPhoto: s.coverId ? coverMap.get(s.coverId) || null : null,
        albumCount: s.albums.length,
        photoCount: s.albums.reduce((sum, album) => sum + (map.get(album.id) || 0), 0),
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

// POST create series (admin only)
export async function POST(request: NextRequest) {
  try {
    const { slug, title, summary, brand, coverId } = await request.json();

    const series = await prisma.series.create({
      data: {
        slug,
        title,
        summary,
        brand: brand || null,
        coverId: coverId || null,
      },
    });

    return NextResponse.json({
      message: 'Series created successfully',
      series,
    });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    );
  }
}
