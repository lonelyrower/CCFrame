import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PHOTOS_PER_PAGE } from '@/lib/constants';
import { getSession } from '@/lib/session';
import sharp from 'sharp';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(PHOTOS_PER_PAGE));
    const tag = searchParams.get('tag');
    const albumId = searchParams.get('albumId');
    const seriesId = searchParams.get('seriesId');
    const isPublic = searchParams.get('isPublic');

    // Determine authentication state
    const session = await getSession();

    // Build where clause
    const where: Record<string, unknown> = {};

    // Enforce visibility: unauthenticated用户只能看到公开照片
    if (!session) {
      where.isPublic = true;
    } else if (isPublic !== null) {
      // 管理端可通过查询参数筛选
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

    // Lazy fill dominantColor for public photos if missing (no auth required)
    // Best-effort, non-blocking on failure
    await Promise.all(
      photos.map(async (photo) => {
        if (photo.isPublic && !photo.dominantColor && typeof photo.fileKey === 'string') {
          try {
            const fileKey = photo.fileKey as string;
            const filePath = fileKey.startsWith('uploads/')
              ? join(process.cwd(), 'public', fileKey)
              : fileKey.startsWith('public/')
              ? join(process.cwd(), fileKey)
              : null;

            if (filePath && existsSync(filePath)) {
              const stats = await sharp(filePath).stats();
              let hex: string | null = null;
              if ((stats as any).dominant) {
                const { r, g, b } = (stats as any).dominant as { r: number; g: number; b: number };
                hex = `#${r.toString(16).padStart(2, '0')}${g
                  .toString(16)
                  .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              } else if (stats.channels && stats.channels.length >= 3) {
                const [red, green, blue] = stats.channels;
                const r = Math.round(red.mean);
                const g = Math.round(green.mean);
                const b = Math.round(blue.mean);
                hex = `#${r.toString(16).padStart(2, '0')}${g
                  .toString(16)
                  .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              }
              if (hex) {
                await prisma.photo.update({ where: { id: photo.id }, data: { dominantColor: hex } });
                // mutate in memory to reflect in response
                (photo as any).dominantColor = hex;
              }
            }
          } catch (e) {
            // ignore
          }
        }
      })
    );

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      photos: photos.map((photo: any) => {
        // 未登录时绝不返回私密路径（理论上不会出现，双重保险）
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
          tags: photo.tags.map((pt: { tag: { name: string } }) => pt.tag.name),
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
