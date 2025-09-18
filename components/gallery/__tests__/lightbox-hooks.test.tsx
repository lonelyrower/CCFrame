import { renderHook, act } from '@testing-library/react'
import { LightboxProvider, useLightbox } from '../lightbox-context'
import React from 'react'

function createWrapper(photos: any[]) {
  return function W({ children }: { children: React.ReactNode }) {
    return <LightboxProvider photos={photos}>{children}</LightboxProvider>
  }
}

describe('Lightbox context', () => {
  const photos = [
    { id: 'a', width: 100, height: 100 },
    { id: 'b', width: 100, height: 100 },
    { id: 'c', width: 100, height: 100 }
  ] as any

  test('open + navigation', () => {
    const wrapper = createWrapper(photos)
    const { result } = renderHook(() => useLightbox(), { wrapper })
    act(() => { result.current.open('b') })
    expect(result.current.index).toBe(1)
    act(() => { result.current.next() })
    expect(result.current.index).toBe(2)
    act(() => { result.current.prev() })
    expect(result.current.index).toBe(1)
  })
})
