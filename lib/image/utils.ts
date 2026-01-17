import { cfImage, cfImageSrcSet, isCloudflareEnabled } from '@/lib/cf-image';
import { IMAGE_WIDTHS } from '@/lib/constants';

const DEFAULT_SRCSET_WIDTHS = [
  IMAGE_WIDTHS.THUMBNAIL,
  IMAGE_WIDTHS.SMALL,
  IMAGE_WIDTHS.MEDIUM,
  IMAGE_WIDTHS.LARGE,
  IMAGE_WIDTHS.XLARGE,
];

/**
 * Generate image URL based on visibility and fileKey
 * - Public photos: use Cloudflare CDN with transformations
 * - Private photos: use API route for authenticated access
 */
export function getImageUrl(
  fileKey: string,
  isPublic?: boolean,
  options: {
    width?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'json';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  } = {}
): string {
  // 优先根据 fileKey 前缀识别可见性，避免 isPublic 误传导致走错路径
  const isPrivateByKey = fileKey.startsWith('private/');
  const shouldUsePrivate = isPrivateByKey || isPublic === false;

  if (shouldUsePrivate) {
    // 私密图：经受保护的 API 路由返回
    return `/api/image/${fileKey}`;
  }

  // 公开图：走 Cloudflare 变换
  const src = fileKey.startsWith('/') ? fileKey : `/${fileKey}`;
  return cfImage(src, options);
}

/**
 * Generate responsive srcset for public images (Cloudflare only).
 */
export function getImageSrcSet(
  fileKey: string,
  isPublic?: boolean,
  widths: number[] = DEFAULT_SRCSET_WIDTHS,
  options: {
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  } = {}
): string | undefined {
  const isPrivateByKey = fileKey.startsWith('private/');
  const shouldUsePrivate = isPrivateByKey || isPublic === false;

  if (shouldUsePrivate || !isCloudflareEnabled()) {
    return undefined;
  }

  const src = fileKey.startsWith('/') ? fileKey : `/${fileKey}`;
  const srcSet = cfImageSrcSet(src, widths, options);
  return srcSet || undefined;
}
