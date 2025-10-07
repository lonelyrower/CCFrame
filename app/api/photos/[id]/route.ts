import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

// GET single photo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
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
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      photo: {
        id: photo.id,
        title: photo.title,
        fileKey: photo.fileKey,
        ext: photo.ext,
        width: photo.width,
        height: photo.height,
        takenAt: photo.takenAt,
        isPublic: photo.isPublic,
        tags: photo.tags.map((pt) => pt.tag.name),
        album: photo.album,
        createdAt: photo.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}

// UPDATE photo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, isPublic, albumId, tags } = body;

    // Update photo
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (albumId !== undefined) updateData.albumId = albumId || null;

    const photo = await prisma.photo.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tags
      await prisma.photoTag.deleteMany({
        where: { photoId: params.id },
      });

      // Add new tags
      if (tags.length > 0) {
        const tagRecords = await Promise.all(
          tags.map((tagName: string) =>
            prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            })
          )
        );

        await prisma.photoTag.createMany({
          data: tagRecords.map((tag) => ({
            photoId: params.id,
            tagId: tag.id,
          })),
        });
      }
    }

    // Fetch updated photo with tags
    const updatedPhoto = await prisma.photo.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        album: true,
      },
    });

    return NextResponse.json({
      message: 'Photo updated successfully',
      photo: {
        id: updatedPhoto!.id,
        title: updatedPhoto!.title,
        fileKey: updatedPhoto!.fileKey,
        isPublic: updatedPhoto!.isPublic,
        tags: updatedPhoto!.tags.map((pt) => pt.tag.name),
        album: updatedPhoto!.album,
      },
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    );
  }
}

// DELETE photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get photo to delete files
    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: params.id },
    });

    // Delete files from disk
    try {
      const filePath = join(process.cwd(), photo.fileKey);
      await unlink(filePath);

      // Also try to delete thumbnail
      const thumbPath = filePath.replace('/original/', '/thumbs/');
      await unlink(thumbPath).catch(() => {
        // Ignore if thumb doesn't exist
      });
    } catch (error) {
      console.error('Error deleting files:', error);
      // Continue even if file deletion fails
    }

    return NextResponse.json({
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
