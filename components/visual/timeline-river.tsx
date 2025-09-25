"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { TimelineTooltip } from '@/components/visual/timeline-tooltip'
import type { TimelineEvent } from '@/types/timeline'
import { cn } from '@/lib/utils'

interface TimelineRiverProps {
  events: TimelineEvent[]
}

export function TimelineRiver({ events }: TimelineRiverProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Enhanced parallax effects
  const timelineProgress = useTransform(scrollYProgress, [0, 1], [0, 100])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -50])
  const springBackgroundY = useSpring(backgroundY, { damping: 30, stiffness: 200 })

  // Group events by year for chapter dividers
  const eventsByYear = useMemo(() => {
    const grouped = new Map<number, TimelineEvent[]>()
    events.forEach(event => {
      const year = new Date(event.timestamp).getFullYear()
      if (!grouped.has(year)) {
        grouped.set(year, [])
      }
      grouped.get(year)!.push(event)
    })
    return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0])
  }, [events])

  if (events.length === 0) {
    return (
      <div className="rounded-[48px] border border-white/10 bg-black/40 p-20 text-center text-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border border-white/20" />
          </div>
          <h3 className="text-xl font-light" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
            时间长河暂无记录
          </h3>
          <p className="text-white/60 font-light">
            调整筛选条件或稍后再试，也许新的故事正在路上。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Enhanced parallax background with film grain */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: springBackgroundY }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/2 to-transparent" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />
      </motion.div>

      {/* Dynamic timeline axis with progress indicator */}
      <motion.div
        className="pointer-events-none absolute left-[calc(50%_-_1px)] top-0 hidden h-full w-0.5 bg-gradient-to-b from-amber-200/40 via-amber-100/10 to-transparent md:block"
        style={{
          background: useTransform(timelineProgress,
            [0, 50, 100],
            [
              'linear-gradient(to bottom, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.1) 50%, transparent 100%)',
              'linear-gradient(to bottom, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 100%)',
              'linear-gradient(to bottom, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.1) 50%, transparent 100%)'
            ]
          )
        }}
        aria-hidden="true"
      />

      {/* Year-based chapters */}
      <div className="space-y-16 md:space-y-24">
        {eventsByYear.map(([year, yearEvents]) => (
          <YearChapter
            key={year}
            year={year}
            events={yearEvents}
            scrollProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  )
}

// Year chapter divider with parallax
function YearChapter({
  year,
  events,
  scrollProgress
}: {
  year: number
  events: TimelineEvent[]
  scrollProgress: any
}) {
  const chapterRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: chapterProgress } = useScroll({
    target: chapterRef,
    offset: ["start end", "end start"]
  })

  const yearY = useTransform(chapterProgress, [0, 1], [20, -20])
  const yearOpacity = useTransform(chapterProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <motion.section
      ref={chapterRef}
      className="relative"
      style={{
        y: yearY,
        opacity: yearOpacity
      }}
    >
      {/* Year header with film aesthetic */}
      <motion.div
        className="relative mb-12 flex items-center justify-center md:mb-16"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.25, 0.25, 0.25, 1] }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent blur-xl" />
        <div className="relative rounded-full border border-amber-200/30 bg-black/60 px-8 py-4 backdrop-blur-xl">
          <h2
            className="text-3xl font-light tracking-wider text-amber-100 md:text-4xl"
            style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
          >
            {year}
          </h2>
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-600/20 via-amber-400/10 to-amber-600/20 opacity-60 blur-sm" />
        </div>
      </motion.div>

      {/* Events for this year */}
      <div className="space-y-12 md:space-y-20">
        {events.map((event, index) => (
          <TimelineNode
            key={event.id}
            event={event}
            align={index % 2 === 0 ? 'left' : 'right'}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  )
}

function TimelineNode({
  event,
  align,
  index = 0
}: {
  event: TimelineEvent
  align: 'left' | 'right'
  index?: number
}) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: nodeRef,
    offset: ["start end", "end start"]
  })

  // Enhanced parallax for photos and content
  const cardY = useTransform(scrollYProgress, [0, 1], [30, -30])
  const photoY = useTransform(scrollYProgress, [0, 1], [50, -50])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  return (
    <motion.div
      ref={nodeRef}
      className="grid gap-6 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:gap-10"
      style={{ opacity: contentOpacity }}
    >
      <motion.div
        className={cn('md:col-span-1', align === 'left' ? 'md:order-1' : 'md:order-3')}
        style={{ y: cardY }}
      >
        <EventCard event={event} align={align} photoParallax={photoY} index={index} />
      </motion.div>

      <AxisColumn event={event} align={align} />

      <div className={cn('hidden md:col-span-1 md:block', align === 'left' ? 'md:order-3' : 'md:order-1')} aria-hidden="true" />
    </motion.div>
  )
}

function AxisColumn({ event, align }: { event: TimelineEvent; align: 'left' | 'right' }) {
  const label = event.timelineLabel ?? formatYearSegment(event.timestamp)
  return (
    <div className="relative flex items-center justify-center md:order-2">
      <div className="relative hidden h-full w-px md:flex md:justify-center" aria-hidden="true">
        <div className="absolute top-0 h-full w-px bg-gradient-to-b from-white/40 via-white/15 to-transparent" />
        <span
          className="relative z-10 mt-6 flex h-8 w-8 items-center justify-center rounded-full border border-contrast-outline/20 bg-surface-panel/90 text-xs font-semibold tracking-[0.2em] text-text-primary shadow-surface"
        >
          {new Date(event.timestamp).getDate()}
        </span>
      </div>
      <div className="md:absolute md:-top-12">
        <TimelineTooltip label={label} description={event.location} align={align} accentColor={event.highlightColor} />
      </div>
    </div>
  )
}

function EventCard({
  event,
  align,
  photoParallax,
  index = 0
}: {
  event: TimelineEvent
  align: 'left' | 'right'
  photoParallax: any
  index?: number
}) {
  const formattedDate = formatFullDate(event.timestamp)
  const personas = event.personas
  const secondaryPhotos = event.photos.slice(1, 4)

  return (
    <motion.article
      className="group relative overflow-hidden rounded-[48px] border border-white/10 bg-black/40 p-8 text-white shadow-2xl backdrop-blur-xl transition-all duration-700 hover:border-amber-200/30 hover:bg-black/60 md:p-10"
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.25, 0.25, 0.25, 1]
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
    >
      {/* Enhanced film grain background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-slate-900/20" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' seed='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <div className="relative space-y-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <motion.span
              className="rounded-full border border-amber-200/20 bg-amber-100/5 px-4 py-2 text-xs font-light tracking-[0.2em] text-amber-100/80"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              {formattedDate}
            </motion.span>
            {personas.map((persona, personaIndex) => (
              <motion.span
                key={persona.id}
                className="rounded-full border px-3 py-2 text-xs font-light tracking-[0.2em]"
                style={persona.accentColor ? {
                  borderColor: `${persona.accentColor}40`,
                  backgroundColor: `${persona.accentColor}10`,
                  color: persona.accentColor
                } : {
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 + personaIndex * 0.05 }}
              >
                {persona.name}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.4 }}
          >
            <h3
              className="text-2xl font-light leading-tight tracking-wide md:text-3xl"
              style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
            >
              {event.title}
            </h3>
            {event.subtitle ? (
              <p className="text-sm font-light text-white/60 leading-relaxed">
                {event.subtitle}
              </p>
            ) : null}
          </motion.div>
        </header>

        {event.primaryPhoto ? (
          <motion.div
            className="relative overflow-hidden rounded-[32px] border border-white/10"
            style={{ y: photoParallax }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
            <Image
              src={event.primaryPhoto.src}
              alt={event.primaryPhoto.alt ?? event.title}
              width={event.primaryPhoto.width ?? 1280}
              height={event.primaryPhoto.height ?? 720}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 540px"
            />
            {/* Film grain overlay on photo */}
            <div
              className="absolute inset-0 opacity-20 mix-blend-multiply"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.06'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px'
              }}
            />
          </motion.div>
        ) : null}

        {event.description ? (
          <motion.p
            className="text-sm font-light leading-relaxed text-white/75"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.5 }}
          >
            {event.description}
          </motion.p>
        ) : null}

        {secondaryPhotos.length ? (
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.6 }}
          >
            {secondaryPhotos.map((photo, photoIndex) => (
              <motion.div
                key={photo.id}
                className="group relative overflow-hidden rounded-[24px] border border-white/10"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt ?? event.title}
                  width={photo.width ?? 640}
                  height={photo.height ?? 640}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 33vw, 160px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {event.metrics?.length ? (
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.7 }}
          >
            {event.metrics.map((metric, metricIndex) => (
              <motion.div
                key={metric.label}
                className="rounded-full border border-amber-200/20 bg-amber-100/5 px-4 py-2 text-xs font-light tracking-[0.15em] text-amber-100/70"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.8 + metricIndex * 0.05 }}
              >
                <span className="text-amber-100/50">{metric.label}</span>
                <span className="ml-2 font-medium text-amber-100">{metric.value}</span>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {event.tags.length ? (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.8 }}
          >
            {event.tags.map((tag, tagIndex) => (
              <motion.span
                key={tag.id}
                className="rounded-full border px-3 py-1 text-xs font-light tracking-[0.1em]"
                style={tag.color ? {
                  borderColor: `${tag.color}60`,
                  backgroundColor: `${tag.color}10`,
                  color: tag.color
                } : {
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.9 + tagIndex * 0.03 }}
              >
                #{tag.name}
              </motion.span>
            ))}
          </motion.div>
        ) : null}

        {event.links?.length ? (
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 1.0 }}
          >
            {event.links.map((link, linkIndex) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                target={link.target ?? '_self'}
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-light tracking-[0.1em] text-white/70 transition-all duration-300 hover:border-amber-200/40 hover:bg-amber-100/10 hover:text-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50"
              >
                {link.label}
                <div className="h-1 w-1 rounded-full bg-current opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </motion.div>
        ) : null}
      </div>
    </motion.article>
  )
}

function formatFullDate(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatYearSegment(timestamp: string) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.toLocaleDateString('zh-CN', { month: 'short' })
  return `${year} · ${month}`
}
