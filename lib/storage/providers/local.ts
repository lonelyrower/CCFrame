import { dirname, join } from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import type {
  DeleteObjectParams,
  PutObjectParams,
  PutObjectResult,
  SignedUrlOptions,
  SignedUrlResult,
  StorageProvider,
} from '../types';
import type { StorageConfig } from '../types';

const stripLeadingSlash = (value: string) => value.replace(/^\/+/, '');

const inferVisibility = (key: string): { isPublic: boolean; relativeKey: string } => {
  if (key.startsWith('private/')) {
    return { isPublic: false, relativeKey: key.replace(/^private\//, '') };
  }
  if (key.startsWith('public/')) {
    return { isPublic: true, relativeKey: key.replace(/^public\//, '') };
  }
  return { isPublic: true, relativeKey: key };
};

export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local' as const;
  private publicRoot: string;
  private privateRoot: string;
  private publicUrlPrefix: string;

  constructor(config: StorageConfig['local']) {
    if (!config) {
      throw new Error('Missing local storage configuration');
    }

    this.publicRoot = config.publicRoot!;
    this.privateRoot = config.privateRoot!;
    this.publicUrlPrefix = config.publicUrlPrefix || '/';
  }

  private async ensureDir(path: string) {
    if (!existsSync(path)) {
      await mkdir(path, { recursive: true });
    }
  }

  async putObject(params: PutObjectParams): Promise<PutObjectResult> {
    const isPublic = params.isPublic !== false;
    const relativeKey = stripLeadingSlash(params.key);
    const root = isPublic ? this.publicRoot : this.privateRoot;
    const absolutePath = join(root, relativeKey);

    await this.ensureDir(dirname(absolutePath));
    await writeFile(absolutePath, params.body);

    const storedKey = isPublic ? relativeKey : `private/${relativeKey}`;

    return {
      storedKey,
      absolutePath,
    };
  }

  async deleteObject(params: DeleteObjectParams): Promise<void> {
    const inferred = inferVisibility(params.key);
    const isPublic =
      typeof params.isPublic === 'boolean' ? params.isPublic : inferred.isPublic;
    const root = isPublic ? this.publicRoot : this.privateRoot;
    const absolutePath = join(root, inferred.relativeKey);

    try {
      await unlink(absolutePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }

  getPublicUrl(key: string): string | null {
    const inferred = inferVisibility(key);
    if (!inferred.isPublic) return null;
    const prefix = this.publicUrlPrefix;
    const normalizedPrefix = prefix === '/' ? '' : prefix.replace(/\/+$/, '');
    return `${normalizedPrefix}/${stripLeadingSlash(inferred.relativeKey)}`;
  }

  resolveAbsolutePath(key: string): string {
    const inferred = inferVisibility(key);
    const root = inferred.isPublic ? this.publicRoot : this.privateRoot;
    return join(root, inferred.relativeKey);
  }

  async getSignedUploadUrl(
    _key: string,
    _options: SignedUrlOptions
  ): Promise<SignedUrlResult> {
    throw new Error('Signed uploads are not supported for the local storage provider');
  }
}
