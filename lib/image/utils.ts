import { cfImage } from '@/lib/cf-image';

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
