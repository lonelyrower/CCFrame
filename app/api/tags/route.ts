import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    if (session) {
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
      });

      return NextResponse.json({
        tags: tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          count: tag._count.photos,
        })),
      });
    }

    const counts = await prisma.photoTag.groupBy({
      by: ['tagId'],
      where: {
        photo: { isPublic: true },
      },
      _count: { _all: true },
    });

    if (counts.length === 0) {
      return NextResponse.json({ tags: [] });
    }

    const tagIds = counts.map((c) => c.tagId);
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    const countMap = new Map<string, number>(
      counts.map((c) => [c.tagId, c._count._all])
    );

    const tagList = tags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: countMap.get(tag.id) || 0,
      }))
      .filter((tag) => tag.count > 0)
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ tags: tagList });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
