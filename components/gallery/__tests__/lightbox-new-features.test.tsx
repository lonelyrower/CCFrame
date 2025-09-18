import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { LightboxProvider, useLightbox } from '../lightbox-context'

// Minimal photo shape for tests
const photos = [
  { id: 'p1', width: 100, height: 100, fileKey: 'p1.jpg', hash: 'h', visibility: 'PUBLIC', status: 'COMPLETED', blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', userId: 'u1', createdAt: new Date(), updatedAt: new Date(), tags: [], variants: [], faces: [], albumCovers: [], smartAlbumCovers: [], album: null, exifJson: null },
  { id: 'p2', width: 100, height: 100, fileKey: 'p2.jpg', hash: 'h2', visibility: 'PUBLIC', status: 'COMPLETED', blurhash: null, userId: 'u1', createdAt: new Date(), updatedAt: new Date(), tags: [], variants: [], faces: [], albumCovers: [], smartAlbumCovers: [], album: null, exifJson: null },
] as any

function Harness() {
  const { open, isOpen, helpOpen, toggleHelp } = useLightbox()
  return (
    <div>
      <button onClick={() => open('p1')}>open</button>
      <button onClick={toggleHelp}>help</button>
      <div data-testid="state">{String(isOpen)}|{String(helpOpen)}</div>
    </div>
  )
}

describe('Lightbox new features', () => {
  it('toggles help overlay', () => {
    const { getByText, getByTestId } = render(
      <LightboxProvider photos={photos}>
        <Harness />
      </LightboxProvider>
    )
    fireEvent.click(getByText('open'))
    expect(getByTestId('state').textContent).toBe('true|false')
    fireEvent.click(getByText('help'))
    expect(getByTestId('state').textContent).toBe('true|true')
    fireEvent.click(getByText('help'))
    expect(getByTestId('state').textContent).toBe('true|false')
  })
})
