const isCloudflareEnabledInternal = () =>
  process.env.NEXT_PUBLIC_DISABLE_CF !== 'true' && process.env.NODE_ENV === 'production';

export function isCloudflareEnabled(): boolean {
  return isCloudflareEnabledInternal();
}

/**
 * Generates Cloudflare Image URL with transformations
 * @param src - Source image path (e.g., "/uploads/original/2025/10/abc.jpg")
 * @param options - Transformation options
 * @returns Transformed URL with Cloudflare prefix
 */
export function cfImage(
  src: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'json';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  } = {}
): string {
  if (!isCloudflareEnabledInternal()) {
    return src;
  }

  const { width, quality = 85, format = 'auto', fit = 'scale-down' } = options;

  const params: string[] = [`format=${format}`, `quality=${quality}`];

  if (width) {
    params.push(`width=${width}`);
  }

  if (fit !== 'scale-down') {
    params.push(`fit=${fit}`);
  }

  return `/cdn-cgi/image/${params.join(',')}${src}`;
}

/**
 * Generates srcset for responsive images
 */
export function cfImageSrcSet(
  src: string,
  widths: number[],
  options: {
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  } = {}
): string {
  if (!isCloudflareEnabledInternal()) {
    return '';
  }

  return widths
    .map((width) => `${cfImage(src, { ...options, width })} ${width}w`)
    .join(', ');
}
