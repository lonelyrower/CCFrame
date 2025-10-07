import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all series
export async function GET() {
  try {
    const series = await prisma.series.findMany({
      include: {
        albums: {
          include: {
            _count: {
              select: { photos: { where: { isPublic: true } } },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      series: series.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        summary: s.summary,
        coverId: s.coverId,
        albumCount: s.albums.length,
        photoCount: s.albums.reduce((sum, album) => sum + album._count.photos, 0),
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
    const { slug, title, summary, coverId } = await request.json();

    const series = await prisma.series.create({
      data: {
        slug,
        title,
        summary,
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
