import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET single album
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated (admin)
    const session = await getSession();
    const isAdmin = Boolean(session);
    const { id } = await params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        series: true,
        photos: {
          // Only filter by isPublic for non-admin users
          where: isAdmin ? {} : { isPublic: true },
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      album: {
        ...album,
        photos: album.photos.map((photo) => ({
          ...photo,
          tags: photo.tags.map((pt) => pt.tag.name),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}

// PUT update album (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { title, summary, seriesId, coverId } = await request.json();
    const { id } = await params;

    const album = await prisma.album.update({
      where: { id },
      data: {
        title,
        summary,
        seriesId: seriesId || null,
        coverId: coverId || null,
      },
    });

    return NextResponse.json({
      message: 'Album updated successfully',
      album,
    });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

// DELETE album (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Album deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}
