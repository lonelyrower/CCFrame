import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getSession } from '@/lib/session';
import { CACHE_CONTROL } from '@/lib/constants';

/**
 * Serve private images with authentication
 * GET /api/image/private/uploads/original/2025/10/photo.jpg
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const fullPath = pathSegments.join('/');

    // Only serve private images through this route
    if (!fullPath.startsWith('private/')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check authentication for private images
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Construct file path
    const filePath = join(process.cwd(), fullPath);

    // Security: prevent path traversal
    if (!filePath.startsWith(join(process.cwd(), 'private/'))) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read and return file
    const fileBuffer = await readFile(filePath);

    // Determine content type from extension
    const ext = fullPath.split('.').pop()?.toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'heic': 'image/heic',
    }[ext || 'jpg'] || 'image/jpeg';

    // Convert Buffer to an ArrayBufferView (Uint8Array) to satisfy BodyInit without SharedArrayBuffer union
    const uint8 = new Uint8Array(
      fileBuffer.buffer as ArrayBuffer,
      fileBuffer.byteOffset,
      fileBuffer.byteLength
    );
    return new NextResponse(uint8, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': CACHE_CONTROL.PRIVATE,
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
