'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SearchIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  LoginIcon,
  MenuIcon,
  CloseIcon,
  LogoIcon,
} from '@/components/ui/Icons';

type TagSummary = {
  id: string;
  name: string;
  count: number;
};

type SeriesSuggestion = {
  id: string;
  slug: string;
  title: string;
  photoCount: number;
};

type TagsResponse = {
  tags?: TagSummary[];
};

type SeriesResponseItem = {
  id: string;
  slug: string;
  title: string;
  photoCount?: number | null;
};

type SeriesResponse = {
  series?: SeriesResponseItem[];
};

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [hotTags, setHotTags] = useState<TagSummary[]>([]);
  const [topSeries, setTopSeries] = useState<SeriesSuggestion[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const applyTheme = (darkMode: boolean) => {
      setIsDark(darkMode);
      document.documentElement.classList.toggle('dark', darkMode);
    };

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      applyTheme(storedTheme === 'dark');
      return;
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mediaQuery.matches);

    // Listen for changes only when following system preference
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme')) return;
      applyTheme(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Check login status
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setShowUserMenu(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const toggleSearch = () => {
    setShowSearch((value) => !value);
    setShowMobileNav(false);
    setShowUserMenu(false);
  };

  const toggleMobileNav = () => {
    setShowMobileNav((value) => !value);
    setShowSearch(false);
    setShowUserMenu(false);
  };

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    setShowMobileNav(false);
    setShowSearch(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Load suggestions (popular tags, series) when search panel opens
  useEffect(() => {
    if (!showSearch || loadingSuggest || (hotTags.length && topSeries.length)) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingSuggest(true);
        const [tagsRes, seriesRes] = await Promise.all([
          fetch('/api/tags'),
          fetch('/api/series'),
        ]);
        if (!cancelled) {
          if (tagsRes.ok) {
            const data = (await tagsRes.json()) as TagsResponse;
            const top = (data.tags ?? []).slice(0, 12);
            setHotTags(top);
          }
          if (seriesRes.ok) {
            const data = (await seriesRes.json()) as SeriesResponse;
            const list = (data.series ?? [])
              .sort((a, b) => (b.photoCount ?? 0) - (a.photoCount ?? 0))
              .slice(0, 6)
              .map((series) => ({
                id: series.id,
                slug: series.slug,
                title: series.title,
                photoCount: series.photoCount ?? 0,
              }));
            setTopSeries(list);
          }
        }
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoadingSuggest(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showSearch, loadingSuggest, hotTags.length, topSeries.length]);

  // Close on Escape when search is open
  useEffect(() => {
    if (!showSearch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSearch]);

  return (
    <header className="sticky top-0 z-50 relative bg-stone-50/95 dark:bg-neutral-950/95 backdrop-blur-2xl border-b border-stone-200/30 dark:border-neutral-800/30 pt-[env(safe-area-inset-top)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-20">
          {/* Logo - Fashion Editorial Style */}
          <Link href="/" className="group flex items-center space-x-2 touch-manipulation">
            <LogoIcon size={40} className="w-8 h-8 md:w-10 md:h-10 group-hover:scale-105 group-active:scale-95 transition-transform duration-300" />
            <span className="text-xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tighter group-hover:text-[color:var(--ds-accent)] transition-colors duration-300">
              CCFrame
            </span>
          </Link>

          {/* Navigation - Refined Typography */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              href="/photos"
              className={`group relative text-sm font-medium tracking-wide uppercase transition-all duration-300 ease-out ${
                isActive('/photos')
                  ? 'text-[color:var(--ds-accent)] after:w-full'
                  : 'text-stone-700 dark:text-stone-300 hover:text-[color:var(--ds-accent)]'
              } after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300`}
            >
              照片
            </Link>
            <Link
              href="/tags"
              className={`group relative text-sm font-medium tracking-wide uppercase transition-all duration-300 ease-out ${
                isActive('/tags')
                  ? 'text-[color:var(--ds-accent)] after:w-full'
                  : 'text-stone-700 dark:text-stone-300 hover:text-[color:var(--ds-accent)]'
              } after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300`}
            >
              标签
            </Link>
            <Link
              href="/series"
              className={`group relative text-sm font-medium tracking-wide uppercase transition-all duration-300 ease-out ${
                isActive('/series')
                  ? 'text-[color:var(--ds-accent)] after:w-full'
                  : 'text-stone-700 dark:text-stone-300 hover:text-[color:var(--ds-accent)]'
              } after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300`}
            >
              系列
            </Link>
          </div>

          {/* Search & Theme & User - Minimal Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleSearch}
              className="p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-stone-700 dark:text-stone-300 touch-manipulation"
              aria-label="Search"
            >
              <SearchIcon size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="group relative p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-stone-700 dark:text-stone-300 touch-manipulation overflow-hidden"
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
              title={isDark ? '浅色模式' : '深色模式'}
            >
              {/* 切换动画容器 */}
              <span className="relative block w-5 h-5">
                {/* 太阳图标 */}
                <span className={`absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`}>
                  <SunIcon size={20} />
                </span>
                {/* 月亮图标 */}
                <span className={`absolute inset-0 transition-all duration-300 ${isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
                  <MoonIcon size={20} />
                </span>
              </span>
            </button>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu((value) => !value);
                    setShowMobileNav(false);
                    setShowSearch(false);
                  }}
                  className="p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-stone-700 dark:text-stone-300 touch-manipulation"
                  aria-label="User menu"
                >
                  <UserIcon size={20} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-52 bg-stone-50/98 dark:bg-neutral-900/98 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 py-2 z-50 animate-fade-in-200">
                    <Link
                      href="/admin"
                      className="block px-5 py-3.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 active:bg-stone-300/60 dark:active:bg-neutral-700/60 transition-colors duration-150"
                      onClick={() => setShowUserMenu(false)}
                    >
                      管理后台
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3.5 text-sm font-medium text-[color:var(--ds-accent)] hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 active:bg-stone-300/60 dark:active:bg-neutral-700/60 transition-colors duration-150"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-stone-700 dark:text-stone-300 touch-manipulation"
                aria-label="Login"
              >
                <LoginIcon size={20} />
              </Link>
            )}
            <button
              onClick={toggleMobileNav}
              className="md:hidden p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-stone-700 dark:text-stone-300 touch-manipulation"
              aria-label={showMobileNav ? 'Close menu' : 'Open menu'}
              aria-expanded={showMobileNav}
              aria-controls="mobile-nav"
            >
              {showMobileNav ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>

        </div>
      </nav>

      {showMobileNav && (
        <div id="mobile-nav" className="md:hidden border-t border-stone-200/50 dark:border-neutral-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <div className="pt-3 space-y-2">
              <Link
                href="/photos"
                className={`block px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] ${
                  isActive('/photos')
                    ? 'bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] ring-1 ring-inset ring-[color:var(--ds-accent-20)]'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100/80 dark:hover:bg-neutral-900/60 hover:ring-1 hover:ring-inset hover:ring-stone-200/70 dark:hover:ring-neutral-800'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                照片
              </Link>
              <Link
                href="/tags"
                className={`block px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] ${
                  isActive('/tags')
                    ? 'bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] ring-1 ring-inset ring-[color:var(--ds-accent-20)]'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100/80 dark:hover:bg-neutral-900/60 hover:ring-1 hover:ring-inset hover:ring-stone-200/70 dark:hover:ring-neutral-800'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                标签
              </Link>
              <Link
                href="/series"
                className={`block px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] ${
                  isActive('/series')
                    ? 'bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] ring-1 ring-inset ring-[color:var(--ds-accent-20)]'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100/80 dark:hover:bg-neutral-900/60 hover:ring-1 hover:ring-inset hover:ring-stone-200/70 dark:hover:ring-neutral-800'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                系列
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Panel */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 pt-3 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl ring-1 ring-inset ring-stone-200/50 dark:ring-neutral-700/50 shadow-xl overflow-hidden">
              <div className="p-4 sm:p-5 md:p-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索照片、标签、相册..."
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-[color:var(--ds-accent-30)] focus:border-[color:var(--ds-accent)] transition-all duration-200"
                  autoFocus
                />
                <p className="mt-2 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  提示：输入标签名、照片标题或相册名称进行搜索
                </p>
              </div>

              {/* Suggestions */}
              <div className="border-t border-stone-200/50 dark:border-neutral-700/50 max-h-[60svh] overflow-y-auto md:max-h-none md:overflow-visible">
                <div className="p-4 sm:p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 推荐关键词 */}
                  <div>
                    <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">推荐关键词</h4>
                    <div className="flex flex-wrap gap-2">
                      {['人像', '风景', '街拍', '黑白', '旅行', '城市', '自然', '夜景'].map((k) => (
                        <button
                          key={k}
                          onClick={() => setSearchQuery(k)}
                          className="px-3 py-1.5 text-sm rounded-full ring-1 ring-inset ring-stone-200 dark:ring-neutral-700 bg-white dark:bg-neutral-800 hover:bg-[color:var(--ds-accent-10)] hover:ring-[color:var(--ds-accent-20)] text-stone-700 dark:text-stone-300 transition-colors duration-200"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 热门标签 */}
                  <div>
                    <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">热门标签</h4>
                    <div className="flex flex-wrap gap-2 min-h-[44px]" aria-busy={loadingSuggest}>
                      {hotTags.length === 0 ? (
                        <>
                          <span className="sr-only">{loadingSuggest ? '加载中…' : '暂无数据'}</span>
                          <div className="flex flex-wrap gap-2 w-full animate-pulse">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <span
                                key={i}
                                className="h-8 w-[4.5rem] rounded-full ring-1 ring-inset ring-stone-200 dark:ring-neutral-700 bg-stone-100 dark:bg-neutral-800"
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        hotTags.map((tag) => (
                          <Link
                            key={tag.id}
                            href={`/tags/${encodeURIComponent(tag.name)}`}
                            className="px-3 py-1.5 text-sm rounded-full ring-1 ring-inset ring-stone-200 dark:ring-neutral-700 bg-white dark:bg-neutral-800 hover:bg-[color:var(--ds-accent-10)] hover:ring-[color:var(--ds-accent-20)] text-stone-700 dark:text-stone-300 transition-colors duration-200"
                          >
                            {tag.name}
                            <span className="ml-1 text-xs text-stone-400 dark:text-stone-500">({tag.count})</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 系列推荐 */}
                  <div>
                    <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">系列推荐</h4>
                    <div className="grid grid-cols-1 gap-2 min-h-[116px]" aria-busy={loadingSuggest}>
                      {topSeries.length === 0 ? (
                        <div className="grid grid-cols-1 gap-2 animate-pulse">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-9 rounded-xl ring-1 ring-inset ring-stone-200 dark:ring-neutral-700 bg-stone-100 dark:bg-neutral-800"
                            />
                          ))}
                          <span className="sr-only">{loadingSuggest ? '加载中…' : '暂无数据'}</span>
                        </div>
                      ) : (
                        topSeries.map((s) => (
                          <Link
                            key={s.id}
                            href={`/series/${s.slug || s.id}`}
                            className="flex items-center justify-between px-3 py-2 rounded-xl ring-1 ring-inset ring-stone-200 dark:ring-neutral-700 bg-white dark:bg-neutral-800 hover:bg-[color:var(--ds-accent-10)] hover:ring-[color:var(--ds-accent-20)] transition-colors duration-200"
                          >
                            <span className="truncate text-sm text-stone-900 dark:text-stone-100">{s.title}</span>
                            <span className="ml-3 shrink-0 text-xs text-stone-400 dark:text-stone-500">{s.photoCount} 张</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
