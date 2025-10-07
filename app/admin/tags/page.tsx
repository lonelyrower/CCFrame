'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Tag {
  id: string;
  name: string;
  count: number;
}

export default function TagsManagementPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [fromTag, setFromTag] = useState('');
  const [toTag, setToTag] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      setTags(data.tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeTags = async () => {
    if (!fromTag || !toTag) {
      alert('请选择要合并的标签');
      return;
    }

    try {
      const response = await fetch('/api/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromTag, to: toTag }),
      });

      if (response.ok) {
        alert('标签合并成功');
        setShowMergeModal(false);
        setFromTag('');
        setToTag('');
        await loadTags();
      } else {
        const data = await response.json();
        alert(`合并失败: ${data.error}`);
      }
    } catch (error) {
      console.error('Error merging tags:', error);
      alert('合并失败');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">标签管理</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理和合并标签
          </p>
        </div>
        <Button onClick={() => setShowMergeModal(true)} variant="primary">
          合并标签
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">暂无标签</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标签名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次数
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tag.count} 张照片
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-2xl font-bold mb-6">合并标签</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  源标签（将被删除）
                </label>
                <select
                  value={fromTag}
                  onChange={(e) => setFromTag(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择标签</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name} ({tag.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  目标标签（保留）
                </label>
                <input
                  type="text"
                  value={toTag}
                  onChange={(e) => setToTag(e.target.value)}
                  placeholder="输入标签名（可新建）"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ 源标签的所有照片将重新标记为目标标签，源标签将被删除
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleMergeTags}
                variant="primary"
                className="flex-1"
                disabled={!fromTag || !toTag}
              >
                确认合并
              </Button>
              <Button
                onClick={() => {
                  setShowMergeModal(false);
                  setFromTag('');
                  setToTag('');
                }}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
