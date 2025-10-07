import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { existsSync } from 'fs';

export interface UploadResult {
  fileKey: string;
  ext: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(
  file: File,
  fileName: string
): Promise<UploadResult> {
  // Get file buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Get current date for folder structure
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Create upload directory path
  const uploadDir = join(process.cwd(), 'uploads', 'original', String(year), month);

  // Ensure directory exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Get file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';

  // Generate unique filename
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = join(uploadDir, uniqueName);

  // Get image metadata using sharp
  const metadata = await sharp(buffer).metadata();

  // Save original file
  await writeFile(filePath, buffer);

  // Generate thumbnail (optional, for future use)
  const thumbDir = join(process.cwd(), 'uploads', 'thumbs', String(year), month);
  if (!existsSync(thumbDir)) {
    await mkdir(thumbDir, { recursive: true });
  }

  const thumbPath = join(thumbDir, uniqueName);
  await sharp(buffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toFile(thumbPath);

  // Return file info
  const fileKey = `uploads/original/${year}/${month}/${uniqueName}`;

  return {
    fileKey,
    ext,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
  };
}

/**
 * Extract EXIF data from image
 */
export async function extractExifData(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      exif: metadata.exif,
    };
  } catch (error) {
    console.error('Error extracting EXIF:', error);
    return null;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: 50MB`,
    };
  }

  return { valid: true };
}
