import { useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LightboxProvider, useLightbox } from '../lightbox-context'
import { useLightboxController } from '../use-lightbox-controller'

const photos = [
  {
    id: 'p-1',
    width: 3600,
    height: 2400,
    fileKey: 'p-1.jpg',
    hash: 'hash1',
    visibility: 'PUBLIC',
    status: 'COMPLETED',
    blurhash: null,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    albumId: 'album-1',
    album: { id: 'album-1', title: 'Chapter One', slug: 'chapter-one' },
    tags: [{ tag: { id: 'tag-1', name: 'look-one' } }],
    variants: [],
    faces: [],
    albumCovers: [],
    smartAlbumCovers: [],
    exifJson: null,
  },
  {
    id: 'p-2',
    width: 3400,
    height: 2260,
    fileKey: 'p-2.jpg',
    hash: 'hash2',
    visibility: 'PUBLIC',
    status: 'COMPLETED',
    blurhash: null,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    albumId: 'album-1',
    album: { id: 'album-1', title: 'Chapter One', slug: 'chapter-one' },
    tags: [{ tag: { id: 'tag-2', name: 'look-two' } }],
    variants: [],
    faces: [],
    albumCovers: [],
    smartAlbumCovers: [],
    exifJson: null,
  },
] as any

function ControllerHarness() {
  const { open, mode, storyIndex } = useLightbox()
  useLightboxController()

  useEffect(() => {
    open('p-1')
  }, [open])

  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="story-index">{storyIndex}</span>
    </div>
  )
}

describe('useLightboxController', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
  })

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia
    } else {
      // @ts-expect-error cleanup for testing environment
      delete window.matchMedia
    }
    jest.restoreAllMocks()
  })

  it('uses Shift + ArrowRight to jump story chapter and enter story mode', async () => {
    render(
      <LightboxProvider photos={photos}>
        <ControllerHarness />
      </LightboxProvider>
    )

    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('lightbox'))

    fireEvent.keyDown(window, { key: 'ArrowRight', shiftKey: true })

    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('story'))
    expect(screen.getByTestId('story-index').textContent).toBe('1')
  })
})
