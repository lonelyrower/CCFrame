import { act, render, fireEvent, screen, waitFor } from '@testing-library/react'
import { PhotoZoomCanvas } from '@/components/gallery/photo-zoom-canvas'
import type { PhotoWithDetails } from '@/types'

jest.mock('../../../lib/utils', () => ({
  getImageUrl: jest.fn(() => '/image/mock'),
}))

jest.mock('next/image', () => {
  const MockNextImage = ({ onLoad, alt, priority: _priority, ...rest }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} onLoad={onLoad} {...rest} />
  }
  MockNextImage.displayName = 'MockNextImage'
  return MockNextImage
})

const photo: PhotoWithDetails = {
  id: 'photo-1',
  albumId: null,
  album: { id: 'album-1', userId: 'user-1', title: 'Mobile Test', description: null, coverPhotoId: null, createdAt: new Date(), updatedAt: new Date(), visibility: 'PUBLIC' } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
  takenAt: null,
  localPath: null,
  originalFileName: null,
  aspectRatio: null,
  width: 1200,
  height: 800,
  fileKey: 'photos/photo-1.jpg',
  hash: 'hash',
  contentHash: null,
  userId: 'user-1',
  status: 'COMPLETED',
  visibility: 'PUBLIC',
  blurHashDataURL: null,
  blurhash: null,
  exifJson: null,
  location: null,
  dominantColor: null,
  extractedCoordinates: null,
  tags: [],
  variants: [],
}

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  }
  // @ts-ignore jsdom shim for ResizeObserver
  global.ResizeObserver = ResizeObserverMock
  // @ts-ignore layout shim ensuring stable container size
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON() { return '' }
    }
  }
})

describe('PhotoZoomCanvas', () => {
  it('toggles zoom on double tap and centers around gesture', async () => {
    const { getByRole, getAllByRole } = render(<PhotoZoomCanvas photo={photo} />)
    getAllByRole('img').forEach(img => fireEvent.load(img))
    const viewer = getByRole('figure')

    await act(async () => {
      fireEvent.dblClick(viewer, { clientX: 400, clientY: 300 })
    })

    await waitFor(() => {
      expect(screen.getByText('200%')).toBeInTheDocument()
    })
  })

  it('clamps offset when dragging beyond bounds', async () => {
    const { getByRole, getAllByRole } = render(<PhotoZoomCanvas photo={photo} />)
    getAllByRole('img').forEach(img => fireEvent.load(img))
    const viewer = getByRole('figure')

    await act(async () => {
      fireEvent.pointerDown(viewer, { pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100 })
      fireEvent.wheel(viewer, { deltaY: -100 })
      fireEvent.pointerMove(viewer, { pointerId: 1, pointerType: 'mouse', clientX: -1000, clientY: -1000 })
      fireEvent.pointerUp(viewer, { pointerId: 1, pointerType: 'mouse', clientX: -1000, clientY: -1000 })
    })

    await waitFor(() => {
      expect(screen.getByText(/%$/)).toBeInTheDocument()
    })
  })
})

