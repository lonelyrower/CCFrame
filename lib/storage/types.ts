export type StorageProviderName = 'local' | 's3';

export interface StorageConfig {
  provider: StorageProviderName;
  local?: {
    /**
     * Absolute or relative path (from project root) used for public assets.
     * Defaults to `<project-root>/public`.
     */
    publicRoot?: string;
    /**
     * Absolute or relative path (from project root) used for private assets.
     * Defaults to `<project-root>/private`.
     */
    privateRoot?: string;
    /**
     * Optional URL prefix for public assets (e.g. CDN origin).
     * Defaults to `/`.
     */
    publicUrlPrefix?: string;
  };
  s3?: {
    bucket: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    publicUrlPrefix?: string;
    forcePathStyle?: boolean;
  };
}

export interface PutObjectParams {
  key: string;
  body: Buffer;
  contentType?: string;
  isPublic?: boolean;
}

export interface PutObjectResult {
  /**
   * Key that should be stored alongside database records. For the local provider
   * this mirrors the input key for public files and prefixes it with `private/`
   * for private files.
   */
  storedKey: string;
  /**
   * Absolute path on disk (when applicable). Consumers can use this when they
   * need to perform follow-up processing without recalculating paths.
   */
  absolutePath?: string;
}

export interface DeleteObjectParams {
  key: string;
  isPublic?: boolean;
}

export interface SignedUrlOptions {
  expiresIn?: number;
  contentType?: string;
  isPublic?: boolean;
}

export interface SignedUrlResult {
  url: string;
  key: string;
  expiresAt: number;
}

export interface StorageProvider {
  readonly name: StorageProviderName;
  putObject(params: PutObjectParams): Promise<PutObjectResult>;
  deleteObject(params: DeleteObjectParams): Promise<void>;
  getPublicUrl?(key: string): string | null;
  getSignedUploadUrl?(key: string, options: SignedUrlOptions): Promise<SignedUrlResult>;
  resolveAbsolutePath?(key: string): string;
}
