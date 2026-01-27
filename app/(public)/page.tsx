'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getImageSrcSet, getImageUrl } from '@/lib/image/utils';
import { cfImage } from '@/lib/cf-image';
import { extractDominantColor, rgbToHsl } from '@/lib/theme-color';
import { DEFAULT_HOME_COPY_SELECTED } from '@/lib/constants';
import { ProgressiveImage } from '@/components/media/ProgressiveImage';

interface HeroPhoto {
  id: string;
  fileKey: string;
  title: string | null;
  isPublic: boolean;
  dominantColor: string | null;
  width: number | null;
  height: number | null;
}

interface FeaturedPhoto {
  id: string;
  fileKey: string;
  title: string | null;
  isPublic: boolean;
  dominantColor: string | null;
  width: number | null;
  height: number | null;
}

interface SeriesItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  photoCount: number;
  coverPhoto: {
    fileKey: string;
    isPublic: boolean;
    dominantColor: string | null;
  } | null;
}

interface TagItem {
  id: string;
  name: string;
  count: number;
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
    return l >= 70;
  };

  const [heroPhoto, setHeroPhoto] = useState<HeroPhoto | null>(null);
  const [featuredPhotos, setFeaturedPhotos] = useState<FeaturedPhoto[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [homeCopy, setHomeCopy] = useState<string>(DEFAULT_HOME_COPY_SELECTED);
  const [themeColor, setThemeColor] = useState<string | null>(null);
  const [stats, setStats] = useState({ photos: 0, series: 0, tags: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Scroll animation refs
  const featuredRef = useRef<HTMLElement>(null);
  const seriesRef = useRef<HTMLElement>(null);
  const tagsRef = useRef<HTMLElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    [featuredRef, seriesRef, tagsRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loadHomePage();
  }, []);

  const loadHomePage = async () => {
    try {
      // Load all data in parallel
      const [photosRes, seriesRes, tagsRes, copyRes] = await Promise.all([
        fetch('/api/photos?isPublic=true&limit=7'),
        fetch('/api/series'),
        fetch('/api/tags'),
        fetch('/api/site-copy'),
      ]);

      let currentPhoto: HeroPhoto | null = null;

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        if (photosData.photos && photosData.photos.length > 0) {
          currentPhoto = photosData.photos[0];
          setHeroPhoto(currentPhoto);
          setFeaturedPhotos(photosData.photos.slice(1, 7));
          setStats((prev) => ({ ...prev, photos: photosData.total || photosData.photos.length }));

          // Extract dominant color if needed
          if (currentPhoto && !currentPhoto.dominantColor) {
            const imageUrl = cfImage(`/${currentPhoto.fileKey}`, { width: 800 });
            try {
              const dominantColor = await extractDominantColor(imageUrl);
              currentPhoto.dominantColor = dominantColor;
            } catch (error) {
              console.error('Color extraction failed:', error);
            }
          }
        }
      }

      if (seriesRes.ok) {
        const seriesData = await seriesRes.json();
        setSeries(seriesData.series?.slice(0, 4) || []);
        setStats((prev) => ({ ...prev, series: seriesData.series?.length || 0 }));
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData.tags?.slice(0, 12) || []);
        setStats((prev) => ({ ...prev, tags: tagsData.tags?.length || 0 }));
      }

      if (copyRes.ok) {
        const copyData = await copyRes.json();
        if (copyData.homeCopy) setHomeCopy(copyData.homeCopy);
        if (copyData.themeColor) {
          setThemeColor(copyData.themeColor);
        } else if (currentPhoto?.dominantColor) {
          setThemeColor(currentPhoto.dominantColor);
        }
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading homepage:', error);
      setIsLoaded(true);
    }
  };

  const scrollToContent = useCallback(() => {
    featuredRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="relative bg-stone-50 dark:bg-neutral-950">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION - Cinematic Full-Screen
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] md:min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        {heroPhoto ? (
          <div className="absolute inset-0">
            <img
              src={heroSrc || undefined}
              srcSet={heroSrcSet}
              sizes="100vw"
              alt="Hero"
              className="w-full h-full object-cover scale-105"
              style={{
                animation: isLoaded ? 'heroZoom 20s ease-out forwards' : 'none',
              }}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            {/* Cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
            <div className="hidden md:block absolute inset-0 bg-noise opacity-[0.04] mix-blend-overlay pointer-events-none" />
            {/* Vignette effect */}
            <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
            {/* Animated background pattern */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[var(--ds-accent-10)] to-transparent dark:from-[var(--ds-accent-15)] blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-[var(--ds-luxury-10)] to-transparent dark:from-[var(--ds-luxury-15)] blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            </div>
            {/* Decorative frame */}
            <div className="absolute top-8 left-8 w-32 h-32 border-l-2 border-t-2 border-stone-200 dark:border-neutral-800 opacity-50" />
            <div className="absolute bottom-8 right-8 w-32 h-32 border-r-2 border-b-2 border-stone-200 dark:border-neutral-800 opacity-50" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 px-4 max-w-5xl mx-auto text-center">
          {/* Brand */}
          <div
            className={`mb-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <span
              className="inline-block text-xs md:text-sm uppercase tracking-[0.3em] font-medium mb-4"
              style={{ color: heroContrast || 'var(--ds-accent)', transitionDelay: '200ms' }}
            >
              Photography Portfolio
            </span>
          </div>

          <h1
            className={`text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-bold mb-6 tracking-tighter leading-[0.9] transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{
              color: heroContrast || 'var(--foreground)',
              textShadow: heroPhoto
                ? '0 4px 60px rgba(0,0,0,0.5), 0 2px 20px rgba(0,0,0,0.3)'
                : 'none',
              transitionDelay: '100ms',
            }}
          >
            CCFrame
          </h1>

          <p
            className={`text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto mb-10 font-light leading-relaxed transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              color: heroContrastMuted || 'var(--foreground)',
              textShadow: heroPhoto ? '0 2px 20px rgba(0,0,0,0.4)' : 'none',
              transitionDelay: '300ms',
            }}
          >
            {homeCopy}
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '500ms' }}
          >
            <Link
              href="/photos"
              className={`group relative px-8 py-3.5 rounded-full font-medium text-sm tracking-wide overflow-hidden transition-all duration-500 ${
                heroPhoto
                  ? 'bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white/20 hover:border-white/50'
                  : 'bg-[color:var(--ds-accent)] text-white hover:shadow-xl hover:shadow-[var(--ds-accent-30)]'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                探索作品
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--ds-accent)] to-[var(--ds-luxury)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
            <Link
              href="/series"
              className={`px-8 py-3.5 rounded-full font-medium text-sm tracking-wide transition-all duration-300 ${
                heroPhoto
                  ? 'text-white/90 border border-white/20 hover:border-white/40 hover:text-white'
                  : 'border-2 border-stone-300 dark:border-neutral-600 text-stone-700 dark:text-stone-300 hover:border-[var(--ds-accent)] hover:text-[var(--ds-accent)]'
              }`}
            >
              浏览系列
            </Link>
          </div>

          {/* Stats */}
          {(stats.photos > 0 || stats.series > 0) && (
            <div
              className={`flex items-center justify-center gap-8 mt-16 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '700ms' }}
            >
              {stats.photos > 0 && (
                <div className="text-center">
                  <div
                    className="text-3xl md:text-4xl font-serif font-bold"
                    style={{ color: heroContrast || 'var(--foreground)' }}
                  >
                    {stats.photos}
                  </div>
                  <div
                    className="text-xs uppercase tracking-widest mt-1"
                    style={{ color: heroContrastMuted || 'var(--foreground)', opacity: 0.7 }}
                  >
                    作品
                  </div>
                </div>
              )}
              {stats.series > 0 && (
                <>
                  <div
                    className="w-px h-10"
                    style={{ backgroundColor: heroContrast || 'var(--foreground)', opacity: 0.2 }}
                  />
                  <div className="text-center">
                    <div
                      className="text-3xl md:text-4xl font-serif font-bold"
                      style={{ color: heroContrast || 'var(--foreground)' }}
                    >
                      {stats.series}
                    </div>
                    <div
                      className="text-xs uppercase tracking-widest mt-1"
                      style={{ color: heroContrastMuted || 'var(--foreground)', opacity: 0.7 }}
                    >
                      系列
                    </div>
                  </div>
                </>
              )}
              {stats.tags > 0 && (
                <>
                  <div
                    className="w-px h-10"
                    style={{ backgroundColor: heroContrast || 'var(--foreground)', opacity: 0.2 }}
                  />
                  <div className="text-center">
                    <div
                      className="text-3xl md:text-4xl font-serif font-bold"
                      style={{ color: heroContrast || 'var(--foreground)' }}
                    >
                      {stats.tags}
                    </div>
                    <div
                      className="text-xs uppercase tracking-widest mt-1"
                      style={{ color: heroContrastMuted || 'var(--foreground)', opacity: 0.7 }}
                    >
                      标签
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer group"
          aria-label="Scroll to content"
        >
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ color: heroContrast || 'var(--foreground)' }}
          >
            Scroll
          </span>
          <div className="relative w-6 h-10 rounded-full border-2 opacity-60 group-hover:opacity-100 transition-opacity" style={{ borderColor: heroContrast || 'var(--foreground)' }}>
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: heroContrast || 'var(--foreground)' }}
            />
          </div>
        </button>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED PHOTOS - Bento Grid
      ═══════════════════════════════════════════════════════════════ */}
      {featuredPhotos.length > 0 && (
        <section
          ref={featuredRef}
          id="featured"
          className="relative py-24 md:py-32 overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/5 to-transparent dark:from-white/5" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div
              className={`flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 transition-all duration-700 ${visibleSections.has('featured') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div>
                <span className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)] mb-3">
                  Featured
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                  精选作品
                </h2>
              </div>
              <Link
                href="/photos"
                className="group inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-[var(--ds-accent)] transition-colors"
              >
                查看全部
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Bento Grid */}
            <div
              className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px] transition-all duration-700 ${visibleSections.has('featured') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: '200ms' }}
            >
              {featuredPhotos.map((photo, index) => {
                // Bento layout classes
                const layoutClasses = [
                  'col-span-2 row-span-2', // Large
                  'col-span-1 row-span-1', // Small
                  'col-span-1 row-span-2', // Tall
                  'col-span-1 row-span-1', // Small
                  'col-span-2 row-span-1', // Wide
                  'col-span-1 row-span-1', // Small
                ][index] || 'col-span-1 row-span-1';

                return (
                  <Link
                    key={photo.id}
                    href={`/photos?photo=${photo.id}`}
                    className={`group relative rounded-2xl overflow-hidden bg-stone-200 dark:bg-neutral-800 ${layoutClasses}`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <ProgressiveImage
                      fileKey={photo.fileKey}
                      isPublic={photo.isPublic}
                      alt={photo.title || 'Photo'}
                      highResOptions={{
                        width: index === 0 ? 1200 : 600,
                        quality: 85,
                      }}
                      className="w-full h-full"
                      imgClassName="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Title on hover */}
                    {photo.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white text-sm font-medium truncate">{photo.title}</p>
                      </div>
                    )}
                    {/* Corner accent */}
                    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white/0 group-hover:border-white/50 transition-all duration-300 rounded-tr-lg" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SERIES SHOWCASE - Editorial Cards
      ═══════════════════════════════════════════════════════════════ */}
      {series.length > 0 && (
        <section
          ref={seriesRef}
          id="series"
          className="relative py-24 md:py-32 bg-stone-100/50 dark:bg-neutral-900/50"
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--ds-accent-5)] to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div
              className={`text-center mb-16 transition-all duration-700 ${visibleSections.has('series') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <span className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-luxury)] mb-3">
                Collections
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-4">
                探索系列
              </h2>
              <p className="text-stone-600 dark:text-stone-400 font-light max-w-xl mx-auto">
                精心策划的摄影系列，每个系列都讲述独特的视觉故事
              </p>
            </div>

            {/* Series Grid */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${visibleSections.has('series') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: '200ms' }}
            >
              {series.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/series/${item.slug || item.id}`}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 dark:bg-neutral-800"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {item.coverPhoto ? (
                    <ProgressiveImage
                      fileKey={item.coverPhoto.fileKey}
                      isPublic={item.coverPhoto.isPublic}
                      alt={item.title}
                      highResOptions={{
                        width: 600,
                        quality: 85,
                      }}
                      className="w-full h-full"
                      imgClassName="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 dark:from-neutral-700 dark:to-neutral-800" />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/70 mb-2">
                      {item.photoCount} 张作品
                    </span>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-2 group-hover:text-[var(--ds-accent-soft)] transition-colors">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-sm text-white/70 line-clamp-2 font-light">
                        {item.summary}
                      </p>
                    )}

                    {/* Hover indicator */}
                    <div className="mt-4 flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                      <span className="text-xs font-medium">查看系列</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Decorative border */}
                  <div className="absolute inset-4 border border-white/0 group-hover:border-white/20 rounded-xl transition-all duration-500" />
                </Link>
              ))}
            </div>

            {/* View all link */}
            <div className="text-center mt-12">
              <Link
                href="/series"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-stone-300 dark:border-neutral-600 text-stone-700 dark:text-stone-300 font-medium text-sm hover:border-[var(--ds-accent)] hover:text-[var(--ds-accent)] transition-all duration-300"
              >
                查看全部系列
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAGS CLOUD - Interactive Discovery
      ═══════════════════════════════════════════════════════════════ */}
      {tags.length > 0 && (
        <section
          ref={tagsRef}
          id="tags"
          className="relative py-24 md:py-32 overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute bottom-0 left-0 w-2/3 h-64 bg-gradient-to-tr from-[var(--ds-luxury-5)] to-transparent dark:from-[var(--ds-luxury-10)]" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div
              className={`text-center mb-16 transition-all duration-700 ${visibleSections.has('tags') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <span className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)] mb-3">
                Discover
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-4">
                按标签探索
              </h2>
              <p className="text-stone-600 dark:text-stone-400 font-light max-w-xl mx-auto">
                通过标签快速找到感兴趣的内容
              </p>
            </div>

            {/* Tags Cloud */}
            <div
              className={`flex flex-wrap justify-center gap-3 transition-all duration-700 ${visibleSections.has('tags') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: '200ms' }}
            >
              {tags.map((tag, index) => {
                // Size based on count
                const maxCount = Math.max(...tags.map((t) => t.count));
                const ratio = tag.count / maxCount;
                const sizeClass = ratio > 0.7
                  ? 'text-lg px-6 py-3'
                  : ratio > 0.4
                    ? 'text-base px-5 py-2.5'
                    : 'text-sm px-4 py-2';

                return (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className={`group relative rounded-full bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-medium text-stone-700 dark:text-stone-300 hover:border-[var(--ds-accent)] hover:text-[var(--ds-accent)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--ds-accent-10)] hover:-translate-y-0.5 ${sizeClass}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="relative z-10">#{tag.name}</span>
                    <span className="ml-2 text-xs opacity-50">{tag.count}</span>
                    {/* Hover background */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--ds-accent-5)] to-[var(--ds-luxury-5)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                );
              })}
            </div>

            {/* View all link */}
            <div className="text-center mt-12">
              <Link
                href="/tags"
                className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-[var(--ds-accent)] transition-colors"
              >
                查看全部标签
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER CTA - Call to Action
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 bg-stone-900 dark:bg-neutral-950 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--ds-accent-20)] via-transparent to-[var(--ds-luxury-10)] opacity-30" />
          <div className="absolute inset-0 bg-noise opacity-[0.03]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
            开始探索
          </h2>
          <p className="text-lg text-stone-300 font-light mb-10 max-w-2xl mx-auto">
            发现更多精彩的摄影作品，感受光影之美
          </p>
          <Link
            href="/photos"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-stone-900 font-medium hover:shadow-2xl hover:shadow-white/20 transition-all duration-300"
          >
            浏览全部作品
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes heroZoom {
          0% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
