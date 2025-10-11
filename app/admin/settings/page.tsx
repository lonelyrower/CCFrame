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
        <div className="inline-block mb-3">
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
            Configuration
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">网站设置</h1>
        <p className="text-stone-600 dark:text-stone-400 font-light">
          配置网站显示内容
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[#e63946] dark:border-t-[#ff6b7a]" />
            <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
              Loading
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Homepage Copy */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">首页文案</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
                  当前文案
                </label>
                <textarea
                  value={homeCopy}
                  onChange={(e) => setHomeCopy(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a] transition-all duration-300"
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
                <Button onClick={handleReset} variant="secondary">
                  恢复默认
                </Button>
              </div>
            </div>
          </div>

          {/* Default Copy Options */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">默认文案选项</h2>
            <div className="space-y-3">
              {Object.entries(DEFAULT_HOME_COPY).map(([key, value]) => (
                <div
                  key={key}
                  className="p-5 border-2 border-stone-200 dark:border-neutral-700 rounded-2xl hover:border-[#e63946] dark:hover:border-[#ff6b7a] cursor-pointer transition-all duration-300 hover:shadow-md"
                  onClick={() => setHomeCopy(value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-700 dark:text-stone-300 mb-1">
                        选项 {key}
                      </p>
                      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {value}
                      </p>
                    </div>
                    <button className="text-[#e63946] dark:text-[#ff6b7a] hover:scale-110 transition-transform text-sm font-medium">
                      使用
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">主题设置</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
                  主题色覆盖 (可选)
                </label>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 leading-relaxed">
                  设置自定义主题色，留空则使用自动提取的主题色
                </p>
                <div className="flex gap-3 items-center">
                  <label htmlFor="theme-color-picker" className="sr-only">选择主题色</label>
                  <input
                    id="theme-color-picker"
                    type="color"
                    value={themeColor || '#e63946'}
                    onChange={(e) => setThemeColor(e.target.value)}
                    title="选择主题色"
                    className="h-12 w-24 rounded-xl border-2 border-stone-200 dark:border-neutral-700 cursor-pointer"
                  />
                  <label htmlFor="theme-color-text" className="sr-only">输入主题色代码</label>
                  <input
                    id="theme-color-text"
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    placeholder="#e63946"
                    className="flex-1 px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a] transition-all duration-300"
                  />
                  {themeColor && (
                    <Button
                      type="button"
                      onClick={() => setThemeColor('')}
                      variant="secondary"
                      size="sm"
                    >
                      清除
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-5 border-2 border-stone-200 dark:border-neutral-700 rounded-2xl">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-50">自动主题色</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    从封面图自动提取主题色
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">已启用</div>
              </div>

              <div className="flex items-center justify-between p-5 border-2 border-stone-200 dark:border-neutral-700 rounded-2xl">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-50">深浅色模式</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    跟随系统设置 + 手动切换
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">已启用</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
