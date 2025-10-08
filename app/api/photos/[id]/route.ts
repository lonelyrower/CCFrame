import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unlink, rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { getSession } from '@/lib/session';

// GET single photo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;
    const photo = await prisma.photo.findUnique({
      where: { id },
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

    // 未登录用户不可访问私密照片（避免枚举，返回404）
    if (!photo.isPublic && !session) {
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
        tags: photo.tags.map((pt: { tag: { name: string } }) => pt.tag.name),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { title, isPublic, albumId, tags, dominantColor } = body;
    const { id } = await params;

    // Get current photo to check if isPublic is changing
    const currentPhoto = await prisma.photo.findUnique({
      where: { id },
    });

    if (!currentPhoto) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Update photo
    const updateData: {
      title?: string;
      isPublic?: boolean;
      albumId?: string | null;
      dominantColor?: string;
      fileKey?: string;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (albumId !== undefined) updateData.albumId = albumId || null;
    if (dominantColor !== undefined) updateData.dominantColor = dominantColor;

    // Handle file movement if isPublic is changing
    if (isPublic !== undefined && isPublic !== currentPhoto.isPublic) {
      // Helpers to resolve FS paths and normalize fileKey
      const resolveFsPathFromFileKey = (fileKey: string) => {
        if (fileKey.startsWith('private/')) return join(process.cwd(), fileKey);
        if (fileKey.startsWith('public/')) return join(process.cwd(), fileKey);
        if (fileKey.startsWith('uploads/')) return join(process.cwd(), 'public', fileKey);
        return join(process.cwd(), fileKey);
      };
      const toPublicFileKey = (fileKey: string) => {
        if (fileKey.startsWith('private/')) return fileKey.replace(/^private\//, '');
        if (fileKey.startsWith('public/')) return fileKey.replace(/^public\//, '');
        return fileKey;
      };
      const toPrivateFileKey = (fileKey: string) => {
        if (fileKey.startsWith('private/')) return fileKey;
        if (fileKey.startsWith('public/')) return fileKey.replace(/^public\//, 'private/');
        if (fileKey.startsWith('uploads/')) return `private/${fileKey}`;
        return `private/${fileKey}`;
      };

      const oldPath = resolveFsPathFromFileKey(currentPhoto.fileKey);
      const oldThumbPath = oldPath.replace('/original/', '/thumbs/');

      const newFileKey = isPublic
        ? toPublicFileKey(currentPhoto.fileKey)
        : toPrivateFileKey(currentPhoto.fileKey);

      const newPath = isPublic
        ? join(process.cwd(), 'public', newFileKey)
        : join(process.cwd(), newFileKey);
      const newThumbPath = newPath.replace('/original/', '/thumbs/');

      // Ensure new directories exist
      const newDir = dirname(newPath);
      const newThumbDir = dirname(newThumbPath);

      if (!existsSync(newDir)) await mkdir(newDir, { recursive: true });
      if (!existsSync(newThumbDir)) await mkdir(newThumbDir, { recursive: true });

      // Move files
      try {
        if (existsSync(oldPath)) await rename(oldPath, newPath);
        if (existsSync(oldThumbPath)) await rename(oldThumbPath, newThumbPath);
        updateData.fileKey = newFileKey;
      } catch (error) {
        console.error('Error moving files:', error);
        // Continue with update even if file move fails
      }
    }

    const _photo = await prisma.photo.update({
      where: { id },
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
        where: { photoId: id },
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
          data: tagRecords.map((tag: { id: string }) => ({
            photoId: id,
            tagId: tag.id,
          })),
        });
      }
    }

    // Fetch updated photo with tags
    const updatedPhoto = await prisma.photo.findUnique({
      where: { id },
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
        tags: updatedPhoto!.tags.map((pt: { tag: { name: string } }) => pt.tag.name),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Get photo to delete files
    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id },
    });

    // Delete files from disk
    try {
      const resolveFsPathFromFileKey = (fileKey: string) => {
        if (fileKey.startsWith('private/')) return join(process.cwd(), fileKey);
        if (fileKey.startsWith('public/')) return join(process.cwd(), fileKey);
        if (fileKey.startsWith('uploads/')) return join(process.cwd(), 'public', fileKey);
        return join(process.cwd(), fileKey);
      };
      const filePath = resolveFsPathFromFileKey(photo.fileKey);
      await unlink(filePath).catch(() => {});

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
