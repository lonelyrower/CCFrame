import { renderHook, act } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { usePhotos, usePhoto } from '../use-photos'
import { ReactNode } from 'react'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock performance monitor
jest.mock('@/lib/performance-monitor', () => ({
  trackApiCall: () => ({
    onComplete: jest.fn(),
    onError: jest.fn()
  })
}))

const createWrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig
    value={{
      provider: () => new Map(),
      dedupingInterval: 0,
      revalidateOnFocus: false,
      errorRetryCount: 0
    }}
  >
    {children}
  </SWRConfig>
)

describe('usePhotos', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should fetch photos successfully', async () => {
    const mockPhotos = [
      {
        id: '1',
        title: 'Test Photo 1',
        width: 800,
        height: 600,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        takenAt: '2023-01-01T00:00:00Z',
        tags: [],
        variants: []
      },
      {
        id: '2',
        title: 'Test Photo 2',
        width: 1200,
        height: 900,
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        takenAt: null,
        tags: [],
        variants: []
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        photos: mockPhotos,
        nextCursor: 'cursor123',
        total: 100
      })
    } as Response)

    const { result } = renderHook(() => usePhotos({ limit: 10 }), {
      wrapper: createWrapper
    })

    // Initial state
    expect(result.current.photos).toEqual([])
    expect(result.current.isLoading).toBe(true)

    // Wait for data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.photos).toHaveLength(2)
    expect(result.current.photos[0].title).toBe('Test Photo 1')
    expect(result.current.nextCursor).toBe('cursor123')
    expect(result.current.total).toBe(100)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePhotos(), {
      wrapper: createWrapper
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.photos).toEqual([])
    expect(result.current.error).toBeDefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('should load more photos', async () => {
    const initialPhotos = [
      {
        id: '1',
        title: 'Photo 1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        tags: [],
        variants: []
      }
    ]

    const additionalPhotos = [
      {
        id: '2',
        title: 'Photo 2',
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        tags: [],
        variants: []
      }
    ]

    // Initial fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          photos: initialPhotos,
          nextCursor: 'cursor123',
          total: 10
        })
      } as Response)
      // Load more fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          photos: additionalPhotos,
          nextCursor: null,
          total: 10
        })
      } as Response)

    const { result } = renderHook(() => usePhotos(), {
      wrapper: createWrapper
    })

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.photos).toHaveLength(1)
    expect(result.current.hasMore).toBe(true)

    // Load more
    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.photos).toHaveLength(2)
    expect(result.current.hasMore).toBe(false)
  })

  it('should build correct query string', () => {
    renderHook(
      () => usePhotos({
        album: 'album1',
        tag: 'nature',
        search: 'sunset',
        limit: 20
      }),
      { wrapper: createWrapper }
    )

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/photos?'),
      expect.any(Object)
    )

    const calledUrl = (mockFetch.mock.calls[0][0] as string)
    expect(calledUrl).toContain('album=album1')
    expect(calledUrl).toContain('tag=nature')
    expect(calledUrl).toContain('search=sunset')
    expect(calledUrl).toContain('limit=20')
  })
})

describe('usePhoto', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should fetch single photo', async () => {
    const mockPhoto = {
      id: '1',
      title: 'Test Photo',
      width: 800,
      height: 600,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      tags: [],
      variants: []
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhoto
    } as Response)

    const { result } = renderHook(() => usePhoto('1'), {
      wrapper: createWrapper
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.photo).toEqual(expect.objectContaining({
      id: '1',
      title: 'Test Photo'
    }))
    expect(result.current.isLoading).toBe(false)
  })

  it('should not fetch when photoId is empty', () => {
    renderHook(() => usePhoto(''), {
      wrapper: createWrapper
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})