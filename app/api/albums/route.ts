import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all albums
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');

    const where: any = {};
    if (seriesId) {
      where.seriesId = seriesId;
    }

    const albums = await prisma.album.findMany({
      where,
      include: {
        series: true,
        _count: {
          select: { photos: { where: { isPublic: true } } },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      albums: albums.map((album) => ({
        id: album.id,
        title: album.title,
        summary: album.summary,
        coverId: album.coverId,
        series: album.series,
        photoCount: album._count.photos,
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
