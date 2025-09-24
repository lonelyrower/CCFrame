import type { Meta, StoryObj } from '@storybook/react'
import { useMemo, useEffect } from 'react'

import { LightboxProvider, useOptionalLightbox } from '@/components/gallery/lightbox-context'
import { Lightbox } from '@/components/gallery/lightbox'
import { PreferenceProvider } from '@/components/context/preference-provider'
import { Surface } from '@/components/ui/surface'
import { Button } from '@/components/ui/button'
import { PhotoWithDetails } from '@/types'

const SAMPLE_PHOTOS: PhotoWithDetails[] = Array.from({ length: 4 }).map((_, index) => ({
  id: `sample-${index + 1}`,
  hash: `hash-${index}`,
  contentHash: null,
  fileKey: 'sample.jpg',
  width: 3200,
  height: 2133,
  albumId: 'album-1',
  album: {
    id: 'album-1',
    title: 'Story Preview',
    description: '示例故事模式',
    slug: 'story-preview',
  } as any,
  userId: 'user-1',
  visibility: 'PUBLIC',
  status: 'COMPLETED',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  takenAt: new Date('2024-01-01T00:00:00Z'),
  location: null,
  blurhash: null,
  variants: [],
  tags: [
    { tag: { id: 'tag-urban', name: 'urban', color: '#4f46e5' } },
    { tag: { id: 'tag-night', name: 'night', color: '#06b6d4' } },
  ] as any,
  faces: [],
  albumCovers: [],
  smartAlbumCovers: [],
  exifJson: {
    camera: 'Fujifilm X-T5',
    lens: 'XF 23mm F1.4',
    focalLength: 23,
    aperture: 1.4,
    shutterSpeed: '1/160',
    iso: 400,
  },
}))

const meta: Meta = {
  title: 'Lightbox/Playground',
  decorators: [
    (Story) => (
      <PreferenceProvider>
        <div className="min-h-screen bg-contrast-surface text-text-inverted">
          <Story />
        </div>
      </PreferenceProvider>
    ),
  ],
}

export default meta

type Story = StoryObj

function LightboxPlayground() {
  const photos = useMemo(() => SAMPLE_PHOTOS, [])

  return (
    <LightboxProvider photos={photos}>
      <Surface tone="transparent" className="flex min-h-screen flex-col items-center justify-center gap-6">
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Lightbox Stage 5 Playground</h1>
          <p className="max-w-xl text-sm text-text-inverted/70">
            点击下方按钮打开光箱，体验分镜视图、标签故事 Tooltip、深度放大与偏好设置联动。
          </p>
        </div>
        <div className="flex gap-4">
          {photos.map((photo, index) => (
            <Button key={photo.id} onClick={() => document.dispatchEvent(new CustomEvent('storybook-open-lightbox', { detail: { index } }))}>
              打开第 {index + 1} 张
            </Button>
          ))}
        </div>
        <LightboxHijack />
      </Surface>
    </LightboxProvider>
  )
}

function LightboxHijack() {
  const lightbox = useOptionalLightbox()

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ index: number }>).detail
      if (detail?.index != null && lightbox) {
        lightbox.openAt(detail.index)
      }
    }
    document.addEventListener('storybook-open-lightbox', handler as EventListener)
    return () => document.removeEventListener('storybook-open-lightbox', handler as EventListener)
  }, [lightbox])

  return <Lightbox />
}

export const Playground: Story = {
  render: () => <LightboxPlayground />,
}
