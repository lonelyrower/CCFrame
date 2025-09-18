import { render, screen } from '@testing-library/react'
import { LightboxMetadata, type LightboxTag, type LightboxSectionKey } from '@/components/gallery/lightbox-metadata'
import type { PhotoWithDetails } from '@/types'

const sections: Record<LightboxSectionKey, boolean> = {
  meta: false,
  camera: false,
  tags: false,
  location: false,
}

const photo = {
  id: 'p1',
  albumId: null,
  album: { id: 'a', title: 'Album', description: 'Desc' } as any,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  takenAt: new Date('2023-12-31T12:00:00Z'),
  width: 1920,
  height: 1080,
  fileKey: 'photos/p1.jpg',
  status: 'COMPLETED',
  visibility: 'PUBLIC',
  blurhash: null,
  exifJson: {
    camera: 'Canon EOS R5',
    lens: '50mm',
    aperture: '1.8',
    shutterSpeed: '1/125',
    iso: 400,
  },
  location: { lat: 10, lng: 20, address: 'Somewhere' },
  variants: [],
  tags: [],
  smartTags: [],
  faces: [],
  versions: [],
} as unknown as PhotoWithDetails

const tags: LightboxTag[] = [
  { id: 't1', name: 'Travel' },
  { id: 't2', name: 'Portrait' },
]

describe('LightboxMetadata', () => {
  const mockCtx = {
    fillStyle: '',
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
  }

  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx as any)
  })

  it('renders photo details and provided tags', () => {
    render(
      <LightboxMetadata
        photo={photo}
        collapsed={sections}
        onToggle={() => {}}
        tags={tags}
      />
    )

    expect(screen.getByText('Photo Details')).toBeInTheDocument()
    expect(screen.getByText('Dimensions')).toBeInTheDocument()
    expect(screen.getByText('1920 x 1080')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Portrait')).toBeInTheDocument()
  })
})
