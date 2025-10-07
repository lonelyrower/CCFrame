import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET single series
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const series = await prisma.series.findUnique({
      where: { id: params.id },
      include: {
        albums: {
          include: {
            photos: {
              where: { isPublic: true },
              take: 1,
            },
            _count: {
              select: { photos: { where: { isPublic: true } } },
            },
          },
        },
      },
    });

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

// PUT update series (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { slug, title, summary, coverId } = await request.json();

    const series = await prisma.series.update({
      where: { id: params.id },
      data: {
        slug,
        title,
        summary,
        coverId: coverId || null,
      },
    });

    return NextResponse.json({
      message: 'Series updated successfully',
      series,
    });
  } catch (error) {
    console.error('Error updating series:', error);
    return NextResponse.json(
      { error: 'Failed to update series' },
      { status: 500 }
    );
  }
}

// DELETE series (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.series.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Series deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json(
      { error: 'Failed to delete series' },
      { status: 500 }
    );
  }
}
