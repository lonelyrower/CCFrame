import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PHOTOS_PER_PAGE } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(PHOTOS_PER_PAGE));
    const tag = searchParams.get('tag');
    const albumId = searchParams.get('albumId');
    const seriesId = searchParams.get('seriesId');
    const isPublic = searchParams.get('isPublic');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (isPublic !== null) {
      where.isPublic = isPublic === 'true';
    }

    if (albumId) {
      where.albumId = albumId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    if (seriesId) {
      where.album = {
        seriesId,
      };
    }

    // Get total count
    const total = await prisma.photo.count({ where });

    // Get photos
    const photos = await prisma.photo.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        album: {
          include: {
            series: true,
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
      photos: photos.map((photo) => ({
        id: photo.id,
        title: photo.title,
        fileKey: photo.fileKey,
        width: photo.width,
        height: photo.height,
        isPublic: photo.isPublic,
        tags: photo.tags.map((pt) => pt.tag.name),
        album: photo.album,
        createdAt: photo.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
