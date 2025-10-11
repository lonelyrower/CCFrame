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
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-block mb-3">
                <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
                  Upload
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
                Upload Photos
              </h1>
              <p className="text-stone-600 dark:text-stone-400 font-light">
                Batch upload photos with progress tracking and automatic retry
              </p>
            </div>
            <Button onClick={() => router.push('/admin/library')} variant="secondary">
              Go to Library
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8 mb-8">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </div>

        {/* Instructions */}
        <div className="p-6 bg-gradient-to-br from-[#e63946]/5 to-[#ff6b7a]/5 dark:from-[#e63946]/10 dark:to-[#ff6b7a]/10 rounded-3xl ring-1 ring-[#e63946]/10 dark:ring-[#ff6b7a]/10">
          <h3 className="font-medium text-[#e63946] dark:text-[#ff6b7a] mb-3 text-lg tracking-wide">
            Upload Tips
          </h3>
          <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-2 list-disc list-inside">
            <li>Upload up to 4 files concurrently for faster processing</li>
            <li>Failed uploads will automatically retry up to 2 times</li>
            <li>Maximum file size: 50MB per image</li>
            <li>Supported formats: JPEG, PNG, WebP, HEIC</li>
            <li>Photos are set to public by default (you can change this later)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
