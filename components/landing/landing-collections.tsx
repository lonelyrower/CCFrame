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
    <section>
      <Container size="xl" bleed="none" className="py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Overline>Signature Collections</Overline>
            <Heading size="lg">精选故事集</Heading>
            <Text tone="secondary">按主题、情绪或项目归纳的相册，快速了解我们的叙事方式。</Text>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link href="/photos">
              浏览图库
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {albums.length === 0 ? (
          <div className="mt-10">
            <Surface padding="lg" className="text-center">
              <Heading size="sm">暂未收录公共相册</Heading>
              <Text tone="secondary" size="sm" className="mt-2">
                当你上传并公开作品后，这里将自动推荐最受欢迎的合集。
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
                            <Text tone="secondary">等待第一个封面</Text>
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
                          ) : null}
                        </div>
                        <div className="mt-8 flex items-center justify-between text-sm text-text-secondary">
                          <span>以现实项目为单位的故事合集</span>
                          <Link href={`/photos?album=${album.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                            查看相册
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
