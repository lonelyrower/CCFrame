'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DEFAULT_HOME_COPY } from '@/lib/constants';
import { DEFAULT_THEME_ID, THEME_PRESETS, ThemeId, resolveThemeId } from '@/lib/themes';

export default function SettingsPage() {
  const [homeCopy, setHomeCopy] = useState('');
  const [themeColor, setThemeColor] = useState('');
  const [themePreset, setThemePreset] = useState<ThemeId>(DEFAULT_THEME_ID);
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
      setThemePreset(resolveThemeId(data.themePreset, data.themeColor));
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
        body: JSON.stringify({
          homeCopy,
          themePreset,
          themeColor: themePreset === 'custom' ? themeColor || null : null,
        }),
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
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
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
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[color:var(--ds-accent)]" />
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
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
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
                  className="p-5 border-2 border-stone-200 dark:border-neutral-700 rounded-2xl hover:border-[color:var(--ds-accent)] cursor-pointer transition-all duration-300 hover:shadow-md"
                  onClick={() => setHomeCopy(value)}
                >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-stone-700 dark:text-stone-300 mb-1">
                        选项 {key}
                      </p>
                      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {value}
                      </p>
                    </div>
                    <button className="text-[color:var(--ds-accent)] hover:scale-110 transition-transform text-sm font-medium">
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
                <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-3">
                  主题选择
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {THEME_PRESETS.map((preset) => {
                    const selected = themePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setThemePreset(preset.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                          selected
                            ? 'border-[color:var(--ds-accent)] bg-[color:var(--ds-accent-5)] shadow-md'
                            : 'border-stone-200 dark:border-neutral-700 hover:border-[color:var(--ds-accent-30)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-stone-900 dark:text-stone-50">
                              {preset.label}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {preset.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10"
                              style={{ backgroundColor: preset.light.accent }}
                            />
                            <span
                              className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10"
                              style={{ backgroundColor: preset.light.luxury }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setThemePreset('custom')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                      themePreset === 'custom'
                        ? 'border-[color:var(--ds-accent)] bg-[color:var(--ds-accent-5)] shadow-md'
                        : 'border-stone-200 dark:border-neutral-700 hover:border-[color:var(--ds-accent-30)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-stone-900 dark:text-stone-50">Custom</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">Use a custom accent color</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-[color:var(--ds-accent)]" />
                        <span className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-[color:var(--ds-luxury)]" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
                  自定义主色 (仅 Custom 主题)
                </label>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 leading-relaxed">
                  仅在 Custom 主题下生效，留空则使用默认主色
                </p>
                <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${themePreset === 'custom' ? '' : 'opacity-50'}`}>
                  <label htmlFor="theme-color-picker" className="sr-only">选择主题色</label>
                  <input
                    id="theme-color-picker"
                    type="color"
                    value={themeColor || '#e63946'}
                    onChange={(e) => setThemeColor(e.target.value)}
                    title="选择主题色"
                    className="h-12 w-24 rounded-xl border-2 border-stone-200 dark:border-neutral-700 cursor-pointer"
                    disabled={themePreset !== 'custom'}
                  />
                  <label htmlFor="theme-color-text" className="sr-only">输入主题色代码</label>
                  <input
                    id="theme-color-text"
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    placeholder="#e63946"
                    className="flex-1 px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
                    disabled={themePreset !== 'custom'}
                  />
                  {themeColor && (
                    <Button
                      type="button"
                      onClick={() => setThemeColor('')}
                      variant="secondary"
                      size="sm"
                      disabled={themePreset !== 'custom'}
                    >
                      清除
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-5 border-2 border-stone-200 dark:border-neutral-700 rounded-2xl">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-50">自动主题色</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    从封面图自动提取主题色
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">已启用</div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-5 border-2 border-stone-200 dark:border-neutral-700 rounded-2xl">
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
