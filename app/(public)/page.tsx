'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image/utils';
import { cfImage } from '@/lib/cf-image';
import { extractDominantColor, rgbToHsl } from '@/lib/theme-color';
import { DEFAULT_HOME_COPY_SELECTED } from '@/lib/constants';

interface HeroPhoto {
  id: string;
  fileKey: string;
  title: string | null;
  isPublic: boolean;
  dominantColor: string | null;
}

export default function HomePage() {
  const isLightHex = (hex?: string | null) => {
    if (!hex) return false;
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!m) return false;
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    const [, , l] = rgbToHsl(r, g, b);
    return l >= 70; // treat as light if lightness >= 70%
  };
  const [heroPhoto, setHeroPhoto] = useState<HeroPhoto | null>(null);
  const [homeCopy, setHomeCopy] = useState<string>(DEFAULT_HOME_COPY_SELECTED);
  const [themeColor, setThemeColor] = useState<string | null>(null);

  useEffect(() => {
    loadHomePage();
  }, []);

  const loadHomePage = async () => {
    try {
      // Load hero photo (first public photo)
      const photosRes = await fetch('/api/photos?isPublic=true&limit=1');
      let currentPhoto: HeroPhoto | null = null;

      if (photosRes.ok) {
        const photosData = await photosRes.json();

        if (photosData.photos && photosData.photos.length > 0) {
          const photo = photosData.photos[0];
          currentPhoto = photo;
          setHeroPhoto(photo);

          // Extract and save dominant color if not already saved
          if (!photo.dominantColor) {
            const imageUrl = cfImage(`/${photo.fileKey}`, { width: 800 });
            try {
              const dominantColor = await extractDominantColor(imageUrl);
              // 仅在前端应用主题色；持久化由服务端懒加载/上传时完成
              photo.dominantColor = dominantColor;
              currentPhoto = photo;
            } catch (error) {
              console.error('Color extraction failed:', error);
            }
          }
        }
      }

      // Load site copy and theme color
      const copyRes = await fetch('/api/site-copy');
      if (copyRes.ok) {
        const copyData = await copyRes.json();
        if (copyData.homeCopy) {
          setHomeCopy(copyData.homeCopy);
        }
        // Apply theme color: priority is themeColor override > photo dominantColor
        if (copyData.themeColor) {
          setThemeColor(copyData.themeColor);
        } else if (currentPhoto?.dominantColor) {
          setThemeColor(currentPhoto.dominantColor);
        }
      }
    } catch (error) {
      console.error('Error loading homepage:', error);
    }
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        {heroPhoto && (
          <div className="absolute inset-0">
            <img
              src={getImageUrl(heroPhoto.fileKey, heroPhoto.isPublic, { width: 1920, quality: 90 })}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
            {/* Subtle grain/texture overlay (desktop only, lower opacity to avoid snow on dark covers) */}
            <div className="hidden md:block absolute inset-0 bg-noise opacity-[0.05] mix-blend-soft-light pointer-events-none" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 animate-fade-in tracking-tight md:tracking-normal leading-tight"
            style={{ animationDelay: '40ms' }}
          >
            CCFrame
          </h1>
          <p
            className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed md:leading-loose tracking-[0.01em] max-w-2xl mx-auto animate-slide-up"
            style={{ animationDelay: '120ms' }}
          >
            {homeCopy}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link
              href="/photos"
              className="px-8 py-3 rounded-lg font-medium btn-glass"
              style={(() => {
                if (!themeColor) return {};
                const light = isLightHex(themeColor);
                if (light) {
                  return {
                    color: '#111827',
                    borderColor: 'rgba(17,24,39,0.35)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(17,24,39,0.2), 0 8px 24px rgba(17,24,39,0.15)',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                  };
                }
                return {
                  borderColor: `${themeColor}80`,
                  boxShadow: `inset 0 0 0 1px ${themeColor}33, 0 8px 24px ${themeColor}26`,
                };
              })()}
            >
              进入相册
            </Link>
            <Link
              href="/tags"
              className="px-8 py-3 text-white rounded-lg font-medium btn-outline-light"
              style={(() => {
                if (!themeColor) return {};
                const light = isLightHex(themeColor);
                if (light) {
                  return {
                    color: '#111827',
                    borderColor: 'rgba(17,24,39,0.35)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(17,24,39,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                  };
                }
                return {};
              })()}
            >
              按标签浏览
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
              精选作品
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              探索镜头下捕捉的每一个瞬间
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                精心策展
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                每一张照片都经过精心挑选和整理
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                智能分类
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                通过标签和系列轻松找到想看的内容
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                快速加载
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                优化的图片加载，流畅的浏览体验
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/photos"
              className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg border text-gray-900 bg-transparent hover:bg-gray-100 transition-colors dark:text-gray-100 dark:border-gray-700 dark:hover:bg-white/5"
            >
              浏览全部照片
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
