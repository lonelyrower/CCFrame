'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getImageSrcSet, getImageUrl } from '@/lib/image/utils';
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
  const heroSrc = heroPhoto
    ? getImageUrl(heroPhoto.fileKey, heroPhoto.isPublic, { width: 1920, quality: 90 })
    : null;
  const heroSrcSet = heroPhoto
    ? getImageSrcSet(heroPhoto.fileKey, heroPhoto.isPublic, undefined, { quality: 90 })
    : undefined;
  const heroIsLight = heroPhoto ? isLightHex(themeColor) : false;
  const heroContrast = heroPhoto
    ? heroIsLight
      ? 'var(--ds-ink-strong)'
      : 'var(--ds-ink-inverse)'
    : undefined;
  const heroContrastMuted = heroPhoto
    ? heroIsLight
      ? 'rgb(var(--ds-ink-strong-rgb) / 0.9)'
      : 'rgb(var(--ds-ink-inverse-rgb) / 0.95)'
    : undefined;
  const heroTitleShadow = heroPhoto
    ? heroIsLight
      ? '0 4px 20px rgb(var(--ds-ink-strong-rgb) / 0.08)'
      : '0 4px 30px rgb(var(--ds-ink-strong-rgb) / 0.6), 0 2px 10px rgb(var(--ds-accent-rgb) / 0.3)'
    : 'none';
  const heroSubtitleShadow = heroPhoto
    ? heroIsLight
      ? '0 2px 10px rgb(var(--ds-ink-strong-rgb) / 0.1)'
      : '0 2px 15px rgb(var(--ds-ink-strong-rgb) / 0.5)'
    : 'none';

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
      <section className="relative min-h-[100svh] md:min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image or Empty State */}
        {heroPhoto ? (
          <div className="absolute inset-0">
            <img
              src={heroSrc || undefined}
              srcSet={heroSrcSet}
              sizes="100vw"
              alt="Hero"
              className="w-full h-full object-cover scale-105 animate-fade-in"
              style={{ animationDuration: '1.2s' }}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            {/* Sophisticated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
            {/* Subtle grain texture */}
            <div className="hidden md:block absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay pointer-events-none" />
            {/* Accent color tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--ds-accent-10)] via-transparent to-[var(--ds-luxury-5)] mix-blend-multiply" />
          </div>
        ) : (
          /* Empty State - Elegant Minimal Design */
          <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
            {/* Decorative geometric elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Large camera lens illustration */}
              <div className="absolute top-1/4 right-1/4 w-96 h-96 opacity-[0.03] dark:opacity-[0.08]">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" className="text-[color:var(--ds-accent)]"/>
                  <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1.5" className="text-[color:var(--ds-luxury)]"/>
                  <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" className="text-[color:var(--ds-accent)]"/>
                  <path d="M100 40 L130 100 L100 160 L70 100 Z" stroke="currentColor" strokeWidth="1" className="text-[color:var(--ds-accent)]"/>
                </svg>
              </div>
              {/* Frame corners */}
              <div className="absolute top-10 left-10 w-24 h-24 border-l-2 border-t-2 border-stone-300 dark:border-neutral-700 opacity-30"/>
              <div className="absolute bottom-10 right-10 w-24 h-24 border-r-2 border-b-2 border-stone-300 dark:border-neutral-700 opacity-30"/>
              {/* Subtle gradient orbs */}
              <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-br from-[var(--ds-accent-5)] to-transparent dark:from-[var(--ds-accent-soft-10)] rounded-full blur-3xl"/>
              <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-to-tl from-[var(--ds-luxury-5)] to-transparent dark:from-[var(--ds-luxury)]/10 rounded-full blur-3xl"/>
            </div>
          </div>
        )}

        {/* Content - Editorial Layout */}
        <div className="relative z-10 px-4 max-w-6xl mx-auto h-full flex flex-col justify-center items-center">
          {/* Brand Mark - Center */}
          <div className="text-center mb-8 md:mb-12">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-bold mb-4 md:mb-6 animate-reveal tracking-tighter leading-none"
              style={{
                animationDelay: '100ms',
                color: heroContrast || 'var(--foreground)',
                textShadow: heroTitleShadow,
                letterSpacing: '-0.04em',
              }}
            >
              CCFrame
            </h1>
          </div>

          {/* Tagline - Center */}
          <div className="text-center max-w-4xl">
            <p
              className="text-lg md:text-xl lg:text-2xl mb-10 leading-relaxed tracking-wide max-w-3xl mx-auto font-light animate-reveal text-stone-700 dark:text-stone-300"
              style={{
                animationDelay: '300ms',
                color: heroContrastMuted,
                textShadow: heroSubtitleShadow,
                letterSpacing: '0.05em',
              }}
            >
              {homeCopy}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-reveal" style={{ animationDelay: '500ms' }}>
              <Link
                href="/photos"
                className={`px-6 py-2.5 rounded-full font-medium text-sm tracking-wide uppercase hover:scale-105 active:scale-100 transition-all duration-300 ${
                  heroPhoto
                    ? 'btn-glass'
                    : 'bg-[color:var(--ds-accent)] text-white hover:bg-[color:var(--ds-accent-strong)] shadow-lg hover:shadow-xl'
                }`}
                style={(() => {
                  if (!heroPhoto || !themeColor) return {};
                  if (heroIsLight) {
                    return {
                      color: 'var(--ds-ink-strong)',
                      borderColor: 'rgb(var(--ds-ink-strong-rgb) / 0.3)',
                      boxShadow:
                        'inset 0 1px 0 rgb(var(--ds-ink-inverse-rgb) / 0.5), 0 10px 30px rgb(var(--ds-ink-strong-rgb) / 0.15)',
                      backgroundColor: 'rgb(var(--ds-ink-inverse-rgb) / 0.7)',
                    };
                  }
                  return {};
                })()}
              >
                探索作品
              </Link>
              <Link
                href="/tags"
                className={`px-6 py-2.5 rounded-full font-medium text-sm tracking-wide uppercase hover:scale-105 active:scale-100 transition-all duration-300 ${
                  heroPhoto
                    ? 'text-white btn-outline-light'
                    : 'border-2 border-[color:var(--ds-accent)] text-[color:var(--ds-accent)] hover:bg-[color:var(--ds-accent)] hover:text-white dark:hover:text-neutral-900'
                }`}
                style={(() => {
                  if (!heroPhoto || !themeColor) return {};
                  if (heroIsLight) {
                    return {
                      color: 'var(--ds-ink-strong)',
                      borderColor: 'rgb(var(--ds-ink-strong-rgb) / 0.3)',
                      backgroundColor: 'rgb(var(--ds-ink-inverse-rgb) / 0.3)',
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
            className="text-xs uppercase tracking-widest font-light text-stone-600 dark:text-stone-400"
            style={{
              color: heroContrast,
            }}
          >
            Scroll
          </span>
          <div
            className="w-px h-12 opacity-50 bg-stone-600 dark:bg-stone-400"
            style={{
              backgroundColor: heroContrast,
            }}
          />
        </div>
      </section>

      {/* Fashion Editorial Section */}
      <section className="relative py-24 md:py-32 bg-stone-50 dark:bg-neutral-950 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-64 bg-gradient-to-bl from-[var(--ds-accent-5)] to-transparent dark:from-[var(--ds-accent-soft-10)]" />
        <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-tr from-[var(--ds-luxury-5)] to-transparent dark:from-[var(--ds-luxury-8)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - Personal Style */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight">
              探索摄影世界
            </h2>
            <p className="text-base md:text-lg text-stone-600 dark:text-stone-400 font-light leading-relaxed">
              用镜头记录生活的美好瞬间
            </p>
          </div>

          {/* Feature Grid - Clean Icon Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="group text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-[var(--ds-accent-10)] to-[var(--ds-accent-5)] group-hover:scale-105 transition-all duration-300">
                {/* Camera Icon */}
                <svg className="w-8 h-8 text-[color:var(--ds-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-2.5 tracking-tight">
                精选作品
              </h3>
              <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                每张照片都经过精心拍摄与后期处理
              </p>
            </div>

            <div className="group text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-[var(--ds-luxury-10)] to-[var(--ds-luxury-5)] group-hover:scale-105 transition-all duration-300">
                {/* Tags Icon */}
                <svg className="w-8 h-8 text-[color:var(--ds-luxury)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-2.5 tracking-tight">
                灵活分类
              </h3>
              <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                通过标签和系列快速找到感兴趣的内容
              </p>
            </div>

            <div className="group text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-stone-400/10 to-stone-400/5 dark:from-stone-400/15 dark:to-stone-400/5 group-hover:scale-105 transition-all duration-300">
                {/* Gallery Icon */}
                <svg className="w-8 h-8 text-stone-700 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-2.5 tracking-tight">
                流畅浏览
              </h3>
              <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                响应式设计，在任何设备上都有最佳体验
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
