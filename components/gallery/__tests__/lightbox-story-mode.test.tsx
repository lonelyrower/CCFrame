import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { LightboxProvider, useLightbox } from '../lightbox-context'

const photos = [
  {
    id: 's1',
    width: 1200,
    height: 800,
    fileKey: 's1.jpg',
    hash: 'hash1',
    visibility: 'PUBLIC',
    status: 'COMPLETED',
    blurhash: null,
    userId: 'u1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    albumId: 'a1',
    album: { id: 'a1', title: 'Chapter One', slug: 'chapter-one' },
    tags: [{ tag: { id: 't1', name: 'look-one' } }],
    variants: [],
    faces: [],
    albumCovers: [],
    smartAlbumCovers: [],
    exifJson: null,
  },
  {
    id: 's2',
    width: 1100,
    height: 780,
    fileKey: 's2.jpg',
    hash: 'hash2',
    visibility: 'PUBLIC',
    status: 'COMPLETED',
    blurhash: null,
    userId: 'u1',
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-04T00:00:00Z'),
    albumId: 'a1',
    album: { id: 'a1', title: 'Chapter One', slug: 'chapter-one' },
    tags: [{ tag: { id: 't2', name: 'look-two' } }],
    variants: [],
    faces: [],
    albumCovers: [],
    smartAlbumCovers: [],
    exifJson: null,
  },
] as any

function StoryHarness() {
  const {
    open,
    index,
    storyIndex,
    storySequence,
    mode,
    setMode,
    nextStoryEntry,
  } = useLightbox()

  return (
    <div>
      <button onClick={() => open('s1')}>open</button>
      <button onClick={() => setMode('story')}>story</button>
      <button onClick={nextStoryEntry}>next-story</button>
      <div data-testid="photo-index">{index}</div>
      <div data-testid="story-index">{storyIndex}</div>
      <div data-testid="story-length">{storySequence?.entries.length ?? 0}</div>
      <div data-testid="mode">{mode}</div>
    </div>
  )
}

describe('Lightbox story mode', () => {
  it('initialises story sequence from photos and advances story index', () => {
    const { getByText, getByTestId } = render(
      <LightboxProvider photos={photos}>
        <StoryHarness />
      </LightboxProvider>
    )

    expect(getByTestId('story-length').textContent).toBe('2')

    fireEvent.click(getByText('open'))
    fireEvent.click(getByText('story'))

    expect(getByTestId('mode').textContent).toBe('story')
    expect(getByTestId('photo-index').textContent).toBe('0')
    expect(getByTestId('story-index').textContent).toBe('0')

    fireEvent.click(getByText('next-story'))
    expect(getByTestId('story-index').textContent).toBe('1')
    expect(getByTestId('photo-index').textContent).toBe('1')
  })
})
