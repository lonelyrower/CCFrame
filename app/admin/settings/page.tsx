'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DEFAULT_HOME_COPY } from '@/lib/constants';

export default function SettingsPage() {
  const [homeCopy, setHomeCopy] = useState('');
  const [themeColor, setThemeColor] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/site-copy');
      const data = await response.json();
      setHomeCopy(data.homeCopy);
      setThemeColor(data.themeColor || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/site-copy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeCopy, themeColor: themeColor || null }),
      });
      alert('保存成功！');
    } catch (error) {
      console.error('Error saving:', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('确定恢复默认文案？')) return;

    try {
      await fetch('/api/site-copy/reset', { method: 'POST' });
      await loadSettings();
      alert('已恢复默认文案');
    } catch (error) {
      console.error('Error resetting:', error);
      alert('操作失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold">网站设置</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          配置网站显示内容
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Homepage Copy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">首页文案</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  当前文案
                </label>
                <textarea
                  value={homeCopy}
                  onChange={(e) => setHomeCopy(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="输入首页显示的文案..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  variant="primary"
                  isLoading={isSaving}
                >
                  保存文案
                </Button>
                <Button onClick={handleReset} variant="ghost">
                  恢复默认
                </Button>
              </div>
            </div>
          </div>

          {/* Default Copy Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">默认文案选项</h2>
            <div className="space-y-3">
              {Object.entries(DEFAULT_HOME_COPY).map(([key, value]) => (
                <div
                  key={key}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 cursor-pointer"
                  onClick={() => setHomeCopy(value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                        选项 {key}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {value}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      使用
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">主题设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  主题色覆盖 (可选)
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  设置自定义主题色，留空则使用自动提取的主题色
                </p>
                <div className="flex gap-3 items-center">
                  <label htmlFor="theme-color-picker" className="sr-only">选择主题色</label>
                  <input
                    id="theme-color-picker"
                    type="color"
                    value={themeColor || '#3b82f6'}
                    onChange={(e) => setThemeColor(e.target.value)}
                    title="选择主题色"
                    className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <label htmlFor="theme-color-text" className="sr-only">输入主题色代码</label>
                  <input
                    id="theme-color-text"
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  {themeColor && (
                    <Button
                      type="button"
                      onClick={() => setThemeColor('')}
                      variant="ghost"
                      size="sm"
                    >
                      清除
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">自动主题色</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    从封面图自动提取主题色
                  </p>
                </div>
                <div className="text-green-600">已启用</div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">深浅色模式</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    跟随系统设置 + 手动切换
                  </p>
                </div>
                <div className="text-green-600">已启用</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
