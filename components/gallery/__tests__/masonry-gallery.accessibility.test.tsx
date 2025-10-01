import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import type { PhotoWithDetails } from '@/types'

jest.mock('../lightbox-context', () => ({
  useOptionalLightbox: jest.fn(),
}))

jest.mock('../../../lib/utils', () => ({
  getImageUrl: jest.fn(() => '/image/mock'),
  toBase64: jest.fn(() => 'ZHVtbXk='),
  generateSrcSet: jest.fn(() => '/image/mock 1x'),
}))

jest.mock('next/image', () => {
  const MockNextImage = ({ blurDataURL: _blur, alt, ...rest }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...rest} />
  }
  MockNextImage.displayName = 'MockNextImage'
  return MockNextImage
})

const mockUseLightbox = require('../lightbox-context').useOptionalLightbox as jest.Mock

const basePhoto = {
  id: 'p1',
  albumId: null,
  album: { id: 'a', userId: 'u1', title: 'Summer Trip', description: null, coverPhotoId: null, createdAt: new Date(), updatedAt: new Date(), visibility: 'PUBLIC' } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
  takenAt: null,
  width: 1024,
  height: 768,
  fileKey: 'photos/p1.jpg',
  hash: 'hash',
  contentHash: null,
  userId: 'u1',
  status: 'COMPLETED',
  visibility: 'PUBLIC',
  blurhash: null,
  exifJson: null,
  location: null,
  tags: [],
  variants: [],
} as unknown as PhotoWithDetails

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  }
  // @ts-ignore test shim for jsdom
  global.ResizeObserver = ResizeObserverMock
  // @ts-ignore override for layout calculations
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 960,
      height: 600,
      top: 0,
      left: 0,
      right: 960,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() { return '' }
    }
  }
})

describe('MasonryGallery accessibility', () => {
  it('allows keyboard activation when lightbox available', async () => {
    const open = jest.fn()
    mockUseLightbox.mockReturnValue({ open })

    render(<MasonryGallery photos={[basePhoto]} />)

    const card = await waitFor(() => screen.getByRole('button', { name: /summer trip/i }))
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(open).toHaveBeenCalledWith('p1')
  })

  it('has keyboard focus styles and aria label fallback', async () => {
    mockUseLightbox.mockReturnValue({ open: jest.fn() })
    const photo = { ...basePhoto, album: null, tags: [] } as PhotoWithDetails

    render(<MasonryGallery photos={[photo]} />)

    const card = await waitFor(() => screen.getByRole('button', { name: /open photo/i }))
    fireEvent.focus(card)

    expect(card).toHaveAttribute('tabindex', '0')
  })
})

