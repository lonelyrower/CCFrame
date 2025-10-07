import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { saveUploadedFile, validateImageFile } from '@/lib/image/upload';

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const isPublic = formData.get('isPublic') === 'true';
    const albumId = formData.get('albumId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Save file to disk
    const uploadResult = await saveUploadedFile(file, file.name);

    // Parse tags
    const tags = tagsString
      ? tagsString.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    // Create or find tags in database
    const tagRecords = await Promise.all(
      tags.map((tagName) =>
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        })
      )
    );

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        title: title || file.name,
        fileKey: uploadResult.fileKey,
        ext: uploadResult.ext,
        width: uploadResult.width,
        height: uploadResult.height,
        isPublic,
        albumId: albumId || undefined,
        tags: {
          create: tagRecords.map((tag) => ({
            tag: {
              connect: { id: tag.id },
            },
          })),
        },
      },
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
      message: 'Upload successful',
      photo: {
        id: photo.id,
        title: photo.title,
        fileKey: photo.fileKey,
        width: photo.width,
        height: photo.height,
        isPublic: photo.isPublic,
        tags: photo.tags.map((pt) => pt.tag.name),
        album: photo.album,
        createdAt: photo.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
