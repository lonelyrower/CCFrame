import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get('range') || '7');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    // Get metrics
    const metrics = await prisma.metricsDaily.findMany({
      where: {
        day: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        day: 'desc',
      },
    });

    // Calculate totals
    const totalPV = metrics.reduce((sum, m) => sum + m.pv, 0);
    const totalUV = metrics.reduce((sum, m) => sum + m.uv, 0);

    // Get photo stats
    const totalPhotos = await prisma.photo.count();
    const publicPhotos = await prisma.photo.count({
      where: { isPublic: true },
    });
    const privatePhotos = totalPhotos - publicPhotos;

    // Get recent uploads
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    const recentUploads = await prisma.photo.count({
      where: {
        createdAt: {
          gte: recentDate,
        },
      },
    });

    // Get top tags
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { photos: true },
        },
      },
      orderBy: {
        photos: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get top albums
    const albums = await prisma.album.findMany({
      include: {
        _count: {
          select: { photos: { where: { isPublic: true } } },
        },
      },
      orderBy: {
        photos: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get all series with photo counts, then sort and take top 10
    const allSeries = await prisma.series.findMany({
      include: {
        albums: {
          include: {
            _count: {
              select: { photos: { where: { isPublic: true } } },
            },
          },
        },
      },
    });

    const seriesWithCounts = allSeries
      .map((s) => ({
        ...s,
        photoCount: s.albums.reduce((sum, album) => sum + album._count.photos, 0),
      }))
      .sort((a, b) => b.photoCount - a.photoCount)
      .slice(0, 10);

    return NextResponse.json({
      traffic: {
        totalPV,
        totalUV,
        avgPVperDay: Math.round(totalPV / range),
        metrics,
      },
      library: {
        totalPhotos,
        publicPhotos,
        privatePhotos,
        recentUploads,
      },
      topTags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count.photos,
      })),
      topAlbums: albums.map((album) => ({
        id: album.id,
        title: album.title,
        count: album._count.photos,
      })),
      topSeries: seriesWithCounts.map((s) => ({
        id: s.id,
        title: s.title,
        count: s.photoCount,
      })),
    });
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
