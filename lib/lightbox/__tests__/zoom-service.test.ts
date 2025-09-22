import { getZoomSources, shouldEnableDeepZoom, detectDeepZoomCapability } from '@/lib/lightbox/zoom-service'

jest.mock('@/lib/utils', () => ({
  getImageUrl: jest.fn((id: string, variant: string, format: string) => `/api/image/${id}/${variant}?format=${format}`),
}))

const basePhoto = {
  id: 'photo-1',
  width: 4200,
  height: 2800,
  variants: [],
} as any

function stubHighEndDevice() {
  const originalDeviceMemory = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory')
  const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency')
  const originalMatchMedia = window.matchMedia
  Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true })
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
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
  const getContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = ((contextId: string, ..._args: unknown[]) => {
    if (contextId === '2d') {
      return {} as CanvasRenderingContext2D
    }
    if (contextId === 'webgl' || contextId === 'webgl2') {
      return {} as WebGLRenderingContext
    }
    return null
  }) as typeof HTMLCanvasElement.prototype.getContext
  return () => {
    if (originalDeviceMemory) {
      Object.defineProperty(navigator, 'deviceMemory', originalDeviceMemory)
    } else {
      delete (navigator as any).deviceMemory
    }
    if (originalHardwareConcurrency) {
      Object.defineProperty(navigator, 'hardwareConcurrency', originalHardwareConcurrency)
    } else {
      delete (navigator as any).hardwareConcurrency
    }
    window.matchMedia = (
      originalMatchMedia ??
      ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList)
    ) as typeof window.matchMedia
    if (getContext) {
      HTMLCanvasElement.prototype.getContext = getContext
    }
  }
}

describe('zoom-service', () => {
  it('prioritises large/original variants and appends zoom query', () => {
    const sources = getZoomSources({
      ...basePhoto,
      variants: [
        { variant: 'medium', format: 'webp', width: 1800, height: 1200 },
        { variant: 'large', format: 'webp', width: 3200, height: 2100 },
        { variant: 'original', format: 'jpeg', width: 6400, height: 4200 },
      ],
    })

    expect(sources).toHaveLength(2)
    const largeSource = sources.find((source) => source.variant === 'large')
    const zoomSource = sources.find((source) => source.variant === 'original')
    expect(largeSource?.url).toBe('/api/image/photo-1/large?format=webp')
    expect(zoomSource?.url).toBe('/api/image/photo-1/original?format=jpeg&variant=zoom')
  })

  it('builds fallback zoom source when variants missing', () => {
    const sources = getZoomSources({ ...basePhoto, variants: [] })
    expect(sources.some((source) => source.variant === 'zoom')).toBe(true)
    const zoomSource = sources.find((source) => source.variant === 'zoom')
    expect(zoomSource?.url).toContain('variant=zoom')
  })

  it('enables deep zoom only on capable and large assets', () => {
    const restore = stubHighEndDevice()
    try {
      expect(shouldEnableDeepZoom(basePhoto)).toBe(true)
      Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true })
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true })
      expect(detectDeepZoomCapability()).toBe('low')
    } finally {
      restore()
    }
  })
})
