"use client"

import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'

import { CatalogFilterPanel } from '@/components/catalog/filter-panel'
import type { CatalogAlbumOption, CatalogColorOption, CatalogSortValue, CatalogTagOption } from '@/types/catalog'

const sampleAlbums: CatalogAlbumOption[] = [
  { id: 'album-1', title: '极光之夜', count: 64 },
  { id: 'album-2', title: '都市漫游', count: 48 },
  { id: 'album-3', title: '海岸线', count: 32 },
]

const sampleTags: CatalogTagOption[] = [
  { id: 'tag-1', name: 'portrait', color: '#F97316', count: 56 },
  { id: 'tag-2', name: 'landscape', color: '#22D3EE', count: 72 },
  { id: 'tag-3', name: 'editorial', color: '#A855F7', count: 38 },
  { id: 'tag-4', name: 'black-white', color: '#64748B', count: 24 },
  { id: 'tag-5', name: 'architecture', color: '#0EA5E9', count: 29 },
  { id: 'tag-6', name: 'lifestyle', color: '#34D399', count: 41 },
  { id: 'tag-7', name: 'travel', color: '#FACC15', count: 53 },
  { id: 'tag-8', name: 'nature', color: '#22C55E', count: 61 },
  { id: 'tag-9', name: 'product', color: '#FB7185', count: 26 },
  { id: 'tag-10', name: 'event', color: '#F97316', count: 18 },
  { id: 'tag-11', name: 'conceptual', color: '#A855F7', count: 12 },
  { id: 'tag-12', name: 'aerial', color: '#38BDF8', count: 9 },
  { id: 'tag-13', name: 'macro', color: '#4ADE80', count: 7 },
]

const sampleColors: CatalogColorOption[] = [
  { value: '#F97316', label: '琥珀橙', count: 88 },
  { value: '#22D3EE', label: '天际青', count: 64 },
  { value: '#A855F7', label: '梦幻紫', count: 47 },
  { value: '#34D399', label: '森林绿', count: 52 },
  { value: '#FACC15', label: '金色光', count: 33 },
  { value: '#64748B', label: '雾蓝灰', count: 21 },
]

const activeState = {
  album: 'album-1',
  tags: ['portrait', 'landscape'] as string[],
  colors: ['#F97316'] as string[],
  sort: 'newest' as CatalogSortValue,
}

const meta = {
  title: 'Catalog/FilterPanel',
  component: CatalogFilterPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-surface-canvas p-6">
        <div className="mx-auto max-w-screen-lg">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof CatalogFilterPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: {
    albums: sampleAlbums,
    tags: sampleTags,
    colors: sampleColors,
    active: activeState,
  },
}

export const Mobile: Story = {
  args: {
    albums: sampleAlbums,
    tags: sampleTags,
    colors: sampleColors,
    active: activeState,
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphoneX',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = await canvas.findByRole('button', { name: /筛选/ })
    await userEvent.click(trigger)
  },
}
