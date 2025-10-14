import sharp from 'sharp';
import { getStorageProvider } from '@/lib/storage';

export interface UploadResult {
  fileKey: string;
  ext: string;
  width: number;
  height: number;
  size: number;
  dominantColor?: string;
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(
  file: File,
  fileName: string,
  isPublic: boolean = true,
  providedBuffer?: Buffer
): Promise<UploadResult> {
  const storageProvider = getStorageProvider();

  // Get file buffer
  const buffer =
    providedBuffer || Buffer.from(await file.arrayBuffer());

  // Get current date for folder structure
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Get file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';

  // Generate unique filename
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const originalKey = ['uploads', 'original', String(year), month, uniqueName].join('/');

  // Get image metadata using sharp
  const metadata = await sharp(buffer).metadata();

  // Save original file through storage provider
  const { storedKey: fileKey } = await storageProvider.putObject({
    key: originalKey,
    body: buffer,
    contentType: file.type,
    isPublic,
  });

  // Generate thumbnail (optional, for future use)
  const thumbKey = ['uploads', 'thumbs', String(year), month, uniqueName].join('/');
  const thumbBuffer = await sharp(buffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  await storageProvider.putObject({
    key: thumbKey,
    body: thumbBuffer,
    contentType: 'image/jpeg',
    isPublic,
  });

  // Compute dominant color on server (best-effort)
  let dominantColor: string | undefined;
  try {
    const stats = await sharp(buffer).stats();
    // Prefer sharp's dominant swatch if available
    const dominantSwatch = (stats as { dominant?: { r: number; g: number; b: number } }).dominant;
    if (dominantSwatch) {
      const { r, g, b } = dominantSwatch;
      dominantColor = `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else if (Array.isArray(stats.channels) && stats.channels.length >= 3) {
      // Fallback: average across channels
      const [red, green, blue] = stats.channels as Array<{ mean: number }>;
      const r = Math.round(red.mean);
      const g = Math.round(green.mean);
      const b = Math.round(blue.mean);
      dominantColor = `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  } catch {
    // Ignore color extraction errors; continue without blocking upload
  }

  // Return file info
  // For public files, omit the 'public/' prefix since Next.js serves them from root
  // For private files, keep the full path for API routing
  return {
    fileKey,
    ext,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
    dominantColor,
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
