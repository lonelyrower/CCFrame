import type { TagStory } from '@/types/lightbox'
import { getTagStory } from '@/lib/lightbox/tag-story-service'

jest.mock('@/lib/db', () => ({
  db: {
    tag: {
      findUnique: jest.fn(),
    },
    photo: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

const mockedDb = jest.requireMock('@/lib/db').db as {
  tag: { findUnique: jest.Mock }
  photo: { count: jest.Mock; findFirst: jest.Mock }
}

describe('getTagStory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('builds tag story with highlight photo and patch', async () => {
    mockedDb.tag.findUnique.mockResolvedValue({
      id: 'tag-1',
      name: 'urban',
      color: '#445566',
    })
    mockedDb.photo.count.mockResolvedValue(12)
    mockedDb.photo.findFirst.mockResolvedValue({
      id: 'photo-1',
      width: 2048,
      height: 1365,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      album: { id: 'album-1', title: 'City Lines' },
      tags: [
        {
          tag: { id: 'tag-1', name: 'urban' },
        },
        {
          tag: { id: 'tag-2', name: 'night' },
        },
      ],
    })

    const story = (await getTagStory({ tagId: 'tag-1' })) as TagStory

    expect(story).toBeTruthy()
    expect(story.tagName).toBe('urban')
    expect(story.photoCount).toBe(12)
    expect(story.highlightPhoto?.id).toBe('photo-1')
    expect(story.relatedTags).toEqual(['night'])
    expect(story.cta.patch?.tags).toEqual(['urban'])
    expect(story.cta.href).toContain('tags=urban')
  })

  it('returns null when tag not found', async () => {
    mockedDb.tag.findUnique.mockResolvedValue(null)

    const story = await getTagStory({ tagId: 'missing' })
    expect(story).toBeNull()
  })
})
