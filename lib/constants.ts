/**
 * Default homepage copy options
 */
export const DEFAULT_HOME_COPY = {
  A: '光与影在这里停留，衣纹与风声也一并被收起。翻页,无言的片段自会开口。',
  B: '镜头写下风格，色彩安放情绪。请随意停留，也欢迎继续向前。',
  C: '有些画面是瞬间，有些是心情；一起组成了此刻的样子。',
};

export const DEFAULT_HOME_COPY_SELECTED = DEFAULT_HOME_COPY.B;

/**
 * Pagination defaults
 */
export const PHOTOS_PER_PAGE = 36;
export const ALBUMS_PER_PAGE = 24;
export const SERIES_PER_PAGE = 12;

/**
 * Upload limits
 */
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_CONCURRENT_UPLOADS = 4;
export const MAX_UPLOAD_RETRIES = 2;

/**
 * Rate limiting
 */
export const RATE_LIMIT_UPLOAD = {
  max: 30,
  windowMs: 60 * 1000, // 1 minute
};

export const RATE_LIMIT_AUTH = {
  max: 10,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Cache control headers
 */
export const CACHE_CONTROL = {
  PUBLIC_LONG: 'public, s-maxage=300, stale-while-revalidate=600',
  PUBLIC_SHORT: 'public, s-maxage=60, stale-while-revalidate=120',
  PRIVATE: 'private, no-cache, no-store, must-revalidate',
  NO_STORE: 'no-store',
};

/**
 * Image transformation presets
 */
export const IMAGE_WIDTHS = {
  THUMBNAIL: 400,
  SMALL: 640,
  MEDIUM: 960,
  LARGE: 1280,
  XLARGE: 1920,
};
