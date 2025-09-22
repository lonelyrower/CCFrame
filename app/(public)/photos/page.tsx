import { Suspense } from 'react'
import { Grid } from 'lucide-react'

import { CatalogAppliedFilters } from '@/components/catalog/applied-filters'
import { CatalogBreadcrumbs } from '@/components/catalog/catalog-breadcrumbs'
import { CatalogHeader } from '@/components/catalog/catalog-header'
import { CatalogFilterPanel } from '@/components/catalog/filter-panel'
import { CatalogFacetSections } from '@/components/catalog/facet-sections'
import { CatalogRecommendationRail } from '@/components/catalog/recommendation-rail'
import { CatalogEventBusProvider } from '@/components/catalog/catalog-event-bus'
import { FavoriteProvider } from '@/components/catalog/favorite-provider'
import { CompareProvider } from '@/components/catalog/compare-provider'
import { CatalogPhotoActions } from '@/components/catalog/photo-actions'
import { CatalogBulkActions } from '@/components/catalog/bulk-actions-bar'
import { CatalogCompareTray } from '@/components/catalog/compare-tray'
import { CatalogSearchBar } from '@/components/catalog/search-bar'
import { CatalogShell } from '@/components/catalog/catalog-shell'
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { Lightbox } from '@/components/gallery/lightbox'
import { LightboxProvider } from '@/components/gallery/lightbox-context'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import {
  buildCatalogFacetSections,
  buildCatalogQuickLinks,
  buildCatalogRecommendations,
  buildCatalogSearchSuggestions,
  buildCatalogStats,
  catalogNumberFormatter,
  getArrayParam,
  getCatalogFilterOptions,
  getCatalogResults,
  getStringParam,
  normalizeSort,
  normalizeView,
} from '@/lib/catalog-data'
import type { CatalogSearchSuggestion } from '@/lib/catalog-search'
import type {
  CatalogActiveFilters,
  CatalogNormalizedParams,
  CatalogSortValue,
  CatalogViewValue,
} from '@/types/catalog'

type SearchParams = {
  [key: string]: string | string[] | undefined
  view?: string | string[]
  sort?: string | string[]
  album?: string | string[]
  tag?: string | string[]
  tags?: string | string[]
  colors?: string | string[]
  search?: string | string[]
}

function PhotosLoading() {
  return (
    <div className="space-y-10 pb-20 pt-10 sm:pt-16">
      <Container size="xl" bleed="none" className="flex flex-col gap-4">
        <div className="h-3 w-24 rounded-full bg-surface-outline/30" />
        <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/60 p-8 shadow-subtle">
          <div className="space-y-4">
            <div className="h-9 w-52 rounded-lg bg-surface-outline/30" />
            <div className="h-4 w-80 rounded-lg bg-surface-outline/30" />
            <div className="flex flex-wrap gap-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-16 w-44 rounded-lg bg-surface-outline/20" />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/60 p-6 shadow-subtle">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="h-4 w-36 rounded-lg bg-surface-outline/30" />
            <div className="h-9 w-64 rounded-lg bg-surface-outline/20" />
          </div>
          <div className="mt-4 h-12 rounded-lg bg-surface-outline/20" />
        </div>
      </Container>

      <Container size="xl" bleed="none" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-32 rounded-xl border border-surface-outline/40 bg-surface-panel/70" />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="h-48 rounded-xl border border-surface-outline/40 bg-surface-panel/70" />
          ))}
        </div>
      </Container>

      <Container size="xl" bleed="none">
        <div className="rounded-xl border border-surface-outline/30 bg-surface-panel/60 p-6 shadow-subtle">
          <MasonryGallery photos={[]} loading />
        </div>
      </Container>
    </div>
  )
}

async function PhotosContent({ searchParams }: { searchParams: SearchParams }) {
  const normalized: CatalogNormalizedParams = {
    sort: normalizeSort(getStringParam(searchParams.sort)),
    view: normalizeView(getStringParam(searchParams.view)),
    search: getStringParam(searchParams.search)?.trim() || undefined,
    album: getStringParam(searchParams.album) || undefined,
    tags: getArrayParam(searchParams.tags ?? searchParams.tag),
    colors: getArrayParam(searchParams.colors),
  }

  const [{ photos, total }, filterOptions] = await Promise.all([
    getCatalogResults(normalized),
    getCatalogFilterOptions(),
  ])

  const stats = buildCatalogStats(total, filterOptions)
  const quickLinks = buildCatalogQuickLinks(filterOptions)
  const searchSuggestions = buildCatalogSearchSuggestions(normalized, filterOptions)
  const recommendations = buildCatalogRecommendations(normalized, filterOptions)
  const facets = buildCatalogFacetSections(normalized, filterOptions, photos)
  const headerDescription = `探索 ${catalogNumberFormatter.format(total)} 张公开作品，按专辑、标签或搜索快速定位适配场景。`

  const activeFilters: CatalogActiveFilters & { sort: CatalogSortValue } = {
    album: normalized.album,
    tags: normalized.tags,
    colors: normalized.colors,
    sort: normalized.sort,
  }

  const appliedFiltersForMeta: CatalogActiveFilters & { search?: string } = {
    album: activeFilters.album,
    tags: activeFilters.tags,
    colors: activeFilters.colors,
    search: normalized.search,
  }

  return (
    <CatalogEventBusProvider>
      <FavoriteProvider>
        <CompareProvider>
          <LightboxProvider photos={photos}>
            <CatalogShell
              breadcrumbs={<CatalogBreadcrumbs items={[{ label: '首页', href: '/' }, { label: '作品目录' }]} />}
              header={
                <AnimateOnScroll>
                  <CatalogHeader title="作品目录" description={headerDescription} stats={stats} quickLinks={quickLinks} />
                </AnimateOnScroll>
              }
              toolbar={
                <AnimateOnScroll delay={0.06}>
                  <CatalogToolbar
                    view={normalized.view}
                    total={total}
                    search={
                      <CatalogSearchBar
                        initialValue={normalized.search ?? ''}
                        suggestions={searchSuggestions}
                      />
                    }
                    meta={
                      <CatalogAppliedFilters
                        active={appliedFiltersForMeta}
                        albums={filterOptions.albums}
                        tags={filterOptions.tags}
                        colors={filterOptions.colors}
                      />
                    }
                  />
                </AnimateOnScroll>
              }
              sidebar={
                <CatalogFilterPanel
                  albums={filterOptions.albums}
                  tags={filterOptions.tags}
                  colors={filterOptions.colors}
                  active={activeFilters}
                />
              }
              tray={<CatalogCompareTray />}
            >
              <CatalogBulkActions />

              {recommendations.length > 0 ? (
                <AnimateOnScroll delay={0.08}>
                  <CatalogRecommendationRail items={recommendations} />
                </AnimateOnScroll>
              ) : null}

              {facets.length > 0 ? (
                <AnimateOnScroll delay={0.1}>
                  <CatalogFacetSections items={facets} />
                </AnimateOnScroll>
              ) : null}

              <AnimateOnScroll delay={0.12}>
                {photos.length === 0 ? (
                  <Surface tone="panel" padding="lg" className="flex flex-col items-center gap-4 text-center shadow-subtle">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-canvas">
                      <Grid className="h-12 w-12 text-text-muted" />
                    </div>
                    <Heading size="sm">暂时没有匹配的作品</Heading>
                    <Text tone="secondary" size="sm">
                      尝试调整筛选条件或切换展示模式，亦可联系团队获得定制推荐。
                    </Text>
                  </Surface>
                ) : (
                  <MasonryGallery
                    photos={photos}
                    renderOverlay={(photo) => <CatalogPhotoActions photo={photo} />}
                  />
                )}
              </AnimateOnScroll>
            </CatalogShell>

            <Lightbox />
          </LightboxProvider>
        </CompareProvider>
      </FavoriteProvider>
    </CatalogEventBusProvider>
  )
}

export default function PhotosPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PhotosLoading />}>
      <PhotosContent searchParams={searchParams} />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'

