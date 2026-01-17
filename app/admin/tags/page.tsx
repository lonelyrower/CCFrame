'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

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
          <div className="inline-block mb-3">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
              Management
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
            标签管理
          </h1>
          <p className="text-stone-600 dark:text-stone-400 font-light">
            管理和合并标签
          </p>
        </div>
        <Button onClick={() => setShowMergeModal(true)} variant="primary">
          合并标签
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[color:var(--ds-accent)]" />
            <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
              Loading
            </span>
          </div>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-stone-600 dark:text-stone-400 font-light">暂无标签</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 overflow-hidden">
          <table className="min-w-full divide-y divide-stone-200 dark:divide-neutral-800">
            <thead className="bg-stone-50 dark:bg-neutral-950">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  标签名称
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  使用次数
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-neutral-800">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-stone-600 dark:text-stone-400">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 max-w-md w-full p-8">
            <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">合并标签</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="from-tag-select" className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
                  源标签（将被删除）
                </label>
                <select
                  id="from-tag-select"
                  value={fromTag}
                  onChange={(e) => setFromTag(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
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
                <label htmlFor="to-tag-input" className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
                  目标标签（保留）
                </label>
                <input
                  id="to-tag-input"
                  type="text"
                  value={toTag}
                  onChange={(e) => setToTag(e.target.value)}
                  placeholder="输入标签名（可新建）"
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
                />
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                  ⚠️ 源标签的所有照片将重新标记为目标标签，源标签将被删除
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
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
                variant="secondary"
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
