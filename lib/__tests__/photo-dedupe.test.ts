const mockPhoto = {
  findFirst: jest.fn(),
  update: jest.fn(),
}

jest.mock('@/lib/db', () => ({ db: { photo: mockPhoto } }))

describe('photo dedupe helpers', () => {
  beforeEach(() => {
    mockPhoto.findFirst.mockReset()
    mockPhoto.update.mockReset()
  })

  afterEach(() => {
    jest.resetModules()
  })

  it('returns false when content hash missing', async () => {
    const { checkDuplicatePhoto } = await import('../photo-dedupe')
    const result = await checkDuplicatePhoto('user-1', '')
    expect(result).toEqual({ duplicate: false })
    expect(mockPhoto.findFirst).not.toHaveBeenCalled()
  })

  it('returns false when no matching photo', async () => {
    mockPhoto.findFirst.mockResolvedValue(null)
    const { checkDuplicatePhoto } = await import('../photo-dedupe')
    const result = await checkDuplicatePhoto('user-1', 'hash123')
    expect(result).toEqual({ duplicate: false })
    expect(mockPhoto.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        contentHash: 'hash123',
        status: { in: ['PROCESSING', 'COMPLETED'] }
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    })
  })

  it('returns duplicate with existing id when photo found', async () => {
    mockPhoto.findFirst.mockResolvedValue({ id: 'photo-1' })
    const { checkDuplicatePhoto } = await import('../photo-dedupe')
    const result = await checkDuplicatePhoto('user-1', 'hash123')
    expect(result).toEqual({ duplicate: true, existingPhotoId: 'photo-1' })
  })

  it('updates album when handleDuplicateReuse called with target', async () => {
    const { handleDuplicateReuse } = await import('../photo-dedupe')
    await handleDuplicateReuse('photo-1', 'album-2')
    expect(mockPhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: { albumId: 'album-2' }
    })
  })

  it('does nothing when handleDuplicateReuse called without target', async () => {
    const { handleDuplicateReuse } = await import('../photo-dedupe')
    await handleDuplicateReuse('photo-1')
    expect(mockPhoto.update).not.toHaveBeenCalled()
  })
})
