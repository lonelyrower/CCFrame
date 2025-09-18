import { act, render, screen, fireEvent } from '@testing-library/react'
import { PhotoZoomCanvas } from '../photo-zoom-canvas'

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

const photo = {
  id: 'p1',
  albumId: null,
  album: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  takenAt: null,
  width: 100,
  height: 50,
  fileKey: 'p1.jpg',
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
} as any

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  }
  // @ts-ignore jsdom shim
  global.ResizeObserver = ResizeObserverMock
  // @ts-ignore layout shim
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 600,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 600,
      x: 0,
      y: 0,
      toJSON() { return '' }
    }
  }
})

describe('PhotoZoomCanvas custom zoom', () => {
  it('responds to custom lightbox-zoom events', async () => {
    const { getAllByRole } = render(<PhotoZoomCanvas photo={photo} />)
    getAllByRole('img').forEach(img => fireEvent.load(img))
    await act(async () => {
      const evt = new CustomEvent('lightbox-zoom', { detail: { delta: 0.5 } })
      document.dispatchEvent(evt)
    })
    expect(screen.getByText(/%$/)).toBeInTheDocument()
  })
})

