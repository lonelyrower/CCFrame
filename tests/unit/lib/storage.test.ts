import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('storage manager', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupMocks = () => {
    vi.doMock('@/lib/storage/config', () => ({
      getStorageConfig: vi.fn(() => ({
        provider: 'local',
        local: {
          publicRoot: './public/uploads',
          privateRoot: './private/uploads',
          publicUrlPrefix: '/',
        },
      })),
    }));

    vi.doMock('fs/promises', () => ({
      default: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        unlink: vi.fn().mockResolvedValue(undefined),
      },
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      unlink: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('fs', () => ({
      default: {
        existsSync: vi.fn().mockReturnValue(true),
      },
      existsSync: vi.fn().mockReturnValue(true),
    }));
  };

  it('should export getStorageProvider function', async () => {
    setupMocks();
    const { getStorageProvider } = await import('@/lib/storage/manager');
    expect(typeof getStorageProvider).toBe('function');
  });

  it('should return a local storage provider', async () => {
    setupMocks();
    const { getStorageProvider, resetStorageProvider } = await import('@/lib/storage/manager');
    resetStorageProvider();
    
    const provider = getStorageProvider();
    expect(provider).toBeDefined();
    expect(provider.name).toBe('local');
  });

  it('should have required methods on provider', async () => {
    setupMocks();
    const { getStorageProvider, resetStorageProvider } = await import('@/lib/storage/manager');
    resetStorageProvider();
    
    const provider = getStorageProvider();
    expect(typeof provider.putObject).toBe('function');
    expect(typeof provider.deleteObject).toBe('function');
    expect(typeof provider.getPublicUrl).toBe('function');
  });

  it('should cache provider instance', async () => {
    setupMocks();
    const { getStorageProvider, resetStorageProvider } = await import('@/lib/storage/manager');
    resetStorageProvider();
    
    const provider1 = getStorageProvider();
    const provider2 = getStorageProvider();
    expect(provider1).toBe(provider2);
  });
});
