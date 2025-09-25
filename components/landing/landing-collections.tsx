import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { LandingAlbumHighlight } from '@/lib/landing-data'
import { Container } from '@/components/layout/container'
import { Grid, GridItem } from '@/components/layout/grid'
import { Surface } from '@/components/ui/surface'
import { Heading, Text, Overline } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { getImageUrl, toBase64 } from '@/lib/utils'

interface LandingCollectionsProps {
  albums: LandingAlbumHighlight[]
}

const blurPlaceholder = `data:image/svg+xml;base64,${toBase64('<svg width="400" height="260" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="260" rx="24" fill="#f4f4f5" /></svg>')}`

export function LandingCollections({ albums }: LandingCollectionsProps) {
  return (
    <section id="collections">
      <Container size="xl" bleed="none" className="py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Overline>精选系列</Overline>
            <Heading size="lg">精选影像集</Heading>
            <Text tone="secondary">围绕主题、地点与情绪策划的小型展览，像翻一本随身画册。</Text>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link href="/photos">
              浏览图册
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {albums.length === 0 ? (
          <div className="mt-10">
            <Surface padding="lg" className="text-center">
              <Heading size="sm">暂未整理系列</Heading>
              <Text tone="secondary" size="sm" className="mt-2">
                正在挑选照片，很快就会有新的影像故事与大家见面。
              </Text>
            </Surface>
          </div>
        ) : (
          <Grid className="mt-10" columns={{ base: 1, md: 12 }} gap="lg">
            {albums.map((album, index) => (
              <GridItem key={album.id} span={{ base: 12, md: index === 0 ? 12 : 6 }}>
                <AnimateOnScroll delay={index * 0.05}>
                  <Surface padding="none" className="group overflow-hidden rounded-3xl border border-surface-outline/40 bg-surface-panel/60 shadow-floating">
                    <div className="grid gap-0 md:grid-cols-[3fr_2fr]">
                      <div className="relative">
                        {album.coverPhoto ? (
                          <Image
                            src={getImageUrl(album.coverPhoto.id, 'large', 'webp')}
                            alt={album.title}
                            width={album.coverPhoto.width || 1200}
                            height={album.coverPhoto.height || 800}
                            sizes="(min-width: 1024px) 60vw, 100vw"
                            placeholder="blur"
                            blurDataURL={blurPlaceholder}
                            className="h-full w-full object-cover transition-transform duration-[600ms] ease-[var(--ease-out)] group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full min-h-[260px] w-full items-center justify-center bg-gradient-to-br from-surface-outline/20 to-surface-panel">
                            <Text tone="secondary">等待下一组影像</Text>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                        <div className="absolute left-6 bottom-6 flex items-center gap-3 text-sm text-text-inverted/80">
                          <span className="rounded-full bg-surface-panel/10 px-3 py-1 backdrop-blur">{album.photoCount} 张作品</span>
                          {album.coverPhoto?.tags.slice(0, 2).map(({ tag }) => (
                            <span key={tag.id} className="rounded-full bg-surface-panel/10 px-3 py-1 backdrop-blur">
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between p-8">
                        <div className="space-y-4">
                          <Heading size="md" className="text-balance">
                            {album.title}
                          </Heading>
                          {album.description ? (
                            <Text tone="secondary" size="sm" className="text-pretty leading-relaxed">
                              {album.description}
                            </Text>
                          ) : (
                            <Text tone="secondary" size="sm" className="text-pretty leading-relaxed">
                              这组作品还在补写说明，欢迎先一饱眼福。
                            </Text>
                          )}
                        </div>
                        <div className="mt-8 flex items-center justify-between text-sm text-text-secondary">
                          <span>点击跳转到该系列的完整图集</span>
                          <Link href={`/photos?album=${album.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                            查看更多
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Surface>
                </AnimateOnScroll>
              </GridItem>
            ))}
          </Grid>
        )}
      </Container>
    </section>
  )
}
