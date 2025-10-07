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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">
                Upload Photos
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Batch upload photos with progress tracking and automatic retry
              </p>
            </div>
            <Button onClick={() => router.push('/admin/library')} variant="ghost">
              Go to Library
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Upload Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
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
