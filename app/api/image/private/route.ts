import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // Get photo from database
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Check if photo is public (private images require authentication)
    if (!photo.isPublic) {
      // Authentication check is done in middleware
      // If we reach here, user is authenticated
    }

    // Read file from disk
    const filePath = join(process.cwd(), photo.fileKey);
    const fileBuffer = await readFile(filePath);

    // Determine content type
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    const contentType = contentTypes[photo.ext.toLowerCase()] || 'application/octet-stream';

    // Return image with no-store cache control for private images
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': photo.isPublic
          ? 'public, max-age=31536000, immutable'
          : 'private, no-cache, no-store, must-revalidate',
        'Content-Disposition': `inline; filename="${photo.id}.${photo.ext}"`,
      },
    });
  } catch (error) {
    console.error('Error serving private image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
