'use client';

import { useEffect } from 'react';

export function AdminThemeSync() {
  useEffect(() => {
    const applyTheme = (darkMode: boolean) => {
      document.documentElement.classList.toggle('dark', darkMode);
    };

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      applyTheme(storedTheme === 'dark');
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      if (localStorage.getItem('theme')) return;
      applyTheme(event.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return null;
}
