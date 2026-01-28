'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { DEFAULT_HOME_COPY } from '@/lib/constants';
import { DEFAULT_THEME_ID, THEME_PRESETS, ThemeId, resolveThemeId, themeToCssVars } from '@/lib/themes';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsPage() {
  const [homeCopy, setHomeCopy] = useState('');
  const [themeColor, setThemeColor] = useState('');
  const [themePreset, setThemePreset] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 实时预览主题
  const applyThemePreview = useCallback((preset: ThemeId, color: string) => {
    const vars = themeToCssVars(preset, preset === 'custom' ? color : null);
    const html = document.documentElement;
    html.dataset.theme = preset;
    Object.entries(vars).forEach(([key, value]) => {
      html.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  // 主题变化时实时预览
  useEffect(() => {
    if (!isLoading) {
      applyThemePreview(themePreset, themeColor);
    }
  }, [themePreset, themeColor, isLoading, applyThemePreview]);

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
          <span className="text-xs tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
            配置
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">网站设置</h1>
        <p className="text-[color:var(--ds-muted)] font-light">
          配置网站显示内容
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8"
            >
              <Skeleton className="h-6 w-40 rounded-lg mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
              <div className="flex gap-3 mt-6">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Homepage Copy */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">首页文案</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-2">
                  当前文案
                </label>
                <textarea
                  value={homeCopy}
                  onChange={(e) => setHomeCopy(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-[color:var(--ds-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
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
                      <p className="font-medium text-[color:var(--ds-muted)] mb-1">
                        选项 {key}
                      </p>
                      <p className="text-sm text-[color:var(--ds-muted)] leading-relaxed">
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
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">主题设置</h2>
            <p className="text-sm text-[color:var(--ds-muted)] mb-6">选择一个主题，更改将实时预览</p>
            
            <div className="space-y-6">
              {/* Theme Preview Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 dark:from-neutral-800 dark:to-neutral-900 ring-1 ring-stone-200/50 dark:ring-neutral-700/50">
                <p className="text-xs tracking-[0.2em] font-medium text-[color:var(--ds-accent)] mb-3">预览</p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="h-10 w-10 rounded-full bg-[color:var(--ds-accent)] ring-2 ring-white dark:ring-neutral-900" />
                    <div className="h-10 w-10 rounded-full bg-[color:var(--ds-accent-soft)] ring-2 ring-white dark:ring-neutral-900" />
                    <div className="h-10 w-10 rounded-full bg-[color:var(--ds-accent-strong)] ring-2 ring-white dark:ring-neutral-900" />
                    <div className="h-10 w-10 rounded-full bg-[color:var(--ds-luxury)] ring-2 ring-white dark:ring-neutral-900" />
                  </div>
                  <div className="flex-1">
                    <p className="font-serif font-semibold text-stone-900 dark:text-stone-50">
                      {THEME_PRESETS.find(p => p.id === themePreset)?.label || 'Custom'}
                    </p>
                    <p className="text-xs text-[color:var(--ds-muted-soft)]">
                      {THEME_PRESETS.find(p => p.id === themePreset)?.description || '自定义主题色'}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" className="shrink-0">
                    示例按钮
                  </Button>
                </div>
              </div>

              {/* Theme Grid */}
              <div>
                <label className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-3">
                  主题选择 <span className="text-[color:var(--ds-muted-soft)] font-normal">({THEME_PRESETS.length} 个预设)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {THEME_PRESETS.map((preset) => {
                    const selected = themePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setThemePreset(preset.id)}
                        className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                          selected
                            ? 'border-[color:var(--ds-accent)] bg-[color:var(--ds-accent-5)] shadow-lg scale-[1.02]'
                            : 'border-stone-200 dark:border-neutral-700 hover:border-[color:var(--ds-accent-30)] hover:shadow-md'
                        }`}
                      >
                        {/* Color Swatches */}
                        <div className="flex gap-1.5 mb-3">
                          <span
                            className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: preset.light.accent }}
                          />
                          <span
                            className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: preset.light.accentSoft }}
                          />
                          <span
                            className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: preset.light.luxury }}
                          />
                        </div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-0.5">
                          {preset.label}
                        </p>
                        <p className="text-xs text-[color:var(--ds-muted-soft)] line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                        {/* Selected Indicator */}
                        {selected && (
                          <div className="absolute top-2 right-2">
                            <svg className="h-5 w-5 text-[color:var(--ds-accent)]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {/* Custom Theme Option */}
                  <button
                    type="button"
                    onClick={() => setThemePreset('custom')}
                    className={`group relative text-left p-4 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                      themePreset === 'custom'
                        ? 'border-[color:var(--ds-accent)] bg-[color:var(--ds-accent-5)] shadow-lg scale-[1.02]'
                        : 'border-stone-300 dark:border-neutral-600 hover:border-[color:var(--ds-accent-30)] hover:shadow-md'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-3">
                      <span className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500" />
                      <span className="h-6 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center bg-stone-100 dark:bg-neutral-700">
                        <svg className="h-3 w-3 text-[color:var(--ds-muted-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-0.5">自定义</p>
                    <p className="text-xs text-[color:var(--ds-muted-soft)] line-clamp-2 leading-relaxed">自定义专属颜色</p>
                    {themePreset === 'custom' && (
                      <div className="absolute top-2 right-2">
                        <svg className="h-5 w-5 text-[color:var(--ds-accent)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Custom Color Picker */}
              {themePreset === 'custom' && (
                <div className="p-5 rounded-2xl bg-stone-50 dark:bg-neutral-800/50 ring-1 ring-stone-200/50 dark:ring-neutral-700/50 animate-fade-in-200">
                  <label className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-3">
                    自定义主色
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label htmlFor="theme-color-picker" className="sr-only">选择主题色</label>
                    <input
                      id="theme-color-picker"
                      type="color"
                      value={themeColor || '#e63946'}
                      onChange={(e) => setThemeColor(e.target.value)}
                      title="选择主题色"
                      className="h-12 w-20 rounded-xl border-2 border-stone-200 dark:border-neutral-700 cursor-pointer"
                    />
                    <label htmlFor="theme-color-text" className="sr-only">输入主题色代码</label>
                    <input
                      id="theme-color-text"
                      type="text"
                      value={themeColor || '#e63946'}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#e63946"
                      className="flex-1 px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-[color:var(--ds-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300 font-mono"
                    />
                    {themeColor && (
                      <Button
                        type="button"
                        onClick={() => setThemeColor('')}
                        variant="secondary"
                        size="sm"
                      >
                        重置
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  variant="primary"
                  isLoading={isSaving}
                >
                  保存主题
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
