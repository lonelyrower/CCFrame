import { join, isAbsolute, resolve } from 'path';
import type { StorageConfig, StorageProviderName } from './types';

let cachedConfig: StorageConfig | null = null;

const resolvePath = (input: string | undefined, fallback: string) => {
  if (!input) return fallback;
  return isAbsolute(input) ? input : resolve(process.cwd(), input);
};

const normalizeUrlPrefix = (prefix?: string) => {
  if (!prefix || prefix === '/') return '/';
  // Ensure trailing slash for predictable concatenation
  return prefix.endsWith('/') ? prefix : `${prefix}/`;
};

const loadConfig = (): StorageConfig => {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProviderName;

  if (provider === 'local') {
    const publicRoot = resolvePath(
      process.env.STORAGE_LOCAL_PUBLIC_ROOT,
      join(process.cwd(), 'public')
    );
    const privateRoot = resolvePath(
      process.env.STORAGE_LOCAL_PRIVATE_ROOT,
      join(process.cwd(), 'private')
    );
    const publicUrlPrefix = normalizeUrlPrefix(process.env.STORAGE_PUBLIC_URL_PREFIX);

    return {
      provider,
      local: {
        publicRoot,
        privateRoot,
        publicUrlPrefix,
      },
    };
  }

  // Placeholder for S3-compatible providers; validating inputs happens when instantiated.
  return {
    provider,
    s3: {
      bucket: process.env.STORAGE_S3_BUCKET || '',
      region: process.env.STORAGE_S3_REGION,
      endpoint: process.env.STORAGE_S3_ENDPOINT,
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
      publicUrlPrefix: normalizeUrlPrefix(process.env.STORAGE_PUBLIC_URL_PREFIX),
      forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE === 'true',
    },
  };
};

export const getStorageConfig = (): StorageConfig => {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
};

export const resetStorageConfigCache = () => {
  cachedConfig = null;
};
