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
      {/* Hero Section - Fashion Editorial Style */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        {heroPhoto && (
          <div className="absolute inset-0">
            <img
              src={getImageUrl(heroPhoto.fileKey, heroPhoto.isPublic, { width: 1920, quality: 90 })}
              alt="Hero"
              className="w-full h-full object-cover scale-105 animate-fade-in"
              style={{ animationDuration: '1.2s' }}
            />
            {/* Sophisticated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
            {/* Subtle grain texture */}
            <div className="hidden md:block absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay pointer-events-none" />
            {/* Accent color tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#e63946]/10 via-transparent to-[#d4af37]/5 mix-blend-multiply" />
          </div>
        )}

        {/* Content - Editorial Layout */}
        <div className="relative z-10 px-4 max-w-6xl mx-auto">
          {/* Brand Mark - Top Left */}
          <div className="absolute top-0 left-0 right-0 text-center md:text-left mb-12 md:mb-0">
            <h1
              className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-bold mb-4 animate-reveal tracking-tighter leading-none"
              style={{
                animationDelay: '100ms',
                color: themeColor && isLightHex(themeColor) ? '#0a0a0a' : '#ffffff',
                textShadow: themeColor && isLightHex(themeColor)
                  ? '0 4px 20px rgba(0,0,0,0.08)'
                  : '0 4px 30px rgba(0,0,0,0.6), 0 2px 10px rgba(230,57,70,0.3)',
                letterSpacing: '-0.04em',
              }}
            >
              CCFrame
            </h1>
          </div>

          {/* Tagline - Bottom Center */}
          <div className="absolute bottom-32 left-0 right-0 text-center">
            <p
              className="text-lg md:text-xl lg:text-2xl mb-10 leading-relaxed tracking-wide max-w-3xl mx-auto font-light animate-reveal"
              style={{
                animationDelay: '300ms',
                color: themeColor && isLightHex(themeColor) ? 'rgba(10,10,10,0.9)' : 'rgba(255,255,255,0.95)',
                textShadow: themeColor && isLightHex(themeColor)
                  ? '0 2px 10px rgba(0,0,0,0.1)'
                  : '0 2px 15px rgba(0,0,0,0.5)',
                letterSpacing: '0.05em',
              }}
            >
              {homeCopy}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center animate-reveal" style={{ animationDelay: '500ms' }}>
              <Link
                href="/photos"
                className="px-10 py-4 rounded-full font-medium text-base tracking-wide uppercase btn-glass hover:scale-105 active:scale-100"
                style={(() => {
                  if (!themeColor) return {};
                  const light = isLightHex(themeColor);
                  if (light) {
                    return {
                      color: '#0a0a0a',
                      borderColor: 'rgba(10,10,10,0.3)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 30px rgba(10,10,10,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                    };
                  }
                  return {};
                })()}
              >
                探索作品
              </Link>
              <Link
                href="/tags"
                className="px-10 py-4 text-white rounded-full font-medium text-base tracking-wide uppercase btn-outline-light hover:scale-105 active:scale-100"
                style={(() => {
                  if (!themeColor) return {};
                  const light = isLightHex(themeColor);
                  if (light) {
                    return {
                      color: '#0a0a0a',
                      borderColor: 'rgba(10,10,10,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    };
                  }
                  return {};
                })()}
              >
                浏览标签
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-70">
          <span
            className="text-xs uppercase tracking-widest font-light"
            style={{
              color: themeColor && isLightHex(themeColor) ? '#0a0a0a' : '#ffffff',
            }}
          >
            Scroll
          </span>
          <div
            className="w-px h-12 opacity-50"
            style={{
              backgroundColor: themeColor && isLightHex(themeColor) ? '#0a0a0a' : '#ffffff',
            }}
          />
        </div>
      </section>

      {/* Fashion Editorial Section */}
      <section className="relative py-24 md:py-32 bg-stone-50 dark:bg-neutral-950 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-64 bg-gradient-to-bl from-[#e63946]/5 to-transparent dark:from-[#ff6b7a]/10" />
        <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-tr from-[#d4af37]/5 to-transparent dark:from-[#d4af37]/8" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - Fashion Magazine Style */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <div className="inline-block mb-6">
              <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
                Portfolio Showcase
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight leading-tight">
              时尚与艺术的融合
            </h2>
            <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 font-light tracking-wide leading-relaxed">
              捕捉每一个瞬间的美学与情感
            </p>
          </div>

          {/* Feature Grid - Modern Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-16">
            <div className="group text-center md:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-gradient-to-br from-[#e63946]/10 to-[#e63946]/5 dark:from-[#ff6b7a]/15 dark:to-[#ff6b7a]/5 group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 rounded-full bg-[#e63946] dark:bg-[#ff6b7a]" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-3 tracking-tight">
                专业策展
              </h3>
              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                每一张作品都经过精心挑选，展现独特的视觉美学
              </p>
            </div>

            <div className="group text-center md:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5 dark:from-[#d4af37]/15 dark:to-[#d4af37]/5 group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 rounded-full bg-[#d4af37]" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-3 tracking-tight">
                多维度分类
              </h3>
              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                通过标签、系列、相册，轻松探索不同风格的作品
              </p>
            </div>

            <div className="group text-center md:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-gradient-to-br from-stone-400/10 to-stone-400/5 dark:from-stone-400/15 dark:to-stone-400/5 group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 rounded-full bg-stone-700 dark:bg-stone-300" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-3 tracking-tight">
                沉浸体验
              </h3>
              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                优化的加载性能，流畅的浏览体验，专注于作品本身
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-8">
            <Link
              href="/photos"
              className="group inline-flex items-center gap-3 px-10 py-4 text-base font-medium tracking-wide uppercase rounded-full bg-stone-900 text-white hover:bg-[#e63946] dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-[#ff6b7a] transition-all duration-300 hover:scale-105 active:scale-100 shadow-lg hover:shadow-2xl"
            >
              <span>查看完整作品集</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
