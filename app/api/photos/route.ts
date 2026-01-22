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

    // 支持游标分页（推荐）和偏移分页（向后兼容）
    const cursor = searchParams.get('cursor');
    const rawLimit = parseInt(searchParams.get('limit') || String(PHOTOS_PER_PAGE));
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? PHOTOS_PER_PAGE : Math.min(rawLimit, 100);

    // 偏移分页参数（向后兼容）
    const rawPage = parseInt(searchParams.get('page') || '1');
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

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

    // 使用游标分页（O(1) 性能）或偏移分页（向后兼容）
    let photos: PhotoWithRelations[];
    let total: number | undefined;
    let nextCursor: string | null = null;

    if (cursor) {
      // 游标分页：高性能，适合无限滚动
      photos = (await prisma.photo.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          album: { include: { series: true } },
        },
        orderBy: { createdAt: 'desc' },
        cursor: { id: cursor },
        skip: 1, // 跳过游标本身
        take: limit + 1, // 多取一条判断是否有下一页
      })) as PhotoWithRelations[];

      // 判断是否有更多数据
      if (photos.length > limit) {
        photos.pop();
        nextCursor = photos[photos.length - 1]?.id || null;
      }
    } else {
      // 偏移分页：向后兼容，提供总数
      [photos, total] = await Promise.all([
        prisma.photo.findMany({
          where,
          include: {
            tags: { include: { tag: true } },
            album: { include: { series: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit + 1,
        }) as Promise<PhotoWithRelations[]>,
        prisma.photo.count({ where }),
      ]);

      // 判断是否有更多数据
      if (photos.length > limit) {
        photos.pop();
        nextCursor = photos[photos.length - 1]?.id || null;
      }
    }

    const formattedPhotos = photos.map((photo) => {
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
    });

    return NextResponse.json({
      photos: formattedPhotos,
      pagination: {
        page: cursor ? undefined : page,
        limit,
        total: total ?? undefined,
        totalPages: total ? Math.ceil(total / limit) : undefined,
        nextCursor,
        hasMore: nextCursor !== null,
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
