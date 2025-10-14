import { getStorageConfig } from './config';
import { LocalStorageProvider } from './providers/local';
import type { StorageProvider } from './types';

let cachedProvider: StorageProvider | null = null;

const createProvider = (): StorageProvider => {
  const config = getStorageConfig();

  switch (config.provider) {
    case 'local':
      return new LocalStorageProvider(config.local);
    default:
      throw new Error(`Storage provider "${config.provider}" is not supported yet`);
  }
};

export const getStorageProvider = (): StorageProvider => {
  if (!cachedProvider) {
    cachedProvider = createProvider();
  }
  return cachedProvider;
};

export const resetStorageProvider = () => {
  cachedProvider = null;
};
