'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hotTags, setHotTags] = useState<{ id: string; name: string; count: number }[]>([]);
  const [topSeries, setTopSeries] = useState<
    { id: string; title: string; photoCount: number }[]
  >([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
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

  const isActive = (path: string) => pathname === path;

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
            const data = await tagsRes.json();
            const top = (data.tags || []).slice(0, 12);
            setHotTags(top);
          }
          if (seriesRes.ok) {
            const data = await seriesRes.json();
            const list = (data.series || [])
              .sort((a: any, b: any) => (b.photoCount || 0) - (a.photoCount || 0))
              .slice(0, 6)
              .map((s: any) => ({ id: s.id, title: s.title, photoCount: s.photoCount }));
            setTopSeries(list);
          }
        }
      } catch (e) {
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
    <header className="sticky top-0 z-50 bg-stone-50/70 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-stone-200/50 dark:border-neutral-800/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Fashion Editorial Style */}
          <Link href="/" className="group flex items-center space-x-3">
            <span className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tighter group-hover:text-[#e63946] dark:group-hover:text-[#ff6b7a] transition-colors duration-300">
              CCFrame
            </span>
          </Link>

          {/* Navigation - Refined Typography */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              href="/photos"
              className={`group relative text-sm font-medium tracking-wide uppercase transition-all duration-300 ease-out ${
                isActive('/photos')
                  ? 'text-[#e63946] dark:text-[#ff6b7a] after:w-full'
                  : 'text-stone-700 dark:text-stone-300 hover:text-[#e63946] dark:hover:text-[#ff6b7a]'
              } after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300`}
            >
              照片
            </Link>
            <Link
              href="/tags"
              className={`group relative text-sm font-medium tracking-wide uppercase transition-all duration-300 ease-out ${
                isActive('/tags')
                  ? 'text-[#e63946] dark:text-[#ff6b7a] after:w-full'
                  : 'text-stone-700 dark:text-stone-300 hover:text-[#e63946] dark:hover:text-[#ff6b7a]'
              } after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300`}
            >
              标签
            </Link>
            <Link
              href="/series"
              className={`group relative text-sm font-medium tracking-wide uppercase transition-all duration-300 ease-out ${
                isActive('/series')
                  ? 'text-[#e63946] dark:text-[#ff6b7a] after:w-full'
                  : 'text-stone-700 dark:text-stone-300 hover:text-[#e63946] dark:hover:text-[#ff6b7a]'
              } after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300`}
            >
              系列
            </Link>
          </div>

          {/* Search & Theme & User - Minimal Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-300 ease-out hover:scale-110 active:scale-95 text-stone-700 dark:text-stone-300"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-300 ease-out hover:scale-110 active:scale-95 text-stone-700 dark:text-stone-300"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-300 ease-out hover:scale-110 active:scale-95 text-stone-700 dark:text-stone-300"
                  aria-label="User menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-52 bg-stone-50/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 py-2 z-50 animate-fade-in-200">
                    <Link
                      href="/admin"
                      className="block px-5 py-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      管理后台
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3 text-sm font-medium text-[#e63946] dark:text-[#ff6b7a] hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-colors duration-200"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="p-2.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-neutral-800/60 transition-all duration-300 ease-out hover:scale-110 active:scale-95 text-stone-700 dark:text-stone-300"
                aria-label="Login"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            )}
          </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 space-y-2">
          <Link
            href="/photos"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] ${
              isActive('/photos')
                ? 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-black/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-white/10'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:ring-1 hover:ring-inset hover:ring-black/10 dark:hover:ring-white/10'
            }`}
          >
            照片
          </Link>
          <Link
            href="/tags"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] ${
              isActive('/tags')
                ? 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-black/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-white/10'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:ring-1 hover:ring-inset hover:ring-black/10 dark:hover:ring-white/10'
            }`}
          >
            标签
          </Link>
          <Link
            href="/series"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] ${
              isActive('/series')
                ? 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-black/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-white/10'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:ring-1 hover:ring-inset hover:ring-black/10 dark:hover:ring-white/10'
            }`}
          >
            系列
          </Link>
        </div>
        </div>
      </nav>

      {/* Search Panel */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl ring-1 ring-inset ring-black/10 dark:ring-white/10 shadow-lg overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/60 dark:before:bg-white/10 before:pointer-events-none">
              <div className="p-4 sm:p-5 md:p-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索照片、标签、相册..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  提示：输入标签名、照片标题或相册名称进行搜索
                </p>
              </div>

              {/* Suggestions */}
              <div className="border-t border-gray-200/80 dark:border-white/10">
                <div className="p-4 sm:p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 推荐关键词 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">推荐关键词</h4>
                    <div className="flex flex-wrap gap-2">
                      {['人像', '风景', '街拍', '黑白', '旅行', '城市', '自然', '夜景'].map((k) => (
                        <button
                          key={k}
                          onClick={() => setSearchQuery(k)}
                          className="px-3 py-1.5 text-sm rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 热门标签 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">热门标签</h4>
                    <div className="flex flex-wrap gap-2 min-h-[44px]" aria-busy={loadingSuggest}>
                      {hotTags.length === 0 ? (
                        <>
                          <span className="sr-only">{loadingSuggest ? '加载中…' : '暂无数据'}</span>
                          <div className="flex flex-wrap gap-2 w-full animate-pulse">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <span
                                key={i}
                                className="h-8 w-[4.5rem] rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 bg-gray-200/80 dark:bg-white/10"
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        hotTags.map((tag) => (
                          <Link
                            key={tag.id}
                            href={`/tags/${encodeURIComponent(tag.name)}`}
                            className="px-3 py-1.5 text-sm rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            {tag.name}
                            <span className="ml-1 text-xs text-gray-500">({tag.count})</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 系列推荐 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">系列推荐</h4>
                    <div className="grid grid-cols-1 gap-2 min-h-[116px]" aria-busy={loadingSuggest}>
                      {topSeries.length === 0 ? (
                        <div className="grid grid-cols-1 gap-2 animate-pulse">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-9 rounded-lg ring-1 ring-inset ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-white/10"
                            />
                          ))}
                          <span className="sr-only">{loadingSuggest ? '加载中…' : '暂无数据'}</span>
                        </div>
                      ) : (
                        topSeries.map((s) => (
                          <Link
                            key={s.id}
                            href={`/series/${s.id}`}
                            className="flex items-center justify-between px-3 py-2 rounded-lg ring-1 ring-inset ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <span className="truncate text-sm text-gray-900 dark:text-gray-100">{s.title}</span>
                            <span className="ml-3 shrink-0 text-xs text-gray-500">{s.photoCount} 张</span>
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
