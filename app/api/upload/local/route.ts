import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { saveUploadedFile, validateImageFile } from '@/lib/image/upload';
import { getStorageProvider } from '@/lib/storage';

// Configure route segment for file uploads
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const isPublic = formData.get('isPublic') === 'true';
    const albumId = formData.get('albumId') as string | null;
    const dominantColor = formData.get('dominantColor') as string | null;
    const skipDuplicateCheck = formData.get('skipDuplicateCheck') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const storageProvider = getStorageProvider();

    // Read buffer once (used for checksum + upload)
    const buffer = Buffer.from(await file.arrayBuffer());

    // Compute checksum for duplicate detection
    const checksum = createHash('sha256').update(buffer).digest('hex');

    if (!skipDuplicateCheck) {
      const existingPhoto = await prisma.photo.findUnique({
        where: { checksum },
        include: {
          tags: { include: { tag: true } },
          album: true,
        },
      });

      if (existingPhoto) {
        return NextResponse.json({
          message: 'Photo already exists. Skipping upload.',
          duplicate: true,
          photo: {
            id: existingPhoto.id,
            title: existingPhoto.title,
            fileKey: existingPhoto.fileKey,
            width: existingPhoto.width,
            height: existingPhoto.height,
            isPublic: existingPhoto.isPublic,
            tags: existingPhoto.tags.map((pt) => pt.tag.name),
            album: existingPhoto.album,
            createdAt: existingPhoto.createdAt,
          },
        });
      }
    }

    // Parse tags
    let tags: string[] = [];
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString);
      } catch {
        // Fallback to comma-separated parsing
        tags = tagsString
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }

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

    // Persist file via storage provider
    const uploadResult = await saveUploadedFile(file, file.name, isPublic, buffer);

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        title: title || file.name,
        fileKey: uploadResult.fileKey,
        storageProvider: storageProvider.name,
        ext: uploadResult.ext,
        width: uploadResult.width,
        height: uploadResult.height,
        isPublic,
        checksum,
        fileSize: uploadResult.size,
        // ����ʹ���ⲿ���루��ǰ���Ѽ��㣩������ʹ�÷�������ȡ�� dominantColor
        dominantColor: dominantColor || uploadResult.dominantColor || null,
        albumId: albumId || undefined,
        tags: {
          create: tagRecords.map((tag: { id: string }) => ({
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
      duplicate: false,
      photo: {
        id: photo.id,
        title: photo.title,
        fileKey: photo.fileKey,
        width: photo.width,
        height: photo.height,
        isPublic: photo.isPublic,
        tags: photo.tags.map((pt: { tag: { name: string } }) => pt.tag.name),
        album: photo.album,
        createdAt: photo.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
