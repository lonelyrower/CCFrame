import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PHOTOS_PER_PAGE } from '@/lib/constants';
import { getSession } from '@/lib/session';
import type { Album, Photo as PhotoModel, PhotoTag, Prisma, Series, Tag } from '@prisma/client';

interface PhotoWithRelations extends PhotoModel {
  tags: (PhotoTag & { tag: Tag })[];
  album: (Album & { series: Series | null }) | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 分页参数验证与安全限制
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || String(PHOTOS_PER_PAGE));
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? PHOTOS_PER_PAGE : Math.min(rawLimit, 100);  // 最大100条防止DoS

    const tag = searchParams.get('tag');
    const albumId = searchParams.get('albumId');
    const seriesId = searchParams.get('seriesId');
    const isPublic = searchParams.get('isPublic');

    // Determine authentication state
    const session = await getSession();

    // Build where clause
    const where: Prisma.PhotoWhereInput = {};

    // Unauthenticated users can only view public photos
    if (!session) {
      where.isPublic = true;
    } else if (isPublic !== null) {
      // Authenticated users can explicitly filter by isPublic flag
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

    // Get photos without performing per-request image processing
    const photos = (await prisma.photo.findMany({
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
    })) as PhotoWithRelations[];

    return NextResponse.json({
      photos: photos.map((photo) => {
        const fileKey = !session && String(photo.fileKey).startsWith('private/')
          ? ''
          : String(photo.fileKey);

        return {
          id: photo.id,
          title: photo.title,
          fileKey,
          width: photo.width,
          height: photo.height,
          isPublic: photo.isPublic,
          dominantColor: photo.dominantColor,
          tags: photo.tags.map((pt) => pt.tag.name),
          album: photo.album,
          createdAt: photo.createdAt,
        };
      }),
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
