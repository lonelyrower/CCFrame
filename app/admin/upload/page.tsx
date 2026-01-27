'use client';

import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/admin/UploadZone';
import { Button } from '@/components/ui/Button';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = (photoIds: string[]) => {
    console.log('Upload complete:', photoIds);
    // Optionally redirect to library
    // router.push('/admin/library');
  };

  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <div className="inline-block mb-3">
                <span className="text-xs tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
                  上传
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
                上传照片
              </h1>
              <p className="text-stone-600 dark:text-stone-400 font-light">
                批量上传照片，支持进度跟踪和自动重试
              </p>
            </div>
            <Button onClick={() => router.push('/admin/library')} variant="secondary" className="w-full sm:w-auto">
              前往照片库
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-5 sm:p-8 mb-8">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </div>

        {/* Instructions */}
        <div className="p-6 bg-gradient-to-br from-[var(--ds-accent-5)] to-[var(--ds-accent-soft-5)] dark:from-[var(--ds-accent-10)] dark:to-[var(--ds-accent-soft-10)] rounded-3xl ring-1 ring-[color:var(--ds-accent-10)]">
          <h3 className="font-medium text-[color:var(--ds-accent)] mb-3 text-lg tracking-wide">
            上传提示
          </h3>
          <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-2 list-disc list-inside">
            <li>支持最多 4 个文件同时上传，加快处理速度</li>
            <li>上传失败时会自动重试最多 2 次</li>
            <li>单个文件最大 50MB</li>
            <li>支持格式：JPEG、PNG、WebP、HEIC</li>
            <li>照片默认设为公开（之后可以修改）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
